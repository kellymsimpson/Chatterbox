/**
 * Magic Paint tray — brush pickup, 7 colour pods, flap wash (PRD §8.5).
 * Eraser tip wired for paint-only clear (PRD §8.6) so paint can be reviewed.
 */

const PAINT_COLORS = [
  { id: 'pink',   css: '--paint-pink',   file: 'pod-pink.png' },
  { id: 'red',    css: '--paint-red',    file: 'pod-red.png' },
  { id: 'orange', css: '--paint-orange', file: 'pod-orange.png' },
  { id: 'yellow', css: '--paint-yellow', file: 'pod-yellow.png' },
  { id: 'green',  css: '--paint-green',  file: 'pod-green.png' },
  { id: 'blue',   css: '--paint-blue',   file: 'pod-blue.png' },
  { id: 'purple', css: '--paint-purple', file: 'pod-purple.png' },
];

const UI_BASE = new URL('../assets/ui/magic-paint/', import.meta.url);

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

  const tokenColor = (cssVar) =>
    getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();

  trayHost.classList.add('magic-paint-tray');
  trayHost.innerHTML = `
    <button type="button" class="magic-paint-brush-slot" aria-label="Pick up paintbrush" data-brush>
      <img class="magic-paint-brush" src="${new URL('brush-handle.png', UI_BASE).href}" alt="" draggable="false" />
    </button>
    <div class="magic-paint-pods" role="listbox" aria-label="Paint colours"></div>
  `;

  const podsEl = trayHost.querySelector('.magic-paint-pods');
  const brushSlot = trayHost.querySelector('[data-brush]');
  const brushImg = trayHost.querySelector('.magic-paint-brush');

  for (const c of PAINT_COLORS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'magic-paint-pod';
    btn.dataset.color = c.id;
    btn.setAttribute('role', 'option');
    btn.setAttribute('aria-label', c.id);
    btn.innerHTML = `<img src="${new URL(c.file, UI_BASE).href}" alt="" draggable="false" />`;
    podsEl.appendChild(btn);
  }

  const cursor = document.createElement('div');
  cursor.className = 'tool-cursor';
  cursor.hidden = true;
  cursor.innerHTML = `<img src="${new URL('brush-handle.png', UI_BASE).href}" alt="" />`;
  document.body.appendChild(cursor);

  let eraserBtn = null;
  if (eraserHost) {
    eraserHost.classList.add('magic-eraser');
    eraserHost.innerHTML = `
      <button type="button" class="magic-eraser-btn" aria-label="Pick up eraser" data-eraser>
        <span class="magic-eraser-glyph" aria-hidden="true"></span>
        <span class="magic-eraser-label">Eraser</span>
      </button>
    `;
    eraserBtn = eraserHost.querySelector('[data-eraser]');
  }

  function emit() {
    onChange?.({ painted: canvas.paintedCount(), mode, color: activeColor });
  }

  function setMode(next, color = null) {
    mode = next;
    activeColor = next === 'brush' ? color : null;
    document.body.dataset.decorateTool = mode;
    brushSlot.classList.toggle('is-empty', mode === 'brush');
    brushImg.hidden = mode === 'brush';
    cursor.hidden = mode === 'idle';
    cursor.classList.toggle('is-brush', mode === 'brush');
    cursor.classList.toggle('is-eraser', mode === 'eraser');
    if (eraserBtn) eraserBtn.classList.toggle('is-active', mode === 'eraser');

    for (const c of PAINT_COLORS) {
      const btn = podsEl.querySelector(`[data-color="${c.id}"]`);
      const hex = tokenColor(c.css);
      const selected = mode === 'brush' && activeColor === hex;
      btn.classList.toggle('is-selected', selected);
      btn.classList.toggle('is-disabled', mode === 'brush' && !!activeColor && !selected);
      btn.classList.toggle('is-muted', mode !== 'brush');
    }
    emit();
  }

  brushSlot.addEventListener('click', () => {
    if (mode === 'brush') setMode('idle');
    else setMode('brush', activeColor);
  });

  podsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.magic-paint-pod');
    if (!btn) return;
    // PRD §8.5: pick up the brush first; pods only select colour while brush is active.
    if (mode !== 'brush') return;
    const meta = PAINT_COLORS.find((p) => p.id === btn.dataset.color);
    if (!meta) return;
    const hex = tokenColor(meta.css);
    if (activeColor === hex) {
      setMode('idle');
      return;
    }
    setMode('brush', hex);
  });

  if (eraserBtn) {
    eraserBtn.addEventListener('click', () => {
      if (mode === 'eraser') setMode('idle');
      else setMode('eraser');
    });
  }

  function onPointerMove(e) {
    if (mode === 'idle') return;
    cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) rotate(-45deg)`;
  }

  async function onCanvasClick(e) {
    const flap = canvas.hitFlapFromClient(e.clientX, e.clientY);
    if (!flap) return;
    if (mode === 'brush' && activeColor) {
      await canvas.setFlapColor(flap, activeColor);
      emit();
    } else if (mode === 'eraser') {
      await canvas.clearFlap(flap);
      emit();
    }
  }

  function onKey(e) {
    if (e.key === 'Escape' && mode !== 'idle') {
      setMode('idle');
    }
  }

  canvas.host.addEventListener('click', onCanvasClick);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('keydown', onKey);

  setMode('idle');

  return {
    getMode: () => mode,
    getColor: () => activeColor,
    destroy() {
      canvas.host.removeEventListener('click', onCanvasClick);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('keydown', onKey);
      cursor.remove();
    },
  };
}

export { PAINT_COLORS };
