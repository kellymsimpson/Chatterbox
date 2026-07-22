/**
 * Reveal-frame compositor — Stage 6 only (V37–V40).
 *
 * Paper SVGs are fill-less (placeholders stripped). Runtime paints the two
 * front faces via reveal-left / reveal-right masks (component set 540:2933),
 * bound to maker flap_colors + stickers via revealFacesForNumber (opposite
 * pair of the selected numbers). Stickers warp with matrix3d onto reveal
 * face diamond quads (same pattern as stable-frame open states).
 *
 * Land frames (V38.1/2, V40.1/2): Fake Text gray Union bars are stripped from
 * paper SVGs; runtime wraps fortunes[N] into the cream fortune-message-flap
 * TRIANGLE (point up / base on crease) via shape-outside floats + clip-path,
 * word-aware wrap + hyphens:auto, font size fills without crossing diagonals,
 * then matrix3d-places the triangle AABB onto the flap.
 *
 * Fill absolute positions are constant across V37–V40 (Figma Fills group);
 * crop-local = abs − frame crop origin from crop-offsets.json.
 */

import { stickerImageUrl } from './sticker-art.js';
import { STICKER_SCALE, STICKER_UV_PX } from './sticker-catalog.js';
import { matrix3dFromRect } from './geometry.js';

const FRAMES_BASE = new URL('../assets/frames/', import.meta.url);
const FILLS_BASE = new URL('../assets/fills/', import.meta.url);
const NS = 'http://www.w3.org/2000/svg';
/** Bust paper / module cache after Fake Text triangle shape-outside. */
const PAPER_CACHE_VER = 's37';

/** Crop + export size per reveal frame (assets/frames/crop-offsets.json). */
export const REVEAL_FRAMES = {
  V37: {
    file: 'v37.svg',
    w: 341,
    h: 242,
    crop: { x: 551.922, y: 179.208 },
    layout: { x: 551.922, y: 179.208 },
  },
  'V37.1': {
    file: 'v37.1.svg',
    w: 341,
    h: 242,
    crop: { x: 551.922, y: 179.208 },
    layout: { x: 551.922, y: 179.208 },
  },
  'V37.2': {
    file: 'v37.2.svg',
    w: 341,
    h: 250,
    crop: { x: 551.922, y: 171.569 },
    layout: { x: 551.922, y: 171.569 },
  },
  'V38.1': {
    file: 'v38.1.svg',
    w: 341,
    h: 323,
    crop: { x: 551.922, y: 98.228 },
    layout: { x: 551.922, y: 98.228 },
  },
  'V38.2': {
    file: 'v38.2.svg',
    w: 341,
    h: 323,
    crop: { x: 551.922, y: 98.228 },
    layout: { x: 551.922, y: 98.228 },
  },
  V39: {
    file: 'v39.svg',
    w: 341,
    h: 242,
    crop: { x: 551.922, y: 179.208 },
    layout: { x: 551.922, y: 179.208 },
  },
  'V39.1': {
    file: 'v39.1.svg',
    w: 341,
    h: 242,
    crop: { x: 551.922, y: 179.208 },
    layout: { x: 551.922, y: 179.208 },
  },
  'V39.2': {
    file: 'v39.2.svg',
    w: 341,
    h: 250,
    crop: { x: 551.922, y: 171.569 },
    layout: { x: 551.922, y: 171.569 },
  },
  'V40.1': {
    file: 'v40.1.svg',
    w: 341,
    h: 323,
    crop: { x: 551.922, y: 98.228 },
    layout: { x: 551.922, y: 98.228 },
  },
  'V40.2': {
    file: 'v40.2.svg',
    w: 341,
    h: 323,
    crop: { x: 551.922, y: 98.228 },
    layout: { x: 551.922, y: 98.228 },
  },
};

/**
 * Absolute play-frame positions of the two reveal face instances
 * (V37 Fills 511:17264 / V38.1 Fills 543:3194 — identical abs coords).
 */
