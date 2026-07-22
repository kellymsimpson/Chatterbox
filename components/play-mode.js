/**
 * Play mode — Stages 1–6 (PRD §9.4–§9.5)
 *
 * Stage 1 closed surface: DecorateCanvas (placement fills + cleaned stickers).
 * Stage 2–5 motion: Chatterbox stables via StableFrameCompositor
 * (same path as sandbox/step4-motion-cycles.html — placement masks, not quads).
 * Sequences: V33↔V34 (H) / V33↔V36 (V), 120ms squash-pop + 200ms hold.
 * Stages 1–5: NO container rotation — H/V axis opens only. All rotation is Stage 6 (REVEAL_MAP).
 * Stage 6: REVEAL_MAP rotation → lift → parity land → fortune on desk → actions.
 *
 * Review (skip spell): ?review=V34 | ?review=V36 | ?review=open — number pick → Stage 4 count → Stage 5 → Stage 6.
 * Fastest path to reveal: review open + two number picks (no separate ?review=reveal helper).
 * Fastest path to reveal: same review URLs (two number picks). No separate ?review=reveal helper.
 */

import { DecorateCanvas } from './decorate-canvas.js?v=r9e';
import {
  Chatterbox,
  STABLE_HOLD_MS,
  REVEAL_MAP,
  REVEAL_ROTATE_MS,
  REVEAL_FORTUNE_BEAT_MS,
} from './chatterbox.js?v=s39';
import { STABLE_FRAMES } from './stable-frame.js?v=s39';
import { mountNumberPick } from './number-pick.js?v=s39';
import { fetchChatterbox, countChatterboxesForMaker } from './supabase-api.js?v=s30';
import { PAINT_COLORS } from './magic-paint.js';
import { getMakerToken } from './identity.js';
import { revealFacesForNumber } from './reveal-frame.js?v=s39';

/** Stage 1 — existing Body 1 copy on `.play-instruction`. */
const INSTR_STAGE_1 = 'Select a flap color to spell.';
/** Stage 3 — Figma 417:4683 */
const INSTR_STAGE_3 = 'Select a number to count to.';
/** Stage 5 — Figma 514:17597 (exact apostrophe as in file) */
const INSTR_STAGE_5 = "Select a flap to reveal it's fortune.";

const COLOR_LABELS = {
  pink: 'Pink',
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  purple: 'Purple',
};
function tokenHex(cssVar) {
  return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim().toLowerCase();
}

/** Build hex → { id, label } from design tokens (Decorate stores hex in flap_colors). */
function buildColorLookup() {
  const map = new Map();
  for (const c of PAINT_COLORS) {
    const hex = tokenHex(c.css);
    if (!hex) continue;
    map.set(hex, { id: c.id, label: COLOR_LABELS[c.id] || c.id });
  }
  return map;
}

function normalizeStickers(stickers) {
  if (!Array.isArray(stickers)) return [];
  return stickers
    .map((s) => ({
      id: s.id || s.sticker_id,
      flap: s.flap,
      u: s.u,
      v: s.v,
      scale: s.scale,
    }))
    .filter((s) => s.id && s.flap);
}

function decorationFromRecord(record) {
  return {
    flap_colors: record.flap_colors || {},
    stickers: normalizeStickers(record.stickers),
  };
}

/**
 * @param {{
 *   stageEl: HTMLElement,
 *   stageWrapEl: HTMLElement,
 *   colorNameEl: HTMLElement,
 *   instructionEl: HTMLElement,
 *   statusEl: HTMLElement,
 *   fortuneEl?: HTMLElement|null,
 *   actionsEl?: HTMLElement|null,
 * }} els
 */
