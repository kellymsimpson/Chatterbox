/**
 * Decorate sticker sheet — Figma 915:8933 / 258:1671 + PRD §8.7.
 *
 * Sheet hover = Stickers boolean hover (Union overlay).
 * Pickup follows cursor; flap hover shows matrix3d skew preview; place at (u,v).
 * Click sheet to cancel. Cap 20. Eraser removes stickers. Cmd/Ctrl+Z undoes places.
 */

import {
  MAX_STICKERS,
  STICKER_CAP_MESSAGE,
  STICKER_SCALE,
  STICKER_SHEET_SIZE,
  stickerCells,
} from './sticker-catalog.js?v=r9d';
import { loadStickerSvg, setStickerHover, stickerImageUrl } from './sticker-art.js?v=r9d';

/**
 * @param {object} opts
 * @param {HTMLElement} opts.sheetHost
 * @param {import('./decorate-canvas.js').DecorateCanvas} opts.canvas
 * @param {() => void} [opts.onPaintIdle] — drop brush/eraser when picking a sticker
 * @param {() => string} [opts.getPaintMode] — 'idle'|'brush'|'eraser'
 * @param {(info: { count: number, holding: string|null }) => void} [opts.onChange]
 */
export function mountStickerSheet({
  sheetHost,
  canvas,
  onPaintIdle,
  getPaintMode,
  onChange,
}) {
  /** @type {string|null} */
  let holdingId = null;
  /** @type {string|null} */
  let cursorUrl = null;
  /** @type {Array<{ type: 'place'|'erase', sticker: object }>} */
  const undoStack = [];

  sheetHost.classList.add('sticker-sheet');
  sheetHost.removeAttribute('aria-hidden');
  sheetHost.innerHTML = `
    <div class="sticker-sheet-scroll" data-sheet-scroll>
      <div class="sticker-sheet-grid" data-sheet-grid role="list" aria-label="Sticker sheet"></div>
    </div>
    <p class="sticker-sheet-message" data-sheet-msg hidden role="status"></p>
  `;

  const scrollEl = sheetHost.querySelector('[data-sheet-scroll]');
  const gridEl = sheetHost.querySelector('[data-sheet-grid]');
  const msgEl = sheetHost.querySelector('[data-sheet-msg]');

  scrollEl.style.width = `${STICKER_SHEET_SIZE.width}px`;
  scrollEl.style.height = `${STICKER_SHEET_SIZE.height}px`;
  gridEl.style.width = `${STICKER_SHEET_SIZE.width}px`;
  gridEl.style.height = `${STICKER_SHEET_SIZE.height}px`;

  const ghost = document.createElement('div');
  ghost.className = 'sticker-cursor';
  ghost.hidden = true;
  ghost.innerHTML = `<img data-sticker-cursor-img alt="" draggable="false" />`;
  document.body.appendChild(ghost);
  const ghostImg = ghost.querySelector('[data-sticker-cursor-img]');

  const cells = stickerCells();
  /** @type {Map<string, { btn: HTMLButtonElement, svg: SVGSVGElement|null }>} */
  const cellMap = new Map();

  for (const cell of cells) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sticker-sheet-cell';
    btn.dataset.stickerId = cell.id;
    btn.dataset.stickerName = cell.name;
    btn.setAttribute('role', 'listitem');
    btn.setAttribute('aria-label', cell.name);
    btn.style.left = `${cell.left}px`;
    btn.style.top = `${cell.top}px`;
    btn.style.width = `${cell.width}px`;
    btn.style.height = `${cell.height}px`;

    const mount = { btn, svg: null };
    cellMap.set(cell.id, mount);
    gridEl.appendChild(btn);

    loadStickerSvg(cell.id).then((svg) => {
      mount.svg = svg;
      btn.appendChild(svg);
    }).catch((err) => console.error(err));

    btn.addEventListener('pointerenter', () => {
      if (mount.svg && !holdingId) setStickerHover(mount.svg, true);
    });
    btn.addEventListener('pointerleave', () => {
      if (mount.svg) setStickerHover(mount.svg, false);
    });
  }

  function emit() {
    onChange?.({ count: canvas.stickerCount(), holding: holdingId });
  }

  function showCapMessage() {
    msgEl.hidden = false;
    msgEl.textContent = STICKER_CAP_MESSAGE;
  }

  function clearCapMessage() {
    msgEl.hidden = true;
    msgEl.textContent = '';
  }

  async function pickUp(id) {
    if (canvas.stickerCount() >= MAX_STICKERS) {
      showCapMessage();
      return;
    }
    clearCapMessage();
    onPaintIdle?.();
    holdingId = id;
    if (cursorUrl) URL.revokeObjectURL(cursorUrl);
    cursorUrl = await stickerImageUrl(id);
    ghostImg.src = cursorUrl;
    ghost.hidden = false;
    document.body.dataset.stickerHolding = '1';
    canvas.clearStickerPreview();
    emit();
  }

  function dropHold() {
    holdingId = null;
    ghost.hidden = true;
    document.body.dataset.stickerHolding = '';
    canvas.clearStickerPreview();
    emit();
  }

  function placeAt(clientX, clientY) {
    if (!holdingId) return false;
    const hit = canvas.uvFromClient(clientX, clientY);
    if (!hit) return false;
    const sticker = {
      id: holdingId,
      flap: hit.flap,
      u: hit.u,
      v: hit.v,
      scale: STICKER_SCALE,
    };
    const placed = canvas.addSticker(sticker);
    if (!placed) return false;
    undoStack.push({ type: 'place', sticker: { ...placed } });
    dropHold();
    clearCapMessage();
    emit();
    return true;
  }

  gridEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.sticker-sheet-cell');
    if (holdingId) {
      if (btn?.dataset.stickerId && btn.dataset.stickerId !== holdingId) {
        pickUp(btn.dataset.stickerId);
        return;
      }
      dropHold();
      return;
    }
    if (!btn) return;
    pickUp(btn.dataset.stickerId);
  });

  scrollEl.addEventListener('click', (e) => {
    if (e.target === scrollEl || e.target === gridEl) {
      if (holdingId) dropHold();
    }
  });

  function onPointerMove(e) {
    if (!holdingId) return;
    const size = 48;
    ghost.style.transform = `translate(${e.clientX - size / 2}px, ${e.clientY - size / 2}px)`;

    const hit = canvas.uvFromClient(e.clientX, e.clientY);
    if (hit) {
      ghost.hidden = true;
      canvas.showStickerPreview({
        id: holdingId,
        flap: hit.flap,
        u: hit.u,
        v: hit.v,
        scale: STICKER_SCALE,
      });
    } else {
      ghost.hidden = false;
      canvas.clearStickerPreview();
    }
  }

  /** Capture: place / erase before magic-paint bubble handler. */
  function onCanvasClickCapture(e) {
    if (holdingId) {
      if (placeAt(e.clientX, e.clientY)) {
        e.stopImmediatePropagation();
      }
      return;
    }
    if (eraseAt(e.clientX, e.clientY)) {
      e.stopImmediatePropagation();
    }
  }

  /** Eraser hit — stickers before paint. @returns {boolean} */
  function eraseAt(clientX, clientY) {
    const mode = getPaintMode?.() || 'idle';
    if (mode !== 'eraser') return false;
    const removed = canvas.removeStickerAtClient(clientX, clientY);
    if (!removed) return false;
    undoStack.push({ type: 'erase', sticker: { ...removed } });
    clearCapMessage();
    emit();
    return true;
  }

  function undo() {
    const action = undoStack.pop();
    if (!action) return false;
    if (action.type === 'place') {
      canvas.removeStickerByUid(action.sticker.uid);
    } else if (action.type === 'erase') {
      canvas.addSticker(action.sticker, { silent: true });
    }
    clearCapMessage();
    emit();
    return true;
  }

  function onKey(e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undo();
      return;
    }
    if (e.key === 'Escape' && holdingId) {
      dropHold();
    }
  }

  canvas.host.addEventListener('click', onCanvasClickCapture, true);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('keydown', onKey);

  emit();

  return {
    isHolding: () => !!holdingId,
    eraseAt,
    undo,
    destroy() {
      canvas.host.removeEventListener('click', onCanvasClickCapture, true);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('keydown', onKey);
      if (cursorUrl) URL.revokeObjectURL(cursorUrl);
      ghost.remove();
    },
  };
}
