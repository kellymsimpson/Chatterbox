/**
 * Load + clean sticker SVGs from assets/stickers (Figma 124:255 exports).
 * Hover = boolean Union layer (white @ 0.3) bound to hover#775:51 in Figma.
 */

const STICKER_BASE = new URL('../assets/stickers/', import.meta.url);
const cache = new Map();

/**
 * @param {string} id e.g. sticker-01
 * @returns {Promise<SVGSVGElement>}
 */
export async function loadStickerSvg(id) {
  if (cache.has(id)) return cache.get(id).cloneNode(true);
  const text = await fetch(new URL(`${id}.svg`, STICKER_BASE).href).then((r) => {
    if (!r.ok) throw new Error(`Sticker ${id}: ${r.status}`);
    return r.text();
  });
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) throw new Error(`Bad sticker SVG: ${id}`);

  // Strip Figma export chrome (gray plate + component-set guides + artboard frame)
  for (const el of [...svg.querySelectorAll('*')]) {
    const fill = (el.getAttribute('fill') || '').toUpperCase();
    const stroke = (el.getAttribute('stroke') || '').toUpperCase();
    if (fill === '#BEBEBE') {
      el.remove();
      continue;
    }
    if (stroke === '#9747FF') {
      el.remove();
      continue;
    }
  }
  const decorateMode = svg.querySelector('[id="Decorate Mode"], #Decorate\\ Mode');
  if (decorateMode) {
    for (const path of [...decorateMode.querySelectorAll(':scope > path')]) {
      const op = path.getAttribute('fill-opacity');
      if (op != null && Number(op) < 1) path.remove();
    }
  }

  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.display = 'block';
  svg.style.overflow = 'hidden';
  setStickerHover(svg, false);

  cache.set(id, svg);
  return svg.cloneNode(true);
}

/** @param {SVGSVGElement} svg @param {boolean} hover */
export function setStickerHover(svg, hover) {
  const union = svg.querySelector('#Union');
  if (!union) return;
  union.style.display = hover ? '' : 'none';
}

/**
 * Raster blob URL for cursor / placed stickers (no hover glow).
 * @param {string} id
 * @returns {Promise<string>}
 */
export async function stickerImageUrl(id) {
  const svg = await loadStickerSvg(id);
  setStickerHover(svg, false);
  const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
    type: 'image/svg+xml',
  });
  return URL.createObjectURL(blob);
}
