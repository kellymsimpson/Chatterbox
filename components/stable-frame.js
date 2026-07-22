/**
 * Stable-frame compositor — same path as sandbox/step4-motion-cycles.html.
 *
 * V33 / V34 / V36 decorations use placement-composed Figma masks
 * (closed-placements / h-placements / v-placements) — NOT quad-derived fills.
 * Stickers warp via matrix3d onto crop-local flap quads.
 *
 * Component sets:
 *   closed → 492:14781
 *   H-open → 499:15373
 *   V-open → 496:14975
 */

import {
  FRAME_COORD_KEY,
  playQuadsVisual,
  play_flap_coords,
  decorateQuadsVisual,
} from './flap-coords.js';
import { matrix3dFromRect } from './geometry.js';
import { stickerImageUrl } from './sticker-art.js';
import { STICKER_SCALE, STICKER_UV_PX } from './sticker-catalog.js';

const FRAMES_BASE = new URL('../assets/frames/', import.meta.url);
const FILLS_BASE = new URL('../assets/fills/', import.meta.url);
const NS = 'http://www.w3.org/2000/svg';

/** Runtime stables only — matches sandbox step4 + chatterbox.js sequences. */
export const STABLE_FRAMES = {
  V33: {
    file: 'v33.svg',
    w: 267,
    h: 294,
    paint: 'closed',
    quads: 'decorate',
    /** Play-frame position (closed-placements chatterboxOriginInFrame). */
    layout: { x: 588.7576904296875, y: 141.44384765625 },
  },
  V34: {
    file: 'v34.svg',
    /** Flap numbers — composited ABOVE fills (Figma stack / readable glyphs). */
    numbers: 'v34-numbers.svg',
    w: 292,
    h: 209,
    paint: 'h',
    quads: 'play',
    /** h-placements.json cropOriginInPlayFrame */
    crop: { x: 579.0999755859375, y: 192.3262481689453 },
    layout: { x: 579.0999755859375, y: 192.3262481689453 },
  },
  V36: {
    file: 'v36.svg',
    /** Vertical Flap Numbers sibling after Fills on V41.2 — not under paint. */
    numbers: 'v36-numbers.svg',
    w: 273,
    h: 330,
    paint: 'v',
    quads: 'play',
    /** v-placements.json / sandbox step4 crop */
    crop: { x: 591.3331909179688, y: 126.23858642578125 },
    layout: { x: 591.3331909179688, y: 126.23858642578125 },
  },
};

const PLACEMENT_FILES = {
  closed: 'closed-placements.json',
  h: 'h-placements.json',
  v: 'v-placements.json',
};

const pathCache = new Map();
const placementCache = new Map();

async function loadMaskPath(file) {
  if (pathCache.has(file)) return pathCache.get(file);
  const text = await fetch(new URL(file, FILLS_BASE)).then((r) => r.text());
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const d = doc.querySelector('path')?.getAttribute('d');
  if (!d) throw new Error(`No path in ${file}`);
  pathCache.set(file, d);
  return d;
}

async function loadPlacements(kind) {
  if (placementCache.has(kind)) return placementCache.get(kind);
  const file = PLACEMENT_FILES[kind];
  const data = await fetch(new URL(file, FILLS_BASE)).then((r) => {
    if (!r.ok) throw new Error(`placements ${file}: ${r.status}`);
    return r.json();
  });
  placementCache.set(kind, data);
  return data;
}

function playQuadsCropLocal(frameName, crop) {
  const key = FRAME_COORD_KEY[frameName];
  const visual = playQuadsVisual(play_flap_coords[key]);
  const out = {};
  for (const [flap, q] of Object.entries(visual)) {
    out[flap] = {
      C0: [q.C0[0] - crop.x, q.C0[1] - crop.y],
      C1: [q.C1[0] - crop.x, q.C1[1] - crop.y],
      C2: [q.C2[0] - crop.x, q.C2[1] - crop.y],
      C3: [q.C3[0] - crop.x, q.C3[1] - crop.y],
    };
  }
  return out;
}

export function quadsForStable(frameName) {
  const meta = STABLE_FRAMES[frameName];
  if (!meta) return decorateQuadsVisual();
  if (meta.quads === 'decorate') return decorateQuadsVisual();
  return playQuadsCropLocal(frameName, meta.crop);
}

/**
 * Compositor for closed / H-open / V-open stables (sandbox step4 path).
 */
