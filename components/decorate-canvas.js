/**
 * Decorate-mode chatterbox canvas — V33 closed + closed fill masks
 * in decorate-local space (placements from closed-placements.json).
 */

import { decorateQuadsVisual } from './flap-coords.js?v=r9d';
import { matrix3dFromRect, pointInQuad, uvFromPointInQuad } from './geometry.js?v=r9d';
import { MAX_STICKERS, STICKER_SCALE, STICKER_UV_PX } from './sticker-catalog.js?v=r9d';
import { stickerImageUrl } from './sticker-art.js?v=r9d';

const FRAMES_BASE = new URL('../assets/frames/', import.meta.url);
const FILLS_BASE = new URL('../assets/fills/', import.meta.url);

const FLAP_KEYS = ['top_left', 'top_right', 'bottom_left', 'bottom_right'];
const NS = 'http://www.w3.org/2000/svg';

const pathCache = new Map();
let stickerUidSeq = 0;

async function loadMaskPath(file) {
  if (pathCache.has(file)) return pathCache.get(file);
  const text = await fetch(new URL(file, FILLS_BASE)).then((r) => r.text());
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const d = doc.querySelector('path')?.getAttribute('d');
  if (!d) throw new Error(`No path in ${file}`);
  pathCache.set(file, d);
  return d;
}

export class DecorateCanvas {
  /**
   * @param {HTMLElement} host
   * @param {{ flap_colors?: Record<string, string|null>, stickers?: object[] }} [state]
   */
  constructor(host, state = {}) {
    this.host = host;
    this.flap_colors = { ...Object.fromEntries(FLAP_KEYS.map((k) => [k, null])), ...(state.flap_colors || {}) };
    /** @type {Array<{ uid: string, id: string, flap: string, u: number, v: number, scale: number }>} */
    this.stickers = [...(state.stickers || [])].map((s) => ({
      uid: s.uid || `s${++stickerUidSeq}`,
      id: s.id,
      flap: s.flap,
      u: s.u,
      v: s.v,
      scale: s.scale ?? STICKER_SCALE,
    }));
    this.quads = decorateQuadsVisual();
    this.placements = null;
    this.fillsG = null;
    this.stickerLayer = null;
    this.previewLayer = null;
    /** @type {Map<string, string>} */
    this._stickerUrls = new Map();
    this._booted = false;
    this._ready = this._boot();
  }

  async _boot() {
    this.host.classList.add('decorate-canvas');
    this.host.style.width = '267px';
    this.host.style.height = '294px';
    this.host.style.position = 'relative';
    this.host.innerHTML = '';

    this.placements = await fetch(new URL('closed-placements.json', FILLS_BASE)).then((r) => {
      if (!r.ok) throw new Error(`placements ${r.status}`);
      return r.json();
    });

    // Paper as <img> — avoids cloning the huge V33 SVG DOM into the page.
    const paper = document.createElement('img');
    paper.className = 'decorate-paper';
    paper.src = new URL('v33.svg', FRAMES_BASE).href;
    paper.width = 267;
    paper.height = 294;
    paper.alt = '';
    paper.draggable = false;
    Object.assign(paper.style, {
      position: 'absolute',
      inset: '0',
      width: '267px',
      height: '294px',
      display: 'block',
      zIndex: '0',
    });
    this.host.appendChild(paper);

    this.root = document.createElementNS(NS, 'svg');
    this.root.setAttribute('class', 'decorate-fills');
    this.root.setAttribute('viewBox', '0 0 267 294');
    this.root.setAttribute('width', '267');
    this.root.setAttribute('height', '294');
    this.root.setAttribute('xmlns', NS);
    Object.assign(this.root.style, {
      position: 'absolute',
      inset: '0',
      zIndex: '1',
      pointerEvents: 'none',
      overflow: 'visible',
    });

    this.fillsG = document.createElementNS(NS, 'g');
    this.fillsG.setAttribute('data-layer', 'Fill');
    this.fillsG.style.mixBlendMode = 'normal';
    this.root.appendChild(this.fillsG);
    this.host.appendChild(this.root);

    this.stickerLayer = document.createElement('div');
    this.stickerLayer.className = 'decorate-sticker-layer';
    Object.assign(this.stickerLayer.style, {
      position: 'absolute',
      inset: '0',
      width: '267px',
      height: '294px',
      zIndex: '2',
      pointerEvents: 'none',
      overflow: 'visible',
    });
    this.host.appendChild(this.stickerLayer);

    this.previewLayer = document.createElement('div');
    this.previewLayer.className = 'decorate-sticker-preview';
    Object.assign(this.previewLayer.style, {
      position: 'absolute',
      inset: '0',
      width: '267px',
      height: '294px',
      zIndex: '3',
      pointerEvents: 'none',
      overflow: 'visible',
    });
    this.host.appendChild(this.previewLayer);

    this._booted = true;
    await this._paintFills();
    await this.renderStickers();
  }

