/**
 * Decorate-mode chatterbox canvas — V33 closed + closed fill masks
 * in decorate-local space (placements from closed-placements.json).
 */

import { decorateQuadsVisual } from './flap-coords.js?v=paint1';
import { pointInQuad } from './geometry.js?v=paint1';

const FRAMES_BASE = new URL('../assets/frames/', import.meta.url);
const FILLS_BASE = new URL('../assets/fills/', import.meta.url);

const FLAP_KEYS = ['top_left', 'top_right', 'bottom_left', 'bottom_right'];
const NS = 'http://www.w3.org/2000/svg';

const pathCache = new Map();

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
   * @param {{ flap_colors?: Record<string, string|null> }} [state]
   */
  constructor(host, state = {}) {
    this.host = host;
    this.flap_colors = { ...Object.fromEntries(FLAP_KEYS.map((k) => [k, null])), ...(state.flap_colors || {}) };
    this.quads = decorateQuadsVisual();
    this.placements = null;
    this._ready = this._boot();
  }

  async _boot() {
    this.host.classList.add('decorate-canvas');
    this.host.style.width = '267px';
    this.host.style.height = '294px';
    this.host.style.position = 'relative';

    this.placements = await fetch(new URL('closed-placements.json', FILLS_BASE)).then((r) => r.json());

    this.root = document.createElementNS(NS, 'svg');
    this.root.setAttribute('class', 'decorate-composite');
    this.root.setAttribute('viewBox', '0 0 267 294');
    this.root.setAttribute('width', '267');
    this.root.setAttribute('height', '294');
    this.root.setAttribute('xmlns', NS);

    const paperText = await fetch(new URL('v33.svg', FRAMES_BASE)).then((r) => r.text());
    const paperDoc = new DOMParser().parseFromString(paperText, 'image/svg+xml');
    const paperSvg = paperDoc.querySelector('svg');
    const paperG = document.createElementNS(NS, 'g');
    paperG.setAttribute('data-layer', 'paper');
    for (const child of [...paperSvg.childNodes]) {
      paperG.appendChild(document.importNode(child, true));
    }
    this.root.appendChild(paperG);

    this.fillG = document.createElementNS(NS, 'g');
    this.fillG.setAttribute('data-layer', 'Fill');
    this.fillG.style.mixBlendMode = 'normal';
    this.root.appendChild(this.fillG);

    this.host.innerHTML = '';
    this.host.appendChild(this.root);
    await this.renderFills();
  }

  async ready() {
    await this._ready;
  }

  setFlapColor(flap, color) {
    if (!FLAP_KEYS.includes(flap)) return;
    this.flap_colors[flap] = color;
    return this.renderFills();
  }

  clearFlap(flap) {
    return this.setFlapColor(flap, null);
  }

  paintedCount() {
    return FLAP_KEYS.filter((k) => this.flap_colors[k]).length;
  }

  async renderFills() {
    await this._ready;
    this.fillG.innerHTML = '';
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
      this.fillG.appendChild(g);
    }
  }

  /**
   * Hit-test decorate-local point → visual flap key, or null.
   * @param {number} localX
   * @param {number} localY
   */
  hitFlap(localX, localY) {
    for (const flap of FLAP_KEYS) {
      if (pointInQuad(localX, localY, this.quads[flap])) return flap;
    }
    return null;
  }

  /** Client (viewport) coords → decorate-local, then hit. */
  hitFlapFromClient(clientX, clientY) {
    const rect = this.host.getBoundingClientRect();
    const scaleX = 267 / rect.width;
    const scaleY = 294 / rect.height;
    const localX = (clientX - rect.left) * scaleX;
    const localY = (clientY - rect.top) * scaleY;
    return this.hitFlap(localX, localY);
  }
}

export { FLAP_KEYS };