export function mountPlayMode(els) {
  const {
    stageEl,
    stageWrapEl,
    colorNameEl,
    instructionEl,
    statusEl,
    fortuneEl,
    actionsEl,
  } = els;
  const colorLookup = buildColorLookup();
  const wrap = stageWrapEl || stageEl.parentElement;
  const params = new URLSearchParams(location.search);
  const review = params.get('review'); // V34 | V36 | open

  /** @type {{
   *   stage: number,
   *   record: object|null,
   *   canvas: DecorateCanvas|null,
   *   cb: Chatterbox|null,
   *   selectedFlap: string|null,
   *   selectedColor: { id: string, label: string, hex: string }|null,
   *   landAxis: 'H'|'V'|null,
   *   landFrame: string|null,
   *   numberPick: ReturnType<typeof mountNumberPick>|null,
   *   selectedNumber: number|null,
   *   selectedNumber2: number|null,
   * }} */
  const state = {
    stage: 0,
    record: null,
    canvas: null,
    cb: null,
    selectedFlap: null,
    selectedColor: null,
    landAxis: null,
    landFrame: null,
    numberPick: null,
    selectedNumber: null,
    selectedNumber2: null,
  };

  function setStatus(html, { error = false } = {}) {
    if (!statusEl) return;
    if (!html) {
      statusEl.hidden = true;
      statusEl.innerHTML = '';
      return;
    }
    statusEl.hidden = false;
    statusEl.innerHTML = html;
    statusEl.dataset.error = error ? '1' : '0';
  }

  /** Show / hide Body 1 instruction (Stage 1 / 3 / 5). Stage 2 & 4 hide it. */
  function setInstruction(text) {
    if (!instructionEl) return;
    if (!text) {
      instructionEl.hidden = true;
      return;
    }
    instructionEl.textContent = text;
    instructionEl.hidden = false;
  }

  function colorForFlap(flap) {
    const hex = (state.record?.flap_colors?.[flap] || '').trim().toLowerCase();
    if (!hex) return null;
    const meta = colorLookup.get(hex);
    if (meta) return { ...meta, hex };
    return { id: 'colour', label: 'Colour', hex };
  }

  function mountMotionEngine(decoration) {
    stageEl.innerHTML = '';
    state.canvas = null;
    // Stages 1–5 never rotate the wrap — clear any stale transform.
    wrap.style.transform = '';
    wrap.style.transformOrigin = '';
    state.cb = new Chatterbox(stageEl, decoration, { layoutEl: wrap });
  }

  /**
   * Static open-state review — skip Stage 1 / spell.
   * ?review=V34 | ?review=V36 | ?review=open (defaults to V34).
   * Mounts Fortune Selector; pick starts Stage 4 Count It Out → Stage 5.
   */
  async function showOpenReview(frameName) {
    const decoration = decorationFromRecord(state.record);
    mountMotionEngine(decoration);
    const axis = frameName === 'V36' ? 'V' : 'H';
    // Same slot as Stage 1 instruction — hide desk label during number pick.
    colorNameEl.textContent = '';
    colorNameEl.classList.remove('is-visible');
    await state.cb.showFrame(frameName);
    state.stage = 3;
    state.landAxis = axis;
    state.landFrame = frameName;
    stageEl.classList.add('is-locked');
    stageEl.removeAttribute('tabindex');
    stageEl.removeAttribute('role');
    stageEl.setAttribute('aria-label', `${frameName} open-state review`);

    startNumberPick();
  }

  /**
   * Stage 2 — Spell It Out (PRD §9.4).
   * Letter i (0-based): even → H (V34), odd → V (V36). Last cycle stays open.
   * Even letter count → land V36; odd → land V34.
   * Timing: SWAP_SQUASH_MS (120) + STABLE_HOLD_MS (200) — locked in chatterbox.js.
   * No container rotation — flap color / bottom pick does not rotate or reshuffle.
   */
  async function spellItOut() {
    const letters = [...state.selectedColor.label.toUpperCase()];
    const decoration = decorationFromRecord(state.record);

    mountMotionEngine(decoration);
    // Closed resting frame before first letter open (placement compositor).
    await state.cb.showFrame('V33');

    colorNameEl.textContent = '';
    colorNameEl.classList.add('is-visible');

    let spelled = '';
    let landAxis = 'H';

    for (let i = 0; i < letters.length; i++) {
      // Letter 1 = H, letter 2 = V, letter 3 = H, … (index parity).
      const axis = i % 2 === 0 ? 'H' : 'V';
      const openFrame = axis === 'H' ? 'V34' : 'V36';
      landAxis = axis;

      spelled += letters[i];
      colorNameEl.textContent = spelled;

      // Direct stable swap (120ms squash-pop) — intermediates cut from runtime.
      await state.cb.swapFrame(openFrame);
      await new Promise((r) => setTimeout(r, STABLE_HOLD_MS));

      const isLast = i === letters.length - 1;
      if (!isLast) {
        await state.cb.swapFrame('V33');
        await new Promise((r) => setTimeout(r, STABLE_HOLD_MS));
      }
    }

    // Land open for Stage 3 number pick.
    state.landAxis = landAxis;
    state.landFrame = landAxis === 'H' ? 'V34' : 'V36';
    state.stage = 3;

    stageEl.dispatchEvent(
      new CustomEvent('play:spelled', {
        detail: {
          color: state.selectedColor,
          letters: spelled,
          landAxis: state.landAxis,
          landFrame: state.landFrame,
          stage: state.stage,
        },
        bubbles: true,
      }),
    );

    startNumberPick();
  }

  /**
   * Stage 6 — Fortune Reveal (PRD §9.4 + REVEAL_MAP).
   * After Stage 5 selected beat: rotate (Stage-6-only) → lift → land → fortune → actions.
   */
  async function startReveal() {
    state.numberPick?.dispose();
    state.numberPick = null;
    state.stage = 6;
    setInstruction(null);
    colorNameEl.classList.remove('is-visible');
    colorNameEl.textContent = '';
    hideFortuneUi();

    stageEl.classList.add('is-locked');
    stageEl.setAttribute('aria-label', 'Fortune reveal');
    stageEl.removeAttribute('tabindex');
    stageEl.removeAttribute('role');

    const num = state.selectedNumber2;
    const reveal = REVEAL_MAP[num];
    if (!state.cb || !reveal) {
      console.error('[play] Stage 6 — missing REVEAL_MAP entry or chatterbox', { num });
      setStatus('Couldn’t reveal that fortune. Reload and try again.', { error: true });
      return;
    }

    state.cb.setRevealNumber(num);
    state.cb.setRevealFortune(fortuneTextFor(num));

    const faces = revealFacesForNumber(num);
    stageEl.dispatchEvent(
      new CustomEvent('play:reveal-ready', {
        detail: {
          selectedNumber: state.selectedNumber,
          selectedNumber2: num,
          landAxis: state.landAxis,
          landFrame: state.landFrame,
          color: state.selectedColor,
          rotation: reveal.rotation,
          lift: reveal.lift,
          post: reveal.post,
          faces,
          stage: state.stage,
        },
        bubbles: true,
      }),
    );

    try {
      const liftFrames = [...reveal.lift, reveal.post];
      // Warm V37/V39… during rotation so the first lift paint is ready before we clear.
      const preloadP = state.cb.preloadReveal(liftFrames);

      // 1) Stage-6-only wrap rotation. Keep prior open frame visible; clear transform
      //    only after preload so there is no empty stage between rotate and lift.
      await rotateWrapForReveal(reveal.rotation);
      await preloadP;
      clearWrapTransform();

      // 2) Lift sequence + parity land frame (squash-pop + hold).
      //    reveal.showFrame keeps the previous frame until paper is decoded.
      await state.cb.playSequence(liftFrames);

      // 3) 500ms beat, then fortune on desk + post-reveal actions.
      await new Promise((r) => setTimeout(r, REVEAL_FORTUNE_BEAT_MS));
      await showFortuneAndActions(num, reveal);

      stageEl.dispatchEvent(
        new CustomEvent('play:revealed', {
          detail: {
            selectedNumber2: num,
            fortune: fortuneTextFor(num),
            post: reveal.post,
            rotation: reveal.rotation,
            faces,
            stage: state.stage,
          },
          bubbles: true,
        }),
      );
    } catch (err) {
      console.error(err);
      setStatus('Reveal animation failed. Reload and try again.', { error: true });
    }
  }

  function fortuneTextFor(num) {
    const fortunes = state.record?.fortunes || {};
    const key = String(num);
    return fortunes[key] || fortunes[num] || '';
  }

  function hideFortuneUi() {
    if (fortuneEl) {
      fortuneEl.textContent = '';
      fortuneEl.hidden = true;
      fortuneEl.classList.remove('is-visible');
    }
    if (actionsEl) {
      actionsEl.hidden = true;
      actionsEl.classList.remove('is-visible');
      actionsEl.innerHTML = '';
    }
  }

  /** Drop Stage-6 wrap rotation so V37–V40 match upright Figma comps. */
  function clearWrapTransform() {
    wrap.style.transition = '';
    wrap.style.transform = '';
  }

  /**
   * Apply REVEAL_MAP rotation on the stage wrap and hold briefly.
   * Transform is cleared by the caller *after* reveal assets are preloaded,
   * immediately before the lift swap — avoids a blank gap on stage.
   * Reveal frames (V37–V40) are drawn upright for the selected flap; the CSS
   * rotate is the visible “turn” from top-down pick → reveal-facing before lift.
   */
  async function rotateWrapForReveal(degrees) {
    wrap.style.transition = '';
    wrap.style.transformOrigin = '50% 50%';
    if (!degrees) {
      wrap.style.transform = '';
      return;
    }
    // Force layout so the transition runs from identity.
    void wrap.offsetWidth;
    wrap.style.transition = `transform ${REVEAL_ROTATE_MS}ms ease-out`;
    wrap.style.transform = `rotate(${degrees}deg)`;
    await new Promise((r) => setTimeout(r, REVEAL_ROTATE_MS));
    await new Promise((r) => setTimeout(r, STABLE_HOLD_MS));
    // Leave transform applied until clearWrapTransform() after preload.
  }

  async function showFortuneAndActions(num, reveal) {
    const text = fortuneTextFor(num);
    if (fortuneEl) {
      // Desk copy: quoted string in Outfit 32 (flap FakeText stays unquoted Patrick Hand).
      fortuneEl.textContent = text ? `"${text}"` : '';
      fortuneEl.hidden = false;
      // Next frame so opacity transition runs.
      requestAnimationFrame(() => fortuneEl.classList.add('is-visible'));
    }

    if (!actionsEl) return;

    let makeLabel = 'Make one';
    try {
      const count = await countChatterboxesForMaker(getMakerToken());
      makeLabel = count > 0 ? 'Make another' : 'Make one';
    } catch (err) {
      console.warn('[play] maker count failed — defaulting to Make one', err);
    }

    const id = state.record?.id || '';
    actionsEl.innerHTML = `
      <a class="play-action play-action-primary figma-stroke-inside" href="./schoolyard.html${id ? `?spotlight=${encodeURIComponent(id)}` : ''}">Play another</a>
      <a class="play-action play-action-secondary figma-stroke-inside" href="./decorate.html">${makeLabel}</a>
      <a class="play-action play-action-home" href="../index.html">Home</a>
    `;
    actionsEl.hidden = false;
    requestAnimationFrame(() => actionsEl.classList.add('is-visible'));

    console.info('[play] Stage 6 reveal complete', {
      selectedNumber2: num,
      rotation: reveal.rotation,
      post: reveal.post,
      fortune: text,
      makeLabel,
      faces: revealFacesForNumber(num),
    });
  }

  /**
   * Stage 3 / 5 — Number Pick on landed open state.
   * Reuses the same Fortune Selector + flap highlights; axis from state.landAxis / landFrame.
   * Stage 3 pick → ~500ms selected beat → Count It Out.
   * Stage 5 pick → ~500ms selected beat → startReveal (Stage 6).
   * Same number as Stage 3 is allowed on Stage 5. No confirmation overlay.
   */
  function startNumberPick({ pickStage = 3 } = {}) {
    const frameEl = wrap.closest('.play-frame') || wrap.parentElement;
    if (!frameEl || !state.landAxis || !state.landFrame) return;

    state.numberPick?.dispose();
    state.stage = pickStage;
    // Instruction shares Stage 1 slot — hide desk spell/count text while prompting.
    colorNameEl.classList.remove('is-visible');
    setInstruction(pickStage === 5 ? INSTR_STAGE_5 : INSTR_STAGE_3);
    stageEl.classList.remove('is-locked');
    stageEl.setAttribute('aria-label', 'Pick a number');

    state.numberPick = mountNumberPick({
      frameEl,
      stageEl,
      axis: state.landAxis,
      frameName: state.landFrame,
      onPick(num) {
        // onPick fires after SELECT_BEAT_MS selected-state pause in number-pick.
        if (pickStage === 5) {
          state.selectedNumber2 = num;
          state.stage = 5;
          stageEl.dispatchEvent(
            new CustomEvent('play:number-picked', {
              detail: {
                number: num,
                selectedNumber: state.selectedNumber,
                selectedNumber2: num,
                landAxis: state.landAxis,
                landFrame: state.landFrame,
                color: state.selectedColor,
                stage: state.stage,
              },
              bubbles: true,
            }),
          );
          startReveal().catch((err) => {
            console.error(err);
            setStatus('Reveal failed. Reload and try again.', { error: true });
          });
          return;
        }

        state.selectedNumber = num;
        state.stage = 4;
        stageEl.dispatchEvent(
          new CustomEvent('play:number-picked', {
            detail: {
              number: num,
              landAxis: state.landAxis,
              landFrame: state.landFrame,
              color: state.selectedColor,
              stage: state.stage,
            },
            bubbles: true,
          }),
        );
        countItOut(num).catch((err) => {
          console.error(err);
          setStatus('Count animation failed. Reload and try again.', { error: true });
        });
      },
    });
  }

  /**
   * Stage 4 — Count It Out (PRD §9.4).
   * Same alternating-axis parity as Stage 2 spelling (absolute index parity):
   *   count i (0-based): even → H (V34), odd → V (V36).
   *   Odd N → land V34; even N → land V36. Last cycle stays OPEN (never V33).
   * Stage 3 left us open, so close to V33 first (Stage 2’s closed start), then
   * mirror spellItOut: open → hold → close (except last stays open).
   * Desk accumulates "1 2 … N" on #play-color-name (same Comfortaa Bright White).
   * Timing: SWAP_SQUASH_MS (120) + STABLE_HOLD_MS (200). No container rotation.
   * Lands open for Stage 5, then mounts second number pick on landed axis.
   */
  async function countItOut(count) {
    const n = Math.max(1, Math.floor(Number(count)) || 1);
    if (!state.cb || !state.landAxis) return;

    state.numberPick?.dispose();
    state.numberPick = null;

    // Stages 1–5 never rotate the wrap.
    wrap.style.transform = '';
    wrap.style.transformOrigin = '';

    // Same as Stage 2 spell: hide instruction while desk count runs.
    setInstruction(null);
    stageEl.classList.add('is-locked');
    stageEl.setAttribute('aria-label', `Counting to ${n}`);
    stageEl.removeAttribute('tabindex');
    stageEl.removeAttribute('role');

    colorNameEl.textContent = '';
    colorNameEl.classList.add('is-visible');

    // Stage 3 left us open — close first so we share Stage 2’s closed-start loop.
    await state.cb.swapFrame('V33');
    await new Promise((r) => setTimeout(r, STABLE_HOLD_MS));

    let counted = '';
    let landAxis = 'H';

    for (let i = 0; i < n; i++) {
      // Count 1 = H, count 2 = V, count 3 = H, … (same index parity as spelling).
      const axis = i % 2 === 0 ? 'H' : 'V';
      const openFrame = axis === 'H' ? 'V34' : 'V36';
      landAxis = axis;

      counted = counted ? `${counted} ${i + 1}` : String(i + 1);
      colorNameEl.textContent = counted;

      await state.cb.swapFrame(openFrame);
      await new Promise((r) => setTimeout(r, STABLE_HOLD_MS));

      const isLast = i === n - 1;
      if (!isLast) {
        await state.cb.swapFrame('V33');
        await new Promise((r) => setTimeout(r, STABLE_HOLD_MS));
      }
    }

    // Land open for Stage 5 — never closed.
    state.landAxis = landAxis;
    state.landFrame = landAxis === 'H' ? 'V34' : 'V36';
    state.stage = 4;

    stageEl.dispatchEvent(
      new CustomEvent('play:counted', {
        detail: {
          count: n,
          selectedNumber: state.selectedNumber,
          landAxis: state.landAxis,
          landFrame: state.landFrame,
          counted,
          color: state.selectedColor,
          stage: state.stage,
          wrapTransform: wrap.style.transform || '',
        },
        bubbles: true,
      }),
    );

    // Stage 5 — Second Number Pick on landed open axis (same UI as Stage 3).
    startNumberPick({ pickStage: 5 });
  }

  function onStageClick(e) {
    if (state.stage !== 1 || !state.canvas) return;
    const flap = state.canvas.hitFlapFromClient(e.clientX, e.clientY);
    if (!flap) return;
    const color = colorForFlap(flap);
    if (!color) return;

    state.selectedFlap = flap;
    state.selectedColor = color;
    state.stage = 2;
    stageEl.classList.add('is-locked');
    stageEl.setAttribute('aria-label', `Spelling ${color.label}`);
    stageEl.removeAttribute('tabindex');
    stageEl.removeAttribute('role');

    setInstruction(null);

    stageEl.dispatchEvent(
      new CustomEvent('play:color-picked', {
        detail: {
          flap: state.selectedFlap,
          color: state.selectedColor,
          stage: state.stage,
        },
        bubbles: true,
      }),
    );

    spellItOut().catch((err) => {
      console.error(err);
      setStatus('Spell animation failed. Reload and try again.', { error: true });
    });
  }

  async function boot() {
    const id = params.get('id');
    if (!id) {
      setStatus(
        'No chatterbox id in the URL.<br /><a class="play-status-link" href="./decorate.html">← Back to Decorate</a>',
        { error: true },
      );
      setInstruction(null);
      return;
    }

    setStatus('Loading chatterbox…');
    setInstruction(null);

    let record;
    try {
      record = await fetchChatterbox(id);
    } catch (err) {
      console.error(err);
      setStatus(
        `Couldn’t load this chatterbox.<br /><a class="play-status-link" href="./decorate.html">← Back to Decorate</a>`,
        { error: true },
      );
      return;
    }

    state.record = record;
    setStatus('');

    // Static open-frame review — skip Stage 1 / spell until confirmed.
    if (review === 'V34' || review === 'V36') {
      await showOpenReview(review);
      return;
    }
    if (review === 'open') {
      await showOpenReview('V34');
      return;
    }

    stageEl.innerHTML = '';
    state.canvas = new DecorateCanvas(stageEl, decorationFromRecord(record));
    await state.canvas.ready();

    // Ensure closed layout matches Decorate origin.
    const closed = STABLE_FRAMES.V33;
    wrap.style.left = `${closed.layout.x}px`;
    wrap.style.top = `${closed.layout.y}px`;
    wrap.style.width = `${closed.w}px`;
    wrap.style.height = `${closed.h}px`;

    state.stage = 1;
    setInstruction(INSTR_STAGE_1);
    stageEl.setAttribute('role', 'button');
    stageEl.setAttribute('tabindex', '0');
    stageEl.setAttribute('aria-label', 'Pick a colour — click a painted flap');
    stageEl.addEventListener('click', onStageClick);
  }

  boot().catch((err) => {
    console.error(err);
    setStatus(
      `Couldn’t load this chatterbox.<br /><a class="play-status-link" href="./decorate.html">← Back to Decorate</a>`,
      { error: true },
    );
    setInstruction(null);
  });
  return state;
}
