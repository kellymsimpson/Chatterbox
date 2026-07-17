/**
 * Paint + sticker compositor for chatterbox flaps (PRD §8.6–8.7).
 *
 * Stable states (closed / H-open / V-open / reveal): recolorable Figma masks.
 * Runtime open/close is stables only (V33↔V34 / V33↔V36) — intermediates are
 * not in any sequence. Intermediate handlers below are retained offline.
 * Opacity: always --paint-opacity (0.70); no fades on the runtime path.
 */

import {
  FRAME_COORD_KEY,
  PLAY_TO_LOCAL_ORIGIN,
  decorateQuadsVisual,
  playQuadsVisual,
  play_flap_coords,
} from './flap-coords.js';
import {
  matrix3dFromRect,
  playQuadToLocal,
  quadToPoints,
} from './geometry.js';

const FILL_BASE = new URL('../assets/fills/', import.meta.url);
const STICKER_BASE = new URL('../assets/stickers/', import.meta.url);

const MASK_FILES = {
  closed: {
    top_left: 'closed-top-left.svg',
    top_right: 'closed-top-right.svg',
    bottom_left: 'closed-bottom-left.svg',
    bottom_right: 'closed-bottom-right.svg',
  },
  h: {
    top_left: 'h-top-left.svg',
    top_right: 'h-top-right.svg',
    bottom_left: 'h-bottom-left.svg',
    bottom_right: 'h-bottom-right.svg',
  },
  v: {
    top_left: 'v-top-left.svg',
    top_right: 'v-top-right.svg',
    bottom_left: 'v-bottom-left.svg',
    bottom_right: 'v-bottom-right.svg',
  },
};

const STABLE_MASK_SET = {
  V33: 'closed',
  V34: 'h',
  V36: 'v',
  V41: 'h',
};

const INTERMEDIATE = new Set(['V33.1', 'V33.2', 'V35.1', 'V35.2']);
const FLAP_KEYS = ['top_left', 'top_right', 'bottom_left', 'bottom_right'];

const MASK_SIZE = {
  'closed-top-left.svg': [110, 107],
  'closed-top-right.svg': [111, 107],
  'closed-bottom-left.svg': [104, 116],
  'closed-bottom-right.svg': [111, 111],
  'h-top-left.svg': [133, 87],
  'h-top-right.svg': [134, 87],
  'h-bottom-left.svg': [135, 90],
  'h-bottom-right.svg': [135, 88],
  'v-top-left.svg': [87, 128],
  'v-top-right.svg': [92, 128],
  'v-bottom-left.svg': [82, 142],
  'v-bottom-right.svg': [94, 143],
};

const svgCache = new Map();

async function loadMaskSvg(file) {
  if (svgCache.has(file)) return svgCache.get(file).cloneNode(true);
  const res = await fetch(new URL(file, FILL_BASE).href);
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) throw new Error(`Bad mask SVG: ${file}`);
  svgCache.set(file, svg);
  return svg.cloneNode(true);
}

export function localQuadsForFrame(frameName) {
  const key = FRAME_COORD_KEY[frameName];
  if (!key) return decorateQuadsVisual();
  return mapPlaySet(play_flap_coords[key]);
}

function mapPlaySet(playSet) {
  const visual = playQuadsVisual(playSet);
  const out = {};
  for (const k of FLAP_KEYS) {
    out[k] = playQuadToLocal(visual[k], PLAY_TO_LOCAL_ORIGIN);
  }
  return out;
}

export class PaintStickerLayer {
  /**
   * @param {HTMLElement} host
   * @param {{ flap_colors: Record<string,string>, stickers?: Array<{flap:string, id:string, u:number, v:number, scale?:number}> }} decoration
   */
  constructor(host, decoration) {
    this.host = host;
    this.decoration = decoration;
    this._renderGen = 0;
    this.host.classList.add('paint-sticker-layer');
    this.host.innerHTML = `
      <svg class="paint-svg" viewBox="0 0 267 294" width="267" height="294"
           xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g class="paint-polys"></g>
      </svg>
      <div class="paint-masks"></div>
      <div class="sticker-layer"></div>
    `;
    this.polyG = this.host.querySelector('.paint-polys');
    this.maskLayer = this.host.querySelector('.paint-masks');
    this.stickerLayer = this.host.querySelector('.sticker-layer');
  }

  setDecoration(decoration) {
    this.decoration = decoration;
  }

  render(frameName) {
    const gen = ++this._renderGen;
    const quads = localQuadsForFrame(frameName);
    const colors = this.decoration?.flap_colors || {};
    const maskSet = STABLE_MASK_SET[frameName];
    const useDerived = INTERMEDIATE.has(frameName) || !maskSet;

    this.polyG.innerHTML = '';
    this.maskLayer.innerHTML = '';

    if (useDerived) {
      // Option 1 fallback: hide paint + stickers on intermediate frames.
      // Decorations snap off for V33.1/V33.2/V35.1/V35.2 and back on at stables.
      this.stickerLayer.innerHTML = '';
      return;
    }

    const files = MASK_FILES[maskSet];
    const tasks = FLAP_KEYS.map(async (flap) => {
      const color = colors[flap];
      if (!color) return;
      const file = files[flap];
      const [mw, mh] = MASK_SIZE[file];
      const svg = await loadMaskSvg(file);
      if (gen !== this._renderGen) return;
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.style.display = 'block';
      svg.style.overflow = 'visible';

      const el = document.createElement('div');
      el.className = 'flap-paint-mask';
      el.dataset.flap = flap;
      el.style.color = color;
      el.style.opacity = 'var(--paint-opacity)';
      el.style.width = `${mw}px`;
      el.style.height = `${mh}px`;
      el.style.transformOrigin = '0 0';
      el.style.transform = matrix3dFromRect(mw, mh, quads[flap]);
      el.appendChild(svg);
      this.maskLayer.appendChild(el);
    });

    Promise.all(tasks).then(() => {
      if (gen !== this._renderGen) return;
      this.renderStickers(quads);
    });
  }

  renderStickers(quads) {
    this.stickerLayer.innerHTML = '';
    const stickers = this.decoration?.stickers || [];
    // UV plane in CSS px — must be >>1 so <img> rasterizes before matrix3d.
    const UV_PX = 100;
    for (const s of stickers) {
      const quad = quads[s.flap];
      if (!quad) continue;

      const wrap = document.createElement('div');
      wrap.className = 'sticker-on-flap';
      wrap.style.position = 'absolute';
      wrap.style.left = '0';
      wrap.style.top = '0';
      wrap.style.width = `${UV_PX}px`;
      wrap.style.height = `${UV_PX}px`;
      wrap.style.transformOrigin = '0 0';
      wrap.style.transform = matrix3dFromRect(UV_PX, UV_PX, quad);

      const scale = s.scale ?? 0.28;
      const sizePx = scale * UV_PX;
      const img = document.createElement('img');
      img.src = new URL(`${s.id}.svg`, STICKER_BASE).href;
      img.alt = '';
      img.draggable = false;
      img.style.position = 'absolute';
      img.style.left = `${s.u * UV_PX - sizePx / 2}px`;
      img.style.top = `${s.v * UV_PX - sizePx / 2}px`;
      img.style.width = `${sizePx}px`;
      img.style.height = 'auto';
      wrap.appendChild(img);
      this.stickerLayer.appendChild(wrap);
    }
  }
}
