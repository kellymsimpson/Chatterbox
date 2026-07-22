/**
 * Stage 3 / 5 — Number Pick (PRD §9.4)
 *
 * Fortune Selector — Figma `431:5963` (component set `423:5068`
 * open=horizontal / open=vertical) + Fortune Flaps `423:4889`.
 * Flap highlight hovers synced over the open chatterbox numbers.
 *
 * H-open (V34): selectable 1, 2, 5, 6 — others disabled
 * V-open (V36): selectable 3, 4, 7, 8 — others disabled
 */

const FLAPS_BASE = new URL('../assets/ui/fortune-flaps/', import.meta.url);
const FLAPS_VER = 'd3';
const HIGHLIGHT_BASE = new URL('../assets/ui/flap-highlights/', import.meta.url);

function flapUrl(file) {
  return new URL(`${file}?v=${FLAPS_VER}`, FLAPS_BASE).href;
}

/** §8.8 — numbers visible / selectable per open axis */
export const H_NUMBERS = [1, 2, 5, 6];
export const V_NUMBERS = [3, 4, 7, 8];

/**
 * Fortune Flaps orientation (423:4889):
 * odd → A (right-angle at top-right); even → B (right-angle at top-left).
 */
function sideFor(num) {
  return num % 2 === 1 ? 'a' : 'b';
}

/**
 * Crop-local highlight placements — V41 Selected Flaps absoluteRenderBounds
 * relative to the same crop origin as h/v-placements fill masks
 * (TL fill ARB − contentLocal).
 *
 * H number ↔ flap: 1=TL, 2=TR, 5=BR, 6=BL
 * V number ↔ flap: 8=TL, 3=TR, 4=BR, 7=BL
 *
 * Bottom / side flaps are rotated instances in Figma; hover-N.svg paths are
 * exported from those play-frame instances (rotation baked into the path).
 * Place the AABB only — do not mirror top-flap columns or CSS-rotate masters.
 */
const HIGHLIGHT_LAYOUT = {
  V34: {
    1: { x: 41.785, y: 16.208, w: 99.331, h: 77.335 },
    2: { x: 140.9, y: 16.237, w: 102.857, h: 76.805 },
    // 573:5959 ARB after −90° (BR inner number face)
    5: { x: 140.9, y: 93.674, w: 103, h: 75 },
    // 573:5960 ARB after −180° (BL inner number face)
    6: { x: 41.9, y: 92.674, w: 99, h: 76 },
  },
  V36: {
    8: { x: 56.221, y: 66.322, w: 75, h: 95 },
    3: { x: 131.221, y: 60.322, w: 79, h: 99 },
    4: { x: 130.221, y: 161.322, w: 80, h: 109 },
    7: { x: 58.221, y: 161.322, w: 70, h: 112 },
  },
};

/** Fortune Selector instance `431:5963` on play frames — 78px flaps, gap 12. */
const SELECTOR_LAYOUT = { left: 366, top: 580, gap: 12, size: 78 };

/** Selected-state beat before advancing (Stage 3 → count, Stage 5 → reveal). */
export const SELECT_BEAT_MS = 500;

/**
 * @param {{
 *   frameEl: HTMLElement,
 *   stageEl: HTMLElement,
 *   axis: 'H'|'V',
 *   frameName: 'V34'|'V36',
 *   onPick: (num: number) => void,
 * }} opts
 */
