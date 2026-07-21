/**
 * Play mode — Stage 1: Pick a Colour (PRD §9.4)
 *
 * Rendering: IDENTICAL to Decorate — `DecorateCanvas` (closed fill masks via
 * closed-placements.json / component set 492:14781, stickers via sticker-art.js
 * cleaned SVGs, paint at --paint-opacity 0.70). Do not use Chatterbox /
 * PaintStickerLayer for the closed V33 play surface.
 */

import { DecorateCanvas } from './decorate-canvas.js?v=r9d';
import { fetchChatterbox } from './supabase-api.js';
import { PAINT_COLORS } from './magic-paint.js';

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

/**
 * @param {{
 *   stageEl: HTMLElement,
 *   colorNameEl: HTMLElement,
 *   instructionEl: HTMLElement,
 *   statusEl: HTMLElement,
 * }} els
 */
export function mountPlayMode(els) {
  const { stageEl, colorNameEl, instructionEl, statusEl } = els;
  const colorLookup = buildColorLookup();

  /** @type {{
   *   stage: number,
   *   record: object|null,
   *   canvas: DecorateCanvas|null,
   *   selectedFlap: string|null,
   *   selectedColor: { id: string, label: string, hex: string }|null,
   * }} */
  const state = {
    stage: 0,
    record: null,
    canvas: null,
    selectedFlap: null,
    selectedColor: null,
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

  function colorForFlap(flap) {
    const hex = (state.record?.flap_colors?.[flap] || '').trim().toLowerCase();
    if (!hex) return null;
    const meta = colorLookup.get(hex);
    if (meta) return { ...meta, hex };
    return { id: 'colour', label: 'Colour', hex };
  }

  function onStageClick(e) {
    if (state.stage !== 1 || !state.canvas) return;
    const flap = state.canvas.hitFlapFromClient(e.clientX, e.clientY);
    if (!flap) return;
    const color = colorForFlap(flap);
    if (!color) return;

    // Persist pick for Stage 2 (Spell It Out) — no motion until that stage ships.
    state.selectedFlap = flap;
    state.selectedColor = color;
    state.stage = 2; // advanced past colour pick; Stage 2 consumes this
    stageEl.classList.add('is-locked');
    stageEl.setAttribute('aria-label', `Selected ${color.label}`);

    if (instructionEl) instructionEl.hidden = true;
    colorNameEl.textContent = color.label;
    colorNameEl.classList.add('is-visible');

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
  }

  async function boot() {
    const id = new URLSearchParams(location.search).get('id');
    if (!id) {
      setStatus(
        'No chatterbox id in the URL.<br /><a class="play-status-link" href="./decorate.html">← Back to Decorate</a>',
        { error: true },
      );
      if (instructionEl) instructionEl.hidden = true;
      return;
    }

    setStatus('Loading chatterbox…');
    if (instructionEl) instructionEl.hidden = true;

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

    stageEl.innerHTML = '';
    state.canvas = new DecorateCanvas(stageEl, {
      flap_colors: record.flap_colors || {},
      stickers: normalizeStickers(record.stickers),
    });
    await state.canvas.ready();

    state.stage = 1;
    if (instructionEl) instructionEl.hidden = false;
    stageEl.setAttribute('role', 'button');
    stageEl.setAttribute('tabindex', '0');
    stageEl.setAttribute('aria-label', 'Pick a colour — click a painted flap');
    stageEl.addEventListener('click', onStageClick);
  }

  boot();
  return state;
}
