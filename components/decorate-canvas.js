/**
 * Decorate-mode chatterbox canvas — V33 closed + closed fill masks
 * in decorate-local space (placements from closed-placements.json).
 */

import { decorateQuadsVisual } from './flap-coords.js';
import { pointInQuad } from './geometry.js';

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
    this.fillsG = null;
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

    this._booted = true;
    await this._paintFills();
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
    const rect = this.host.getBoundingClientRect();
    const scaleX = 267 / rect.width;
    const scaleY = 294 / rect.height;
    const localX = (clientX - rect.left) * scaleX;
    const localY = (clientY - rect.top) * scaleY;
    return this.hitFlap(localX, localY);
  }
}

export { FLAP_KEYS };