export function mountNumberPick({ frameEl, stageEl, axis, frameName, onPick }) {
  const enabled = new Set(axis === 'H' ? H_NUMBERS : V_NUMBERS);
  const highlights = HIGHLIGHT_LAYOUT[frameName] || {};
  let hovered = null;
  let selected = null;
  let disposed = false;
  /** @type {ReturnType<typeof setTimeout>|null} */
  let beatTimer = null;

  const root = document.createElement('div');
  root.className = 'number-pick';
  root.dataset.axis = axis;

  // ── Desk Fortune Selector ──────────────────────────────────────────
  const selector = document.createElement('div');
  selector.className = 'fortune-selector';
  selector.setAttribute('role', 'group');
  selector.setAttribute('aria-label', 'Pick a number');
  Object.assign(selector.style, {
    position: 'absolute',
    left: `${SELECTOR_LAYOUT.left}px`,
    top: `${SELECTOR_LAYOUT.top}px`,
    display: 'flex',
    gap: `${SELECTOR_LAYOUT.gap}px`,
    alignItems: 'center',
    zIndex: '4',
  });

  /** @type {Map<number, HTMLButtonElement>} */
  const buttons = new Map();

  for (let n = 1; n <= 8; n++) {
    const side = sideFor(n);
    const isOn = enabled.has(n);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fortune-flap';
    btn.dataset.number = String(n);
    btn.dataset.side = side;
    btn.disabled = !isOn;
    btn.setAttribute('aria-label', `Number ${n}`);
    if (!isOn) btn.setAttribute('aria-disabled', 'true');

    const img = document.createElement('img');
    img.className = 'fortune-flap-shape';
    img.alt = '';
    img.draggable = false;
    img.src = flapUrl(`${side}-default.svg`);

    const label = document.createElement('span');
    label.className = 'fortune-flap-num';
    label.textContent = String(n);

    btn.append(img, label);
    selector.appendChild(btn);
    buttons.set(n, btn);

    if (!isOn) continue;

    btn.addEventListener('pointerenter', () => setHover(n));
    btn.addEventListener('pointerleave', () => setHover(null));
    btn.addEventListener('focus', () => setHover(n));
    btn.addEventListener('blur', () => setHover(null));
    btn.addEventListener('click', () => pick(n));
  }

  root.appendChild(selector);

  // ── Flap highlight overlays on stage (crop-local) ──────────────────
  const highlightLayer = document.createElement('div');
  highlightLayer.className = 'flap-highlight-layer';
  Object.assign(highlightLayer.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '5',
    overflow: 'visible',
  });

  /** @type {Map<number, HTMLElement>} */
  const highlightEls = new Map();
  /** @type {Map<number, HTMLButtonElement>} */
  const hitEls = new Map();

  const hitLayer = document.createElement('div');
  hitLayer.className = 'flap-number-hits';
  Object.assign(hitLayer.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    zIndex: '6',
    overflow: 'visible',
    // Explicit — host may carry .reveal-frame { pe:none } from Stage 6 CSS.
    pointerEvents: 'auto',
  });

  for (const n of enabled) {
    const layout = highlights[n];
    if (!layout) continue;

    const hi = document.createElement('img');
    hi.className = 'flap-highlight';
    hi.alt = '';
    hi.draggable = false;
    // Cache-bust rewritten SVGs (baked play-frame orientations).
    hi.src = new URL(`hover-${n}.svg?v=s39`, HIGHLIGHT_BASE).href;
    Object.assign(hi.style, {
      position: 'absolute',
      left: `${layout.x}px`,
      top: `${layout.y}px`,
      width: `${layout.w}px`,
      height: `${layout.h}px`,
      pointerEvents: 'none',
      display: 'none',
    });
    highlightLayer.appendChild(hi);
    highlightEls.set(n, hi);

    const hit = document.createElement('button');
    hit.type = 'button';
    hit.className = 'flap-number-hit';
    hit.dataset.number = String(n);
    hit.setAttribute('aria-label', `Number ${n} on flap`);
    Object.assign(hit.style, {
      position: 'absolute',
      left: `${layout.x}px`,
      top: `${layout.y}px`,
      width: `${layout.w}px`,
      height: `${layout.h}px`,
      padding: '0',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      pointerEvents: 'auto',
    });
    hit.addEventListener('pointerenter', () => setHover(n));
    hit.addEventListener('pointerleave', () => setHover(null));
    hit.addEventListener('focus', () => setHover(n));
    hit.addEventListener('blur', () => setHover(null));
    hit.addEventListener('click', () => pick(n));
    hitLayer.appendChild(hit);
    hitEls.set(n, hit);
  }

  stageEl.append(highlightLayer, hitLayer);
  frameEl.appendChild(root);

  function applyButtonVisual(n, state) {
    const btn = buttons.get(n);
    if (!btn || btn.disabled) return;
    const side = sideFor(n);
    const img = btn.querySelector('.fortune-flap-shape');
    const label = btn.querySelector('.fortune-flap-num');
    const file =
      state === 'hover'
        ? `${side}-hover.svg`
        : state === 'selected'
          ? `${side}-selected.svg`
          : `${side}-default.svg`;
    if (img) img.src = flapUrl(file);
    btn.dataset.state = state;
    if (label) {
      label.dataset.state = state;
    }
  }

  function showHighlight(n, on) {
    const hi = highlightEls.get(n);
    if (hi) hi.style.display = on ? 'block' : 'none';
  }

  function setHover(num) {
    if (disposed || selected != null) return;
    if (hovered === num) return;
    if (hovered != null) {
      applyButtonVisual(hovered, 'default');
      showHighlight(hovered, false);
    }
    hovered = num;
    if (num != null) {
      applyButtonVisual(num, 'hover');
      showHighlight(num, true);
    }
  }

  function pick(num) {
    if (disposed || selected != null || !enabled.has(num)) return;
    if (hovered != null) {
      showHighlight(hovered, false);
      hovered = null;
    }
    selected = num;
    for (const n of enabled) {
      applyButtonVisual(n, n === num ? 'selected' : 'default');
      showHighlight(n, n === num);
      const hit = hitEls.get(n);
      if (hit) hit.disabled = true;
      const btn = buttons.get(n);
      if (btn) btn.disabled = true;
    }
    // Show selected state ~500ms, then continue — no confirmation overlay.
    beatTimer = setTimeout(() => {
      beatTimer = null;
      if (disposed) return;
      onPick?.(num);
    }, SELECT_BEAT_MS);
  }

  // Init disabled visuals
  for (let n = 1; n <= 8; n++) {
    if (!enabled.has(n)) {
      const btn = buttons.get(n);
      const side = sideFor(n);
      const img = btn?.querySelector('.fortune-flap-shape');
      if (img) img.src = flapUrl(`${side}-disabled.svg`);
      btn.dataset.state = 'disabled';
    } else {
      applyButtonVisual(n, 'default');
    }
  }

  return {
    get selected() {
      return selected;
    },
    dispose() {
      disposed = true;
      if (beatTimer != null) {
        clearTimeout(beatTimer);
        beatTimer = null;
      }
      root.remove();
      highlightLayer.remove();
      hitLayer.remove();
    },
  };
}