const REVEAL_FILL_ABS = {
  left: {
    face: 'left',
    file: 'reveal-left.svg',
    x: 572.9453125,
    y: 200.95556640625,
    w: 146.744140625,
    h: 145.607421875,
  },
  right: {
    face: 'right',
    file: 'reveal-right.svg',
    x: 720.33154296875,
    y: 203.72119140625,
    w: 146.744140625,
    h: 145.607421875,
  },
};

/**
 * Which outer flaps occupy the left / right reveal faces for a selected number.
 *
 * Authoritative Stage 6 mapping (pre-rotation flap positions). Visible pair is
 * OPPOSITE the selected numbers — rotation brings that pair to the front:
 *   H 1|2 (no rot)  → BL + BR
 *   H 5|6 (180°)    → TL + TR
 *   V 3|4 (−90°)    → TL + BL
 *   V 7|8 (+90°)    → TR + BR
 *
 * @param {number} num
 * @returns {{ left: string, right: string }}
 */
export function revealFacesForNumber(num) {
  const n = Number(num);
  if (n === 1 || n === 2) return { left: 'bottom_left', right: 'bottom_right' };
  if (n === 5 || n === 6) return { left: 'top_left', right: 'top_right' };
  if (n === 3 || n === 4) return { left: 'top_left', right: 'bottom_left' };
  if (n === 7 || n === 8) return { left: 'top_right', right: 'bottom_right' };
  return { left: 'bottom_left', right: 'bottom_right' };
}

/**
 * Diamond quads for reveal-left / reveal-right masks (mask-local space).
 * Corners = path extrema (top / right / bottom / left) — used for sticker matrix3d warp.
 */
const REVEAL_FACE_QUADS_LOCAL = {
  left: {
    C0: [70.5908, 0],
    C1: [146.744, 80.5449],
    C2: [57.4375, 145.607],
    C3: [0, 76.8018],
  },
  right: {
    C0: [76.4023, 1.46094],
    C1: [148.004, 75.2959],
    C2: [90.0713, 144.146],
    C3: [0, 79.6182],
  },
};

/** Land frames that show Fake Text on the fortune-message flap. */
const LAND_FRAMES = new Set(['V38.1', 'V38.2', 'V40.1', 'V40.2']);

/**
 * Cream fortune-message-flap triangle in crop-local space (paper SVG path).
 * V38.1/2 + V40.1/2 share the same path — point at top, wide base on the crease:
 *   M166.781 8 L255.972 138.251 H77.591 Z
 * (H vs V land frames differ only in which outer flaps are painted, not the
 * cream triangle the fortune text sits on.)
 */
const FORTUNE_FLAP_TRIANGLE = {
  apex: [166.781, 8],
  br: [255.972, 138.251],
  bl: [77.591, 138.251],
};

/** Max flap-fortune size — handwritten / intentionally small (desk fortune is Outfit 32). */
const FAKE_TEXT_MAX_PX = 14;

/**
 * Crop-local Fake Text dest for a land frame = cream flap triangle AABB.
 * Text UV plane is that AABB; shape-outside + clip-path carve the triangle.
 * @param {string} frameName
 * @param {{ x: number, y: number }} [_crop] unused — triangle is already crop-local
 * @returns {{
 *   quad: { C0: number[], C1: number[], C2: number[], C3: number[] },
 *   align: string,
 *   w: number,
 *   h: number,
 *   clipPath: string,
 *   apexX: number,
 * } | null}
 */
export function fakeTextQuadCropLocal(frameName, _crop) {
  if (!LAND_FRAMES.has(frameName)) return null;
  const { apex, br, bl } = FORTUNE_FLAP_TRIANGLE;
  const x = Math.min(apex[0], br[0], bl[0]);
  const y = Math.min(apex[1], br[1], bl[1]);
  const right = Math.max(apex[0], br[0], bl[0]);
  const bottom = Math.max(apex[1], br[1], bl[1]);
  const w = right - x;
  const h = bottom - y;
  const apexX = (apex[0] - x) / w; // ~0.5 — isosceles
  const clipPath = `polygon(${(apexX * 100).toFixed(3)}% 0%, 100% 100%, 0% 100%)`;
  return {
    align: 'center',
    w,
    h,
    apexX,
    clipPath,
    quad: {
      C0: [x, y],
      C1: [x + w, y],
      C2: [x + w, y + h],
      C3: [x, y + h],
    },
  };
}

