/**
 * Schoolyard — community pool (PRD §6.5, Figma 1186:9339).
 * Exact CHATTERBOX REPEAT scatter (14 slots) + SHADOW REPEAT +17 / +11.5.
 * Virtual scroll; fill slots newest-first, cycling the tile down the page.
 * Thumbnails: DecorateCanvas V33 (same path as save-confirmation sheet).
 */

import { fetchAllChatterboxes } from './supabase-api.js?v=s7';
import { displayMakerName } from './identity.js?v=s7';
import {
  decorationFromRecord,
  renderDecoratedThumb,
} from './decorate-thumb.js?v=s7';

/**
 * Stored once per id on first layout — stable across scroll/re-render.
 * @type {Map<string, { x: number, y: number, rot: number }>}
 */
const layoutById = new Map();

/**
 * Session cache of rendered decorate-thumb frames (cloned into the pool).
 * @type {Map<string, HTMLElement>}
 */
const thumbCache = new Map();

/** In-flight thumb renders — avoid duplicate DecorateCanvas boots per id. */
const thumbPending = new Map();

const CANVAS_W = 1440;
/** Unrotated Fill size from Figma (~122.5); thumbnails match designed footprint. */
const ITEM = 124;
/** .schoolyard-chrome flow height — pool y=0 sits below this */
const CHROME_H = 140;
/** Frame 129 origin inside Schoolyard 1186:9339 */
const FRAME_X = 8.335;
const FRAME_Y = 173.43;
/**
 * REPEAT tile height (1192:15937) — vertical period for the scatter pattern.
 * SHADOW REPEAT offset confirmed: +17.098 / +11.576 ≈ +17 / +11.5 (CSS tokens).
 */
const TILE_H = 1196.97;
const PAD_BOTTOM = 160;
/** Extra DOM buffer above/below viewport for virtual scroll */
const VSCROLL_BUFFER = 720;
/**
 * Concrete layer extends past content so rubber-band overscroll
 * never reveals body desk brown (#7D5F36).
 */
const OVERSCROLL_BUF = 160;

/**
 * CHATTERBOX REPEAT (1186:11459) — Fill centers in tile / Frame 129 space, degrees.
 * Order: top→bottom, then left→right (newest Supabase rows fill from the top).
 * Extracted via Figma Plugin API absoluteTransform on each Group’s Fill.
 */
export const SLOT_TEMPLATE = Object.freeze([
  { x: 663.323, y: 79.419, rot: -163.523 }, // Group 34
  { x: 205.73, y: 139.176, rot: 79.463 }, // Group 32
  { x: 950.623, y: 195.546, rot: 5.708 }, // Group 26
  { x: 445.538, y: 417.104, rot: 15.0 }, // Group 24
  { x: 1260.964, y: 384.213, rot: 176.85 }, // Group 35
  { x: 86.479, y: 579.894, rot: 61.143 }, // Group 37
  { x: 672.259, y: 569.781, rot: -9.288 }, // Group 25
  { x: 1125.575, y: 674.753, rot: -40.813 }, // Group 27
  { x: 224.41, y: 797.265, rot: 79.463 }, // Group 33
  { x: 529.588, y: 948.426, rot: -22.696 }, // Group 28
  { x: 954.847, y: 944.985, rot: 17.782 }, // Group 29
  { x: 1345.713, y: 925.925, rot: 95.852 }, // Group 31
  { x: 1079.743, y: 1067.178, rot: 58.47 }, // Group 30
  { x: 177.775, y: 1108.283, rot: -52.527 }, // Group 36
]);

const SLOT_N = SLOT_TEMPLATE.length;

/**
 * Map a designed Fill center (tile space) → pool top-left for our ITEM box.
 * @param {{ x: number, y: number, rot: number }} slot
 * @param {number} tileIndex
 */
function slotToPoolPos(slot, tileIndex) {
  const cx = FRAME_X + slot.x;
  const cy = FRAME_Y + slot.y + tileIndex * TILE_H;
  return {
    x: cx - ITEM / 2,
    y: cy - CHROME_H - ITEM / 2,
    rot: slot.rot,
  };
}

/**
 * Exact Figma scatter — one designed slot per row, cycling the REPEAT tile.
 * @param {object[]} rows — already sorted newest-first
 * @returns {{ id: string, x: number, y: number, rot: number, maker_name: string, flap_colors: object, stickers: unknown }[]}
 */
export function computeLayout(rows) {
  return rows.map((row, index) => {
    const id = String(row.id);
    let pos = layoutById.get(id);
    if (!pos) {
      const slot = SLOT_TEMPLATE[index % SLOT_N];
      const tileIndex = Math.floor(index / SLOT_N);
      pos = slotToPoolPos(slot, tileIndex);
      layoutById.set(id, pos);
    }
    return {
      id,
      x: pos.x,
      y: pos.y,
      rot: pos.rot,
      maker_name: displayMakerName(row.maker_name),
      flap_colors: row.flap_colors || {},
      stickers: row.stickers || [],
    };
  });
}