export class StableFrameCompositor {
  /**
   * @param {HTMLElement} host
   * @param {{ flap_colors?: Record<string,string>, stickers?: object[] }} [decoration]
   */
  constructor(host, decoration = {}) {
    this.host = host;
    this.decoration = {
      flap_colors: decoration.flap_colors || {},
      stickers: decoration.stickers || [],
    };
    this._renderGen = 0;
    this._stickerUrls = new Map();
    this.currentFrame = null;

    this.host.classList.add('stable-frame');
    this.host.style.position = 'relative';
    this.host.style.overflow = 'visible';
  }

  setDecoration(decoration) {
    this.decoration = {
      flap_colors: decoration.flap_colors || {},
      stickers: decoration.stickers || [],
    };
  }

  async _urlFor(id) {
    if (this._stickerUrls.has(id)) return this._stickerUrls.get(id);
    const url = await stickerImageUrl(id);
    this._stickerUrls.set(id, url);
    return url;
  }

  /**
   * @param {string} frameName V33 | V34 | V36
   * @returns {Promise<{ w: number, h: number, layout: { x: number, y: number } }>}
   */
  async showFrame(frameName) {
    const meta = STABLE_FRAMES[frameName];
    if (!meta) throw new Error(`Not a stable frame: ${frameName}`);

    this.host.classList.add('stable-frame');
    this.host.classList.remove('reveal-frame');

    const gen = ++this._renderGen;
    const opacity =
      getComputedStyle(document.documentElement).getPropertyValue('--paint-opacity').trim() ||
      '0.70';
    const colors = this.decoration.flap_colors || {};
    const placements = await loadPlacements(meta.paint);
    if (gen !== this._renderGen) return { w: meta.w, h: meta.h, layout: meta.layout };

    this.currentFrame = frameName;
    this.host.style.width = `${meta.w}px`;
    this.host.style.height = `${meta.h}px`;
    this.host.dataset.frame = frameName;
    this.host.innerHTML = '';

    const paper = document.createElement('img');
    paper.className = 'stable-frame-paper';
    paper.src = new URL(meta.file, FRAMES_BASE).href;
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
    this.host.appendChild(paper);

    const decor = document.createElement('div');
    decor.className = 'stable-frame-decor';
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
    fillSvg.setAttribute('class', 'stable-frame-fills');
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

    for (const m of placements.masks) {
      const color = colors[m.flap];
      if (!color) continue;
      const d = await loadMaskPath(m.file);
      if (gen !== this._renderGen) return { w: meta.w, h: meta.h, layout: meta.layout };
      const x = m.instanceLocal.x + m.exportOrigin.x;
      const y = m.instanceLocal.y + m.exportOrigin.y;
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('data-flap', m.flap);
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
    stickerLayer.className = 'stable-frame-stickers';
    Object.assign(stickerLayer.style, {
      position: 'absolute',
      inset: '0',
      width: `${meta.w}px`,
      height: `${meta.h}px`,
      overflow: 'visible',
      pointerEvents: 'none',
    });

    const quads = quadsForStable(frameName);
    const UV = STICKER_UV_PX;
    for (const s of this.decoration.stickers || []) {
      const id = s.id || s.sticker_id;
      const quad = quads[s.flap];
      if (!id || !quad) continue;
      const wrap = document.createElement('div');
      wrap.className = 'sticker-on-flap';
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
      this._urlFor(id).then((url) => {
        if (gen !== this._renderGen) return;
        img.src = url;
      });
    }

    decor.appendChild(stickerLayer);

    // Flap numbers ABOVE fills (and stickers) — matches V41.2 where Vertical Flap
    // Numbers is a sibling after Fills. Baking numbers into paper let paint masks
    // occlude glyphs so they read too high / muddy.
    if (meta.numbers) {
      const nums = document.createElement('img');
      nums.className = 'stable-frame-numbers';
      nums.src = new URL(meta.numbers, FRAMES_BASE).href;
      nums.width = meta.w;
      nums.height = meta.h;
      nums.alt = '';
      nums.draggable = false;
      Object.assign(nums.style, {
        position: 'absolute',
        inset: '0',
        width: `${meta.w}px`,
        height: `${meta.h}px`,
        display: 'block',
        zIndex: '3',
        pointerEvents: 'none',
        userSelect: 'none',
      });
      decor.appendChild(nums);
    }

    this.host.appendChild(decor);

    return { w: meta.w, h: meta.h, layout: meta.layout };
  }
}