/**
 * Left/right shape-outside floats that carve an apex-up triangle out of a box.
 * Lines stay short near the point and widen toward the base.
 * @param {HTMLElement} host
 * @param {number} [apexX=0.5] apex x as fraction of width (0–1)
 * @param {string} [shapeMargin='2px']
 */
function appendTriangleShapeFloats(host, apexX = 0.5, shapeMargin = '2px') {
  const leftW = Math.max(0.05, Math.min(0.95, apexX)) * 100;
  const rightW = 100 - leftW;
  const left = document.createElement('div');
  const right = document.createElement('div');
  left.setAttribute('aria-hidden', 'true');
  right.setAttribute('aria-hidden', 'true');
  left.className = 'reveal-fake-text-shape reveal-fake-text-shape-left';
  right.className = 'reveal-fake-text-shape reveal-fake-text-shape-right';
  Object.assign(left.style, {
    float: 'left',
    width: `${leftW}%`,
    height: '100%',
    shapeOutside: 'polygon(0 0, 100% 0, 0 100%)',
    webkitShapeOutside: 'polygon(0 0, 100% 0, 0 100%)',
    shapeMargin,
    pointerEvents: 'none',
  });
  Object.assign(right.style, {
    float: 'right',
    width: `${rightW}%`,
    height: '100%',
    shapeOutside: 'polygon(0 0, 100% 0, 100% 100%)',
    webkitShapeOutside: 'polygon(0 0, 100% 0, 100% 100%)',
    shapeMargin,
    pointerEvents: 'none',
  });
  host.append(left, right);
}

/**
 * True when any text ink rect crosses outside the apex-up triangle in `wrap`.
 * @param {HTMLElement} wrap
 * @param {number} boxW
 * @param {number} boxH
 * @param {number} [apexX=0.5]
 * @param {number} [edgePad=1.25]
 */
function textOverflowsTriangle(wrap, boxW, boxH, apexX = 0.5, edgePad = 1.25) {
  const copy = wrap.querySelector('.reveal-fake-text-copy');
  if (!copy?.firstChild) return true;
  const wrapRect = wrap.getBoundingClientRect();
  const range = document.createRange();
  range.selectNodeContents(copy);
  const rects = range.getClientRects();
  if (!rects.length) return true;

  /** Inclusive x-range of the triangle at local y (apex at top). */
  const xRangeAt = (y) => {
    const t = Math.max(0, Math.min(1, y / boxH));
    const left = apexX * boxW * (1 - t);
    const right = apexX * boxW + (1 - apexX) * boxW * t;
    return [left, right];
  };

  for (const r of rects) {
    if (r.width < 0.5 || r.height < 0.5) continue;
    const top = r.top - wrapRect.top;
    const bottom = r.bottom - wrapRect.top;
    const left = r.left - wrapRect.left;
    const right = r.right - wrapRect.left;
    if (top < -edgePad || bottom > boxH + edgePad) return true;

    for (const y of [top, (top + bottom) / 2, bottom]) {
      const [lo, hi] = xRangeAt(y);
      if (left < lo - edgePad || right > hi + edgePad) return true;
    }
  }
  return false;
}

/**
 * Shared Fake Text copy styles: word-boundary wrap + auto hyphenation.
 * Never character-wrap (`overflow-wrap: anywhere` / `word-break: break-all|break-word`).
 * Mid-word breaks only via CSS hyphenation (`hyphens: auto` + lang=en).
 * @param {{ fontFamily?: string, lineHeight?: string, padding?: string, textAlign?: string, fontSize?: string }} [opts]
 * @returns {Record<string, string>}
 */