  async ready() {
    await this._ready;
  }

  /**
   * Spec: each colour may paint only one flap. Reject if `color` is already
   * on a different flap. Overwriting this flap frees its previous colour.
   * @returns {Promise<boolean>} true if applied
   */
  setFlapColor(flap, color) {
    if (!FLAP_KEYS.includes(flap)) return Promise.resolve(false);
    if (color) {
      for (const [key, used] of Object.entries(this.flap_colors)) {
        if (key !== flap && used === color) return Promise.resolve(false);
      }
    }
    this.flap_colors[flap] = color;
    return this.renderFills().then(() => true);
  }

  clearFlap(flap) {
    return this.setFlapColor(flap, null);
  }

  paintedCount() {
    return FLAP_KEYS.filter((k) => this.flap_colors[k]).length;
  }

  /** Hex colours currently painted on any flap. */
  colorsInUse() {
    return new Set(FLAP_KEYS.map((k) => this.flap_colors[k]).filter(Boolean));
  }

  /** Public: waits for boot, then paints. */
  async renderFills() {
    await this._ready;
    return this._paintFills();
  }

  /** Internal: assumes placements + fillsG exist (or no-op). */
  async _paintFills() {
    if (!this.fillsG || !this.placements) return;
    this.fillsG.innerHTML = '';
    const opacity = getComputedStyle(document.documentElement)
      .getPropertyValue('--paint-opacity')
      .trim() || '0.70';

    for (const m of this.placements.masks) {
      const color = this.flap_colors[m.flap];
      if (!color) continue;
      const d = await loadMaskPath(m.file);
      const x = m.instanceLocal.x + m.exportOrigin.x;
      const y = m.instanceLocal.y + m.exportOrigin.y;
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('data-flap', m.flap);
      g.setAttribute('transform', `translate(${x} ${y})`);
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', color);
      path.setAttribute('fill-opacity', opacity);
      path.style.mixBlendMode = 'normal';
      g.appendChild(path);
      this.fillsG.appendChild(g);
    }
  }

  hitFlap(localX, localY) {
    for (const flap of FLAP_KEYS) {
      if (pointInQuad(localX, localY, this.quads[flap])) return flap;
    }
    return null;
  }

  hitFlapFromClient(clientX, clientY) {
    const { localX, localY } = this.clientToLocal(clientX, clientY);
    return this.hitFlap(localX, localY);
  }

  clientToLocal(clientX, clientY) {
    const rect = this.host.getBoundingClientRect();
    const scaleX = 267 / rect.width;
    const scaleY = 294 / rect.height;
    return {
      localX: (clientX - rect.left) * scaleX,
      localY: (clientY - rect.top) * scaleY,
    };
  }

  /**
   * @returns {{ flap: string, u: number, v: number } | null}
   */
  uvFromClient(clientX, clientY) {
    const { localX, localY } = this.clientToLocal(clientX, clientY);
    const flap = this.hitFlap(localX, localY);
    if (!flap) return null;
    const uv = uvFromPointInQuad(localX, localY, this.quads[flap]);
    if (!uv) return null;
    return { flap, u: uv.u, v: uv.v };
  }

  stickerCount() {
    return this.stickers.length;
  }

