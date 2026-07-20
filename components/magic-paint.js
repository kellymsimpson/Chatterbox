/**
 * Magic Paint tray — Figma 665:7965
 *
 * Architecture:
 *   • Three full tray images (default / hover / brush-removed) at 371×106
 *     — brush baked in; pods hidden in export. Hover = swap whole tray image.
 *   • Seven pods as separate 258:2382 instances at exact Frame 38 geometry.
 *
 * Colour rule (supersedes PRD §8.5): each colour paints at most one flap.
 * A pod is disabled only while its colour is on a flap.
 */

const PAINT_COLORS = [
  { id: 'pink',   css: '--paint-pink' },
  { id: 'red',    css: '--paint-red' },
  { id: 'orange', css: '--paint-orange' },
  { id: 'yellow', css: '--paint-yellow' },
  { id: 'green',  css: '--paint-green' },
  { id: 'blue',   css: '--paint-blue' },
  { id: 'purple', css: '--paint-purple' },
];

/**
 * Exact pod instances inside Frame 38 on 680:8255 (Figma plugin read).
 * absInTray = frame origin + instance x/y; size = instance width/height.
 */
const POD_LAYOUT = [
  { id: 'pink',   left: 44.2417, top: 63.5714, width: 30, height: 30 },
  { id: 'red',    left: 86.2417, top: 63.1428, width: 30, height: 30.8571 },
  { id: 'orange', left: 128.2417, top: 63.5714, width: 30, height: 30 },
  { id: 'yellow', left: 170.2417, top: 63.5714, width: 30, height: 30 },
  { id: 'green',  left: 212.2417, top: 63.1428, width: 30, height: 30.8571 },
  { id: 'blue',   left: 254.2417, top: 63.5714, width: 30, height: 30 },
  { id: 'purple', left: 296.2417, top: 63.5714, width: 30, height: 30 },
];

const UI_BASE = new URL('../assets/ui/magic-paint/', import.meta.url);
const POD_BASE = new URL('../assets/ui/paint-pods/', import.meta.url);
const CURSOR_BASE = new URL('../assets/ui/cursors/', import.meta.url);

const ASSET_V = 'r8';
const TRAY = {
  default: new URL(`tray-default.png?v=${ASSET_V}`, UI_BASE).href,
  hover: new URL(`tray-hover-r6.png?v=${ASSET_V}`, UI_BASE).href,
  empty: new URL(`tray-empty.png?v=${ASSET_V}`, UI_BASE).href,
};

const ERASER = {
  default: new URL('eraser-default.png', UI_BASE).href,
  hover: new URL('eraser-hover.png', UI_BASE).href,
  selected: new URL('eraser-selected.png', UI_BASE).href,
};

const CURSOR = {
  brush: new URL('paintbrush.png', CURSOR_BASE).href,
  eraser: new URL('eraser.png', CURSOR_BASE).href,
};

/**
 * Display-space hotspots (Figma cursor frames → tip / lowest corner).
 * Brush tip = bottom-left of 107.541² art; eraser corner = bottom of 49.333² art.
 */
const CURSOR_HOTSPOT = {
  brush: { x: 0.51, y: 106.51 },
  eraser: { x: 14.65, y: 47.89 },
};

/** @param {string} id @param {'default'|'hover'|'selected'|'disabled'} state */
function podSrc(id, state) {
  return new URL(`${id}-${state}.svg?v=${ASSET_V}`, POD_BASE).href;
}

/**
 * @param {object} opts
 * @param {HTMLElement} opts.trayHost
 * @param {import('./decorate-canvas.js').DecorateCanvas} opts.canvas
 * @param {HTMLElement} [opts.eraserHost]
 * @param {(info: { painted: number, mode: string, color: string|null }) => void} [opts.onChange]
 */
