/**
 * Vibe Pill — Figma 1377:2665
 *
 * Variants: Funny | Mystical | Wholesome | Dramatic | Wildcard
 * Always shows the tag icon (no icon boolean on the component set).
 * Typography: Comfortaa Bold 13 / line-height 100% (AUTO → 1).
 * Layout: pad 8 16 8 14, radius 100, Soft White 2pt inside stroke, transparent fill.
 * Inner row: gap 6, align-items flex-end (Figma counterAxis MAX).
 */

const ICON_BASE = new URL('../assets/ui/vibe-pill/', import.meta.url);

const VIBES = {
  Funny: { label: 'funny', icon: 'funny.svg' },
  Mystical: { label: 'mystical', icon: 'mystical.svg' },
  Wholesome: { label: 'wholesome', icon: 'wholesome.svg' },
  Dramatic: { label: 'dramatic', icon: 'dramatic.svg' },
  Wildcard: { label: 'wildcard', icon: 'wildcard.svg' },
};

/**
 * @param {string} vibeId
 * @returns {keyof typeof VIBES}
 */
function normalizeVibe(vibeId) {
  if (vibeId && VIBES[vibeId]) return vibeId;
  const hit = Object.keys(VIBES).find((k) => k.toLowerCase() === String(vibeId || '').toLowerCase());
  return hit || 'Funny';
}

/**
 * @param {object} [opts]
 * @param {string} [opts.vibe='Funny']
 * @param {boolean} [opts.showIcon=true] — reserved; Pill has no icon boolean in Figma (always on)
 * @returns {HTMLElement}
 */
export function createVibePill({ vibe = 'Funny', showIcon = true } = {}) {
  const id = normalizeVibe(vibe);
  const meta = VIBES[id];

  const el = document.createElement('span');
  el.className = 'vibe-pill';
  el.dataset.vibe = id;
  el.dataset.nodeId = '1377:2665';
  el.setAttribute('role', 'text');

  const row = document.createElement('span');
  row.className = 'vibe-pill-row';

  if (showIcon) {
    const icon = document.createElement('img');
    icon.className = 'vibe-pill-icon';
    icon.src = new URL(meta.icon, ICON_BASE).href;
    icon.alt = '';
    icon.width = 16;
    icon.height = 16;
    icon.draggable = false;
    icon.setAttribute('aria-hidden', 'true');
    row.appendChild(icon);
  }

  const label = document.createElement('span');
  label.className = 'vibe-pill-label';
  label.textContent = meta.label;
  row.appendChild(label);

  el.appendChild(row);
  return el;
}

/**
 * Update an existing pill element’s vibe.
 * @param {HTMLElement} el
 * @param {string} vibe
 */
export function setVibePill(el, vibe) {
  const id = normalizeVibe(vibe);
  const meta = VIBES[id];
  el.dataset.vibe = id;
  const icon = el.querySelector('.vibe-pill-icon');
  const label = el.querySelector('.vibe-pill-label');
  if (icon) icon.src = new URL(meta.icon, ICON_BASE).href;
  if (label) label.textContent = meta.label;
}

export { VIBES as VIBE_PILL_VARIANTS, normalizeVibe };