/** Exposed for smoke checks — positions must not jump on re-render. */
export function getStoredLayout() {
  return layoutById;
}

/**
 * Dynamic scrollable pool height from chatterbox count + REPEAT layout.
 * Each laid-out item’s y already includes tileIndex * TILE_H (~1196.97),
 * so ~14 more chatterboxes → ~one more tile of scroll. Not viewport-capped.
 *
 * @param {{ y: number }[]} items — laid-out items (newest-first slot order)
 * @returns {number}
 */
export function canvasHeight(items) {
  const minH = Math.max(window.innerHeight - CHROME_H, 400);
  if (!items.length) return minH;

  let maxY = 0;
  for (const item of items) {
    if (item.y > maxY) maxY = item.y;
  }
  /* Last occupied slot + footprint + bottom pad — short when few, tall when many */
  return Math.max(maxY + ITEM + PAD_BOTTOM, minH);
}

/**
 * Size concrete bg to content + overscroll buffer (top & bottom).
 * @param {HTMLElement} screenEl
 * @param {number} poolH
 */
function syncConcreteExtent(screenEl, poolH) {
  const contentH = CHROME_H + poolH;
  screenEl.style.minHeight = `${contentH}px`;

  const bg = screenEl.querySelector('.schoolyard-bg');
  if (bg) {
    bg.style.top = `${-OVERSCROLL_BUF}px`;
    bg.style.height = `${contentH + 2 * OVERSCROLL_BUF}px`;
  }
}

/**
 * Build / reuse a scaled DecorateCanvas thumb (same compositor as save sheet).
 * @param {{ id: string, flap_colors: object, stickers: unknown }} item
 * @returns {Promise<HTMLElement>}
 */
async function ensureThumb(item) {
  const cached = thumbCache.get(item.id);
  if (cached) return cached.cloneNode(true);

  let pending = thumbPending.get(item.id);
  if (!pending) {
    pending = (async () => {
      const host = document.createElement('div');
      host.className = 'schoolyard-item-thumb-host';
      await renderDecoratedThumb(host, decorationFromRecord(item), {
        // Schoolyard uses the separate .schoolyard-item-shadow for light direction;
        // save-sheet wraps drop-shadow — here we only need the scaled frame.
        shadowClass: null,
        frameClass: 'schoolyard-item-thumb-frame',
      });
      const frame = host.firstElementChild;
      if (!(frame instanceof HTMLElement)) {
        throw new Error(`Thumb render produced no frame for ${item.id}`);
      }
      thumbCache.set(item.id, frame);
      thumbPending.delete(item.id);
      return frame;
    })().catch((err) => {
      thumbPending.delete(item.id);
      throw err;
    });
    thumbPending.set(item.id, pending);
  }

  const frame = await pending;
  return frame.cloneNode(true);
}

/** Play screen cache-bust — keep in sync with screens/play.html module query. */
const PLAY_CACHE = 's39';

/**
 * Navigate to Play for a chatterbox id.
 * @param {string} id
 */
export function playHrefForId(id) {
  return `./play.html?id=${encodeURIComponent(id)}&v=${PLAY_CACHE}`;
}

/**
 * @param {{ id: string, x: number, y: number, rot: number, maker_name: string, flap_colors: object, stickers: unknown }} item
 * @returns {HTMLAnchorElement}
 */
function createItemEl(item) {
  const el = document.createElement('a');
  el.className = 'schoolyard-item';
  el.dataset.id = item.id;
  el.href = playHrefForId(item.id);
  el.setAttribute('aria-label', `Play chatterbox by ${item.maker_name}`);
  el.style.left = `${item.x}px`;
  el.style.top = `${item.y}px`;

  const shadow = document.createElement('div');
  shadow.className = 'schoolyard-item-shadow';
  shadow.style.transform = `rotate(${item.rot}deg)`;
  shadow.setAttribute('aria-hidden', 'true');

  const face = document.createElement('div');
  face.className = 'schoolyard-item-face';
  face.style.transform = `rotate(${item.rot}deg)`;
  face.setAttribute('aria-hidden', 'true');

  const label = document.createElement('span');
  label.className = 'schoolyard-item-label';
  label.textContent = item.maker_name;

  el.append(shadow, face, label);

  void ensureThumb(item)
    .then((thumb) => {
      if (!el.isConnected) return;
      face.replaceChildren(thumb);
      el.classList.add('is-ready');
    })
    .catch((err) => {
      console.error('[schoolyard] thumb failed', item.id, err);
    });

  return el;
}