function fortuneCopyStyles(opts = {}) {
  return {
    boxSizing: 'border-box',
    margin: '0',
    padding: opts.padding || '2px 2px',
    fontFamily: opts.fontFamily || "var(--font-fortune), 'Patrick Hand', cursive",
    fontSize: opts.fontSize || '12px',
    lineHeight: opts.lineHeight || '1.15',
    letterSpacing: '0',
    textAlign: opts.textAlign || 'center',
    whiteSpace: 'normal',
    // Whole words wrap to the next line. Mid-word only via hyphenation —
    // never arbitrary letter splits (no overflow-wrap:anywhere / break-word).
    wordBreak: 'normal',
    overflowWrap: 'normal',
    wordWrap: 'normal',
    hyphens: 'auto',
    webkitHyphens: 'auto',
    msHyphens: 'auto',
  };
}

/**
 * Largest font-size (px) that wraps `text` into the apex-up triangle without
 * overflowing diagonals or the base. Binary-searches a hidden probe that uses
 * the same shape-outside floats as paint. Call after `document.fonts.ready`.
 * @param {string} text
 * @param {number} boxW
 * @param {number} boxH
 * @param {{ fontFamily?: string, lineHeight?: string, padding?: string, textAlign?: string, apexX?: number }} [opts]
 * @returns {number}
 */