  /**
   * @param {{ id: string, flap: string, u: number, v: number, scale?: number, uid?: string }} sticker
   * @param {{ silent?: boolean }} [opts]
   * @returns {object|null}
   */
  addSticker(sticker, opts = {}) {
    if (!opts.silent && this.stickers.length >= MAX_STICKERS) return null;
    const entry = {
      uid: sticker.uid || `s${++stickerUidSeq}`,
      id: sticker.id,
      flap: sticker.flap,
      u: sticker.u,
      v: sticker.v,
      scale: sticker.scale ?? STICKER_SCALE,
    };
    this.stickers.push(entry);
    this.renderStickers();
    return { ...entry };
  }

  removeStickerByUid(uid) {
    const i = this.stickers.findIndex((s) => s.uid === uid);
    if (i < 0) return null;
    const [removed] = this.stickers.splice(i, 1);
    this.renderStickers();
    return removed;
  }

  /**
   * Topmost sticker under client point (same flap, UV near center).
   * @returns {object|null}
   */
  removeStickerAtClient(clientX, clientY) {
    const hit = this.uvFromClient(clientX, clientY);
    if (!hit) return null;
    const half = STICKER_SCALE * 0.55;
    for (let i = this.stickers.length - 1; i >= 0; i--) {
      const s = this.stickers[i];
      if (s.flap !== hit.flap) continue;
      if (Math.abs(s.u - hit.u) <= half && Math.abs(s.v - hit.v) <= half) {
        const [removed] = this.stickers.splice(i, 1);
        this.renderStickers();
        return removed;
      }
    }
    return null;
  }

  async _urlFor(id) {
    if (this._stickerUrls.has(id)) return this._stickerUrls.get(id);
    const url = await stickerImageUrl(id);
    this._stickerUrls.set(id, url);
    return url;
  }

  async renderStickers() {
    if (!this.stickerLayer) return;
    this.stickerLayer.innerHTML = '';
    const UV = STICKER_UV_PX;
    for (const s of this.stickers) {
      const quad = this.quads[s.flap];
      if (!quad) continue;
      const wrap = document.createElement('div');
      wrap.className = 'sticker-on-flap';
      wrap.dataset.uid = s.uid;
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
      this.stickerLayer.appendChild(wrap);
      this._urlFor(s.id).then((url) => {
        img.src = url;
      });
    }
  }

  /**
   * Live skew preview while holding a sticker over a flap.
   * @param {{ id: string, flap: string, u: number, v: number, scale?: number }} sticker
   */
  showStickerPreview(sticker) {
    if (!this.previewLayer) return;
    const quad = this.quads[sticker.flap];
    if (!quad) {
      this.clearStickerPreview();
      return;
    }
    const UV = STICKER_UV_PX;
    const scale = sticker.scale ?? STICKER_SCALE;
    const sizePx = scale * UV;
    const gen = (this._previewGen = (this._previewGen || 0) + 1);

    let wrap = this.previewLayer.querySelector('.sticker-on-flap');
    let img = wrap?.querySelector('img');
    if (!wrap) {
      this.previewLayer.innerHTML = '';
      wrap = document.createElement('div');
      wrap.className = 'sticker-on-flap is-preview';
      Object.assign(wrap.style, {
        position: 'absolute',
        left: '0',
        top: '0',
        width: `${UV}px`,
        height: `${UV}px`,
        transformOrigin: '0 0',
        opacity: '0.85',
        pointerEvents: 'none',
      });
      img = document.createElement('img');
      img.alt = '';
      img.draggable = false;
      Object.assign(img.style, {
        position: 'absolute',
        height: 'auto',
        display: 'block',
      });
      wrap.appendChild(img);
      this.previewLayer.appendChild(wrap);
    }

    wrap.style.transform = matrix3dFromRect(UV, UV, quad);
    img.style.left = `${sticker.u * UV - sizePx / 2}px`;
    img.style.top = `${sticker.v * UV - sizePx / 2}px`;
    img.style.width = `${sizePx}px`;

    if (img.dataset.stickerId !== sticker.id) {
      img.dataset.stickerId = sticker.id;
      this._urlFor(sticker.id).then((url) => {
        if (gen !== this._previewGen) return;
        img.src = url;
      });
    }
  }

  clearStickerPreview() {
    if (this.previewLayer) this.previewLayer.innerHTML = '';
  }
}

export { FLAP_KEYS };