export function mountMagicPaint({ trayHost, canvas, eraserHost, onChange }) {
  /** @type {'idle'|'brush'|'eraser'} */
  let mode = 'idle';
  /** @type {string|null} hex */
  let activeColor = null;
  let brushHover = false;
  let eraserHover = false;
  /** @type {string|null} */
  let podHoverId = null;

  const tokenColor = (cssVar) =>
    getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();

  trayHost.classList.add('magic-paint-tray');
  trayHost.innerHTML = `
    <img class="magic-paint-tray-art" data-tray-art alt="" draggable="false"
      src="${TRAY.default}" width="371" height="106" />
    <button type="button" class="magic-paint-brush-slot" aria-label="Pick up paintbrush" data-brush></button>
    <div class="magic-paint-pods" role="listbox" aria-label="Paint colours"></div>
  `;

  const trayArt = trayHost.querySelector('[data-tray-art]');
  const brushSlot = trayHost.querySelector('[data-brush]');
  const podsEl = trayHost.querySelector('.magic-paint-pods');

  /** @type {Map<string, { btn: HTMLButtonElement, img: HTMLImageElement, layout: typeof POD_LAYOUT[0] }>} */
  const pods = new Map();

  for (const layout of POD_LAYOUT) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'magic-paint-pod';
    btn.dataset.color = layout.id;
    btn.dataset.variant = 'default';
    btn.setAttribute('role', 'option');
    btn.setAttribute('aria-label', layout.id);
    btn.style.left = `${layout.left}px`;
    btn.style.top = `${layout.top}px`;
    btn.style.width = `${layout.width}px`;
    btn.style.height = `${layout.height}px`;

    const img = document.createElement('img');
    img.alt = '';
    img.draggable = false;
    img.width = layout.width;
    img.height = layout.height;
    img.src = podSrc(layout.id, 'default');
    btn.appendChild(img);
    podsEl.appendChild(btn);
    pods.set(layout.id, { btn, img, layout });

    btn.addEventListener('pointerenter', () => {
      podHoverId = layout.id;
      syncPods();
    });
    btn.addEventListener('pointerleave', () => {
      if (podHoverId === layout.id) podHoverId = null;
      syncPods();
    });
  }

  const cursor = document.createElement('div');
  cursor.className = 'tool-cursor';
  cursor.hidden = true;
  cursor.innerHTML = `<img data-cursor-img src="${CURSOR.brush}" alt="" />`;
  document.body.appendChild(cursor);
  const cursorImg = cursor.querySelector('[data-cursor-img]');

  let eraserBtn = null;
  let eraserArt = null;
  if (eraserHost) {
    eraserHost.classList.add('magic-eraser');
    eraserHost.innerHTML = `
      <button type="button" class="magic-eraser-btn" aria-label="Pick up eraser" data-eraser data-variant="default">
        <img data-eraser-art src="${ERASER.default}" width="154" height="75" alt="" draggable="false" />
      </button>
    `;
    eraserBtn = eraserHost.querySelector('[data-eraser]');
    eraserArt = eraserHost.querySelector('[data-eraser-art]');
  }

  function emit() {
    onChange?.({ painted: canvas.paintedCount(), mode, color: activeColor });
  }

  function syncTrayArt() {
    if (mode === 'brush') {
      trayArt.src = TRAY.empty;
      trayHost.dataset.variant = 'brush-removed';
      return;
    }
    if (brushHover) {
      trayArt.src = TRAY.hover;
      trayHost.dataset.variant = 'brush-hover';
      return;
    }
    trayArt.src = TRAY.default;
    trayHost.dataset.variant = 'default';
  }

  function syncEraserArt() {
    if (!eraserBtn || !eraserArt) return;
    if (mode === 'eraser') {
      eraserArt.src = ERASER.selected;
      eraserBtn.dataset.variant = 'selected';
      return;
    }
    if (eraserHover) {
      eraserArt.src = ERASER.hover;
      eraserBtn.dataset.variant = 'hover';
      return;
    }
    eraserArt.src = ERASER.default;
    eraserBtn.dataset.variant = 'default';
  }

  function syncPods() {
    const inUse = canvas.colorsInUse();
    for (const c of PAINT_COLORS) {
      const { btn, img, layout } = pods.get(c.id);
      const hex = tokenColor(c.css);
      const disabled = inUse.has(hex);
      const selected = mode === 'brush' && activeColor === hex && !disabled;
      /** @type {'default'|'hover'|'selected'|'disabled'} */
      let variant = 'default';
      if (disabled) variant = 'disabled';
      else if (selected) variant = 'selected';
      else if (mode === 'brush' && podHoverId === c.id) variant = 'hover';

      btn.dataset.variant = variant;
      btn.setAttribute('aria-selected', selected ? 'true' : 'false');
      btn.disabled = mode !== 'brush' || disabled;

      const artW = variant === 'hover' ? 38 : variant === 'selected' ? 34 : layout.width;
      const artH = variant === 'hover' ? 38 : variant === 'selected' ? 34 : layout.height;
      img.width = artW;
      img.height = artH;
      img.style.width = `${artW}px`;
      img.style.height = `${artH}px`;

      const next = podSrc(c.id, variant);
      if (img.getAttribute('src') !== next) img.src = next;
    }
  }

  function setMode(next, color = null) {
    mode = next;
    if (next === 'brush') {
      // Never keep a colour that's already on a flap
      activeColor = color && !canvas.colorsInUse().has(color) ? color : null;
    } else {
      activeColor = null;
    }
    document.body.dataset.decorateTool = mode;

    syncTrayArt();
    syncEraserArt();
    syncPods();

    cursor.hidden = mode === 'idle';
    cursor.classList.toggle('is-brush', mode === 'brush');
    cursor.classList.toggle('is-eraser', mode === 'eraser');
    if (mode === 'eraser') cursorImg.src = CURSOR.eraser;
    else if (mode === 'brush') cursorImg.src = CURSOR.brush;

    emit();
  }

  brushSlot.addEventListener('pointerenter', () => {
    brushHover = true;
    if (mode !== 'brush') syncTrayArt();
  });
  brushSlot.addEventListener('pointerleave', () => {
    brushHover = false;
    if (mode !== 'brush') syncTrayArt();
  });
  brushSlot.addEventListener('click', () => {
    if (mode === 'brush') setMode('idle');
    else setMode('brush', activeColor);
  });

  podsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.magic-paint-pod');
    if (!btn || btn.disabled) return;
    if (mode !== 'brush') return;
    const meta = PAINT_COLORS.find((p) => p.id === btn.dataset.color);
    if (!meta) return;
    const hex = tokenColor(meta.css);
    if (canvas.colorsInUse().has(hex)) return;
    if (activeColor === hex) {
      setMode('brush', null);
      return;
    }
    setMode('brush', hex);
  });

  if (eraserBtn) {
    eraserBtn.addEventListener('pointerenter', () => {
      eraserHover = true;
      if (mode !== 'eraser') syncEraserArt();
    });
    eraserBtn.addEventListener('pointerleave', () => {
      eraserHover = false;
      if (mode !== 'eraser') syncEraserArt();
    });
    eraserBtn.addEventListener('click', () => {
      if (mode === 'eraser') setMode('idle');
      else setMode('eraser');
    });
  }

  function onPointerMove(e) {
    if (mode === 'idle') return;
    const hot = mode === 'eraser' ? CURSOR_HOTSPOT.eraser : CURSOR_HOTSPOT.brush;
    cursor.style.transform = `translate(${e.clientX - hot.x}px, ${e.clientY - hot.y}px)`;
  }

  async function onCanvasClick(e) {
    const flap = canvas.hitFlapFromClient(e.clientX, e.clientY);
    if (!flap) return;
    if (mode === 'brush' && activeColor) {
      const applied = await canvas.setFlapColor(flap, activeColor);
      if (!applied) return;
      // Colour is now in use — drop selection; stay in brush mode for the next colour
      activeColor = null;
      syncPods();
      emit();
    } else if (mode === 'eraser') {
      await canvas.clearFlap(flap);
      syncPods();
      emit();
    }
  }

  function onKey(e) {
    if (e.key === 'Escape' && mode !== 'idle') setMode('idle');
  }

  canvas.host.addEventListener('click', onCanvasClick);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('keydown', onKey);

  setMode('idle');

  return {
    getMode: () => mode,
    getColor: () => activeColor,
    /** Drop brush/eraser without changing tray/pod/eraser assets. */
    idle() {
      setMode('idle');
    },
    destroy() {
      canvas.host.removeEventListener('click', onCanvasClick);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('keydown', onKey);
      cursor.remove();
    },
  };
}

export { PAINT_COLORS, POD_LAYOUT, CURSOR_HOTSPOT };