export function fitFortuneFontSize(text, boxW, boxH, opts = {}) {
  const apexX = opts.apexX == null ? 0.5 : opts.apexX;
  const probe = document.createElement('div');
  probe.className = 'reveal-fake-text';
  Object.assign(probe.style, {
    position: 'absolute',
    left: '-99999px',
    top: '0',
    width: `${boxW}px`,
    height: `${boxH}px`,
    visibility: 'hidden',
    pointerEvents: 'none',
    overflow: 'hidden',
  });
  appendTriangleShapeFloats(probe, apexX, '2px');

  const copy = document.createElement('div');
  copy.className = 'reveal-fake-text-copy';
  copy.lang = 'en';
  copy.textContent = text;
  Object.assign(copy.style, {
    ...fortuneCopyStyles(opts),
    color: 'rgba(2, 1, 1, 0.55)',
  });
  probe.appendChild(copy);
  document.body.appendChild(probe);

  const maxH = Math.max(1, boxH);

  /** @param {number} size */
  const overflows = (size) => {
    copy.style.fontSize = `${size}px`;
    // Force layout before measuring ink vs triangle.
    void probe.offsetHeight;
    if (copy.scrollWidth > boxW + 0.5) return true;
    return textOverflowsTriangle(probe, boxW, maxH, apexX);
  };

  let lo = 4;
  let hi = Math.max(lo, Math.min(FAKE_TEXT_MAX_PX, maxH - 4));
  let best = lo;
  while (hi - lo > 0.15) {
    const mid = (lo + hi) / 2;
    if (!overflows(mid)) {
      best = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  // Walk down for sub-pixel / hand-font ink that binary search can miss.
  while (best > 4 && overflows(best)) {
    best = Math.round((best - 0.2) * 10) / 10;
  }
  // Small safety margin — cursive glyphs paint slightly outside the em box.
  best = Math.max(4, Math.round(best * 0.96 * 10) / 10);
  while (best > 4 && overflows(best)) {
    best = Math.round((best - 0.2) * 10) / 10;
  }
  probe.remove();
  return Math.round(best * 10) / 10;
}

/**
 * Crop-local sticker quads for the two reveal faces on a given frame.
 * @param {{ x: number, y: number }} crop
 * @returns {{ left: object, right: object }}
 */
export function revealFaceQuadsCropLocal(crop) {
  const out = {};
  for (const side of /** @type {const} */ (['left', 'right'])) {
    const abs = REVEAL_FILL_ABS[side];
    const ox = abs.x - crop.x;
    const oy = abs.y - crop.y;
    const local = REVEAL_FACE_QUADS_LOCAL[side];
    out[side] = {
      C0: [local.C0[0] + ox, local.C0[1] + oy],
      C1: [local.C1[0] + ox, local.C1[1] + oy],
      C2: [local.C2[0] + ox, local.C2[1] + oy],
      C3: [local.C3[0] + ox, local.C3[1] + oy],
    };
  }
  return out;
}

const pathCache = new Map();
/** @type {Map<string, HTMLImageElement>} decoded paper imgs by absolute href */
const paperCache = new Map();

async function loadMaskPath(file) {
  if (pathCache.has(file)) return pathCache.get(file);
  const text = await fetch(new URL(file, FILLS_BASE)).then((r) => r.text());
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const d = doc.querySelector('path')?.getAttribute('d');
  if (!d) throw new Error(`No path in ${file}`);
  pathCache.set(file, d);
  return d;
}

/**
 * Decode a paper SVG so the first paint after a DOM swap is never empty.
 * @param {string} href
 * @returns {Promise<HTMLImageElement>}
 */
async function decodePaper(href) {
  const cached = paperCache.get(href);
  if (cached?.complete && cached.naturalWidth > 0) return cached;
  const img = new Image();
  img.src = href;
  try {
    await img.decode();
  } catch {
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  }
  paperCache.set(href, img);
  return img;
}

/**
 * @param {HTMLElement} host
 * @param {{ flap_colors?: Record<string,string>, stickers?: object[] }} [decoration]
 */
export class RevealFrameCompositor {
  constructor(host, decoration = {}) {
    this.host = host;
    this.decoration = {
      flap_colors: decoration.flap_colors || {},
      stickers: decoration.stickers || [],
    };
    /** @type {number|null} */
    this.selectedNumber = null;
    /** @type {string} Stage 5 fortune string for Fake Text on land frames */
    this.fortuneText = '';
    this._renderGen = 0;
    this._stickerUrls = new Map();
    this.currentFrame = null;

    // Do NOT add `.reveal-frame` here — Chatterbox constructs this compositor
    // at Stage 2 while stables are still interactive (Stage 3/5 flap picks).
    // Class is applied in showFrame() only for Stage 6 lift/land frames.
    this.host.style.position = 'relative';
    this.host.style.overflow = 'visible';
  }

  setDecoration(decoration) {
    this.decoration = {
      flap_colors: decoration.flap_colors || {},
      stickers: decoration.stickers || [],
    };
  }

  /** @param {number|null} num Stage 5 selectedNumber2 */
  setSelectedNumber(num) {
    this.selectedNumber = num == null ? null : Number(num);
  }

  /** @param {string} text fortunes[N] — same string as desk fortune */
  setFortuneText(text) {
    this.fortuneText = text == null ? '' : String(text);
  }

  async _urlFor(id) {
    if (this._stickerUrls.has(id)) return this._stickerUrls.get(id);
    const url = await stickerImageUrl(id);
    this._stickerUrls.set(id, url);
    return url;
  }

  /**
   * Warm paper SVGs + reveal masks so Stage 6 can swap without a blank gap.
   * Safe to call during Stage 5 beat / wrap rotation.
   * @param {string[]} frameNames
   */
  async preload(frameNames) {
    const papers = [];
    for (const name of frameNames) {
      const meta = REVEAL_FRAMES[name];
      if (!meta) continue;
      papers.push(decodePaper(`${new URL(meta.file, FRAMES_BASE).href}?v=${PAPER_CACHE_VER}`));
    }
    await Promise.all([
      ...papers,
      loadMaskPath(REVEAL_FILL_ABS.left.file),
      loadMaskPath(REVEAL_FILL_ABS.right.file),
    ]);
  }

  /**
   * @param {string} frameName
   * @returns {Promise<{ w: number, h: number, layout: { x: number, y: number } }>}
   */
  async showFrame(frameName) {
    const meta = REVEAL_FRAMES[frameName];
    if (!meta) throw new Error(`Not a reveal frame: ${frameName}`);

    this.host.classList.add('reveal-frame');
    this.host.classList.remove('stable-frame');

    const gen = ++this._renderGen;
    const opacity =
      getComputedStyle(document.documentElement).getPropertyValue('--paint-opacity').trim() ||
      '0.70';
    const colors = this.decoration.flap_colors || {};
    const faces = revealFacesForNumber(this.selectedNumber ?? 1);
    const paperHref = `${new URL(meta.file, FRAMES_BASE).href}?v=${PAPER_CACHE_VER}`;

    // Build fully off-DOM and decode paper BEFORE clearing the previous frame.
    // Clearing early was the Stage 6 blank flash (rotation → empty → V37/V39).
    await decodePaper(paperHref);
    if (gen !== this._renderGen) return { w: meta.w, h: meta.h, layout: meta.layout };

    const paper = document.createElement('img');
    paper.className = 'reveal-frame-paper';
    paper.src = paperHref;
    paper.width = meta.w;
    paper.height = meta.h;
    paper.alt = '';
    paper.draggable = false;
    Object.assign(paper.style, {
      position: 'absolute',
      inset: '0',
      width: `${meta.w}px`,
      height: `${meta.h}px`,
      display: 'block',
      zIndex: '0',
      pointerEvents: 'none',
      userSelect: 'none',
    });

    const decor = document.createElement('div');
    decor.className = 'reveal-frame-decor';
    Object.assign(decor.style, {
      position: 'absolute',
      inset: '0',
      width: `${meta.w}px`,
      height: `${meta.h}px`,
      zIndex: '1',
      pointerEvents: 'none',
      overflow: 'visible',
    });

    const fillSvg = document.createElementNS(NS, 'svg');
    fillSvg.setAttribute('class', 'reveal-frame-fills');
    fillSvg.setAttribute('viewBox', `0 0 ${meta.w} ${meta.h}`);
    fillSvg.setAttribute('width', String(meta.w));
    fillSvg.setAttribute('height', String(meta.h));
    fillSvg.setAttribute('xmlns', NS);
    Object.assign(fillSvg.style, {
      position: 'absolute',
      inset: '0',
      overflow: 'visible',
      pointerEvents: 'none',
    });

    const fillsG = document.createElementNS(NS, 'g');
    fillsG.setAttribute('data-layer', 'Fill');
    fillsG.style.mixBlendMode = 'normal';

    for (const side of /** @type {const} */ (['left', 'right'])) {
      const abs = REVEAL_FILL_ABS[side];
      const flap = faces[side];
      const color = colors[flap];
      if (!color) continue;
      const d = await loadMaskPath(abs.file);
      if (gen !== this._renderGen) return { w: meta.w, h: meta.h, layout: meta.layout };
      const x = abs.x - meta.crop.x;
      const y = abs.y - meta.crop.y;
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('data-flap', flap);
      g.setAttribute('data-face', side);
      g.setAttribute('transform', `translate(${x} ${y})`);
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', color);
      path.setAttribute('fill-opacity', opacity);
      g.appendChild(path);
      fillsG.appendChild(g);
    }
    fillSvg.appendChild(fillsG);
    decor.appendChild(fillSvg);

    const stickerLayer = document.createElement('div');
    stickerLayer.className = 'reveal-frame-stickers';
    Object.assign(stickerLayer.style, {
      position: 'absolute',
      inset: '0',
      width: `${meta.w}px`,
      height: `${meta.h}px`,
      overflow: 'visible',
      pointerEvents: 'none',
    });

    const faceFlaps = new Set([faces.left, faces.right]);
    const faceQuads = revealFaceQuadsCropLocal(meta.crop);
    const UV = STICKER_UV_PX;
    const stickerJobs = [];
    for (const s of this.decoration.stickers || []) {
      const id = s.id || s.sticker_id;
      if (!id || !faceFlaps.has(s.flap)) continue;
      const side = s.flap === faces.left ? 'left' : 'right';
      const quad = faceQuads[side];
      if (!quad) continue;

      // Same matrix3d UV warp as stable-frame / decorate — onto reveal face diamond quads.
      const wrap = document.createElement('div');
      wrap.className = 'sticker-on-flap';
      wrap.dataset.flap = s.flap;
      wrap.dataset.face = side;
      Object.assign(wrap.style, {
        position: 'absolute',
        left: '0',
        top: '0',
        width: `${UV}px`,
        height: `${UV}px`,
        transformOrigin: '0 0',
        transform: matrix3dFromRect(UV, UV, quad),
        pointerEvents: 'none',
      });

      const sizePx = (s.scale ?? STICKER_SCALE) * UV;
      const img = document.createElement('img');
      img.alt = '';
      img.draggable = false;
      Object.assign(img.style, {
        position: 'absolute',
        left: `${s.u * UV - sizePx / 2}px`,
        top: `${s.v * UV - sizePx / 2}px`,
        width: `${sizePx}px`,
        height: 'auto',
        display: 'block',
        pointerEvents: 'none',
      });
      wrap.appendChild(img);
      stickerLayer.appendChild(wrap);
      stickerJobs.push(
        this._urlFor(id).then((url) => {
          if (gen !== this._renderGen) return;
          img.src = url;
        }),
      );
    }
    // Don't block the lift on stickers — paper + fills are enough for a solid first paint.
    void Promise.all(stickerJobs);

    decor.appendChild(stickerLayer);

    // Land frames: fortune text shaped to cream flap triangle, then matrix3d onto flap.
    // shape-outside floats fan lines (short at apex → wide at base); clip-path hard-clips.
    const fake = fakeTextQuadCropLocal(frameName, meta.crop);
    if (fake && this.fortuneText) {
      const { quad, align, w: boxW, h: boxH, clipPath, apexX } = fake;
      const fontFamily = "var(--font-fortune), 'Patrick Hand', cursive";
      const padding = '2px 2px';
      const lineHeight = '1.15';
      const copyOpts = { fontFamily, lineHeight, padding, textAlign: align, apexX };
      // Match paint metrics (Patrick Hand) before measuring fit.
      try {
        if (document.fonts?.ready) await document.fonts.ready;
        if (document.fonts?.load) {
          await document.fonts.load(`16px ${fontFamily}`);
        }
      } catch {
        /* ignore font load failures — fit still runs with fallback */
      }
      if (gen !== this._renderGen) return { w: meta.w, h: meta.h, layout: meta.layout };
      const fontSize = fitFortuneFontSize(this.fortuneText, boxW, boxH, copyOpts);

      const wrap = document.createElement('div');
      wrap.className = 'reveal-fake-text';
      wrap.setAttribute('aria-hidden', 'true');
      Object.assign(wrap.style, {
        position: 'absolute',
        left: '0',
        top: '0',
        width: `${boxW}px`,
        height: `${boxH}px`,
        transformOrigin: '0 0',
        transform: matrix3dFromRect(boxW, boxH, quad),
        // Hard boundary — nothing leaves the cream triangle.
        overflow: 'hidden',
        clipPath,
        webkitClipPath: clipPath,
        pointerEvents: 'none',
        zIndex: '2',
      });
      appendTriangleShapeFloats(wrap, apexX, '2px');

      const el = document.createElement('div');
      el.className = 'reveal-fake-text-copy';
      el.lang = 'en';
      el.textContent = this.fortuneText;
      Object.assign(el.style, {
        ...fortuneCopyStyles({ ...copyOpts, fontSize: `${fontSize}px` }),
        color: 'rgba(2, 1, 1, 0.55)',
        pointerEvents: 'none',
        userSelect: 'none',
      });
      wrap.appendChild(el);
      decor.appendChild(wrap);
    }

    if (gen !== this._renderGen) return { w: meta.w, h: meta.h, layout: meta.layout };

    // Atomic commit: previous open/rotated frame stays until this point.
    this.currentFrame = frameName;
    this.host.style.width = `${meta.w}px`;
    this.host.style.height = `${meta.h}px`;
    this.host.dataset.frame = frameName;
    this.host.innerHTML = '';
    this.host.appendChild(paper);
    this.host.appendChild(decor);

    return { w: meta.w, h: meta.h, layout: meta.layout };
  }
}