/**
 * Virtualized pool render — only mount items near the viewport.
 * Stored transforms apply whenever an item is recycled into view.
 * @param {HTMLElement} poolEl
 * @param {{ id: string, x: number, y: number, rot: number, maker_name: string, flap_colors: object, stickers: unknown }[]} items
 * @param {{ scrollY?: number, viewH?: number }} [view]
 */
export function renderPool(poolEl, items, view = {}) {
  const scrollY = view.scrollY ?? window.scrollY ?? 0;
  const viewH = view.viewH ?? window.innerHeight ?? 900;
  const y0 = scrollY - VSCROLL_BUFFER;
  const y1 = scrollY + viewH + VSCROLL_BUFFER;

  const visible = items.filter(
    (item) => item.y + ITEM >= y0 && item.y <= y1
  );

  /** @type {Map<string, HTMLElement>} */
  const existing = new Map();
  for (const child of poolEl.children) {
    if (child instanceof HTMLElement && child.dataset.id) {
      existing.set(child.dataset.id, child);
    }
  }

  const keep = new Set(visible.map((i) => i.id));
  for (const [id, node] of existing) {
    if (!keep.has(id)) node.remove();
  }

  const frag = document.createDocumentFragment();
  for (const item of visible) {
    if (existing.has(item.id)) continue;
    frag.append(createItemEl(item));
  }
  if (frag.childNodes.length) poolEl.append(frag);

  const poolH = canvasHeight(items);
  poolEl.style.height = `${poolH}px`;

  const screenEl = poolEl.closest('.schoolyard-screen');
  if (screenEl instanceof HTMLElement) {
    syncConcreteExtent(screenEl, poolH);
  }
}

/**
 * @param {HTMLElement} poolEl
 * @param {object[]} rows
 */
export function layoutAndRender(poolEl, rows) {
  const items = computeLayout(rows);
  renderPool(poolEl, items);
  return items;
}

/**
 * @param {HTMLElement | null} hintEl
 * @param {number} itemCount
 */
function syncScrollHint(hintEl, itemCount) {
  if (!hintEl) return;
  const hasOverflow =
    itemCount > 0 && document.documentElement.scrollHeight > window.innerHeight + 80;
  const scrolled = (window.scrollY || 0) > 48;
  hintEl.hidden = !hasOverflow || scrolled;
}

/**
 * Boot Schoolyard screen.
 * @returns {Promise<{ rows: object[], items: ReturnType<typeof computeLayout> }>}
 */
export async function bootSchoolyard() {
  const poolEl = document.getElementById('schoolyard-pool');
  const statusEl = document.getElementById('schoolyard-status');
  const hintEl = document.getElementById('schoolyard-scroll-hint');
  if (!poolEl) throw new Error('Missing #schoolyard-pool');

  document.documentElement.classList.add('schoolyard-page');
  document.body.classList.add('schoolyard-page');

  const rows = await fetchAllChatterboxes();
  const items = layoutAndRender(poolEl, rows);

  if (statusEl) {
    if (rows.length === 0) {
      statusEl.hidden = false;
      statusEl.textContent = 'Nothing here yet — be the first to Decorate one!';
    } else {
      statusEl.hidden = true;
    }
  }

  syncScrollHint(hintEl, items.length);

  /* Virtual scroll: remount near-viewport items; transforms come from layoutById */
  let raf = 0;
  const onScrollOrResize = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      renderPool(poolEl, items, {
        scrollY: window.scrollY,
        viewH: window.innerHeight,
      });
      syncScrollHint(hintEl, items.length);
    });
  };
  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });

  /* Stability smoke: re-render must keep the same x/y/rot (no jump). */
  const before = items.map(
    (i) => `${i.id}:${i.x.toFixed(2)},${i.y.toFixed(2)},${i.rot.toFixed(2)}`
  );
  layoutAndRender(poolEl, rows);
  const after = items.map((i) => {
    const p = layoutById.get(i.id);
    return `${i.id}:${p.x.toFixed(2)},${p.y.toFixed(2)},${p.rot.toFixed(2)}`;
  });
  const stable = before.every((s, i) => s === after[i]);
  const tiles = rows.length ? Math.floor((rows.length - 1) / SLOT_N) + 1 : 0;
  const poolH = canvasHeight(items);
  console.info('[schoolyard] loaded', {
    count: rows.length,
    slotsPerTile: SLOT_N,
    tileHeight: TILE_H,
    canvasW: CANVAS_W,
    item: ITEM,
    tiles,
    poolHeight: poolH,
    scrollHeight: document.documentElement.scrollHeight,
    layout: 'figma-exact',
    layoutStableOnRerender: stable,
    mounted: poolEl.children.length,
    thumbsCached: thumbCache.size,
  });
  if (!stable) {
    console.warn('[schoolyard] layout shifted on re-render — check layoutById');
  }

  return { rows, items };
}
