/**
 * Decorated V33 thumbnail — same DecorateCanvas compositor as Decorate mode
 * and the save-confirmation sheet (clone + scale of the live canvas host).
 */

import { DecorateCanvas } from './decorate-canvas.js?v=s7';

/**
 * @param {unknown} stickers
 * @returns {Array<{ id: string, flap: string, u: number, v: number, scale?: number }>}
 */
export function normalizeStickers(stickers) {
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
 * @param {{ flap_colors?: object, stickers?: unknown }} [record]
 */
export function decorationFromRecord(record = {}) {
  return {
    flap_colors: record.flap_colors || {},
    stickers: normalizeStickers(record.stickers),
  };
}

/**
 * Build the save-sheet / schoolyard thumb frame from a DecorateCanvas host
 * (clone + strip tool chrome). Same path as save-flow confirmation.
 *
 * @param {HTMLElement} sourceHost — `DecorateCanvas.host`
 * @param {{ frameClass?: string, shadowClass?: string|null }} [opts]
 * @returns {HTMLElement}
 */
export function buildThumbFromDecorateHost(sourceHost, opts = {}) {
  const frameClass = opts.frameClass || 'save-sheet-thumb-frame';
  const shadowClass = opts.shadowClass === undefined ? 'save-sheet-thumb-shadow' : opts.shadowClass;

  const frame = document.createElement('div');
  frame.className = frameClass;
  const clone = sourceHost.cloneNode(true);
  if (clone instanceof HTMLElement) {
    clone.removeAttribute('id');
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('[data-sticker-preview], .tool-cursor').forEach((n) => n.remove());
  }
  frame.appendChild(clone);

  if (!shadowClass) return frame;

  const shadow = document.createElement('div');
  shadow.className = shadowClass;
  shadow.appendChild(frame);
  return shadow;
}

/**
 * Render a decorated V33 thumb into `container` from saved flap_colors + stickers.
 * Boots DecorateCanvas (same compositor as Decorate / save sheet), then clones.
 *
 * @param {HTMLElement} container
 * @param {{ flap_colors?: object, stickers?: unknown }} decoration
 * @param {{ frameClass?: string, shadowClass?: string|null }} [opts]
 * @returns {Promise<HTMLElement>}
 */
export async function renderDecoratedThumb(container, decoration, opts = {}) {
  const host = document.createElement('div');
  const canvas = new DecorateCanvas(host, decorationFromRecord(decoration));
  await canvas.ready();
  const thumb = buildThumbFromDecorateHost(host, opts);
  container.replaceChildren(thumb);
  return thumb;
}
