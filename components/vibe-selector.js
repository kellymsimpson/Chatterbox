/**
 * Vibe selection — PRD §8.4
 * Overlay: Card Menu Overlay 1133:9509 + Card states 704:9298
 * Icons: Design System Card icons (772:9087 / 302:2151)
 * Panel card: default variant + edit=true (selected variant is overlay-only)
 * Confirm: Main Buttons primary disabled 1365:10060 → enabled 462:13167
 */

import { pickFortunes } from './fortunes.js?v=r10';

const ICON_BASE = new URL('../assets/ui/vibe-icons/', import.meta.url);
const ICON_VER = 'taupe1';

/** @param {string} id @param {'default'|'selected'|'disabled'} state */
function iconSrc(id, state) {
  const key = id.toLowerCase();
  return new URL(`${key}-${state}.svg?v=${ICON_VER}`, ICON_BASE).href;
}

export const VIBES = [
  {
    id: 'Mystical',
    label: 'Mystical',
    blurb: 'Poetic. Cosmic. Ancient-feeling.',
  },
  {
    id: 'Funny',
    label: 'Funny',
    blurb: 'Absurd. Unhinged. Gloriously random.',
  },
  {
    id: 'Wholesome',
    label: 'Wholesome',
    blurb: 'Warm. Gentle. Quietly encouraging.',
  },
  {
    id: 'Dramatic',
    label: 'Dramatic',
    blurb: 'Theatrical. Bold. A little unwell.',
  },
  {
    id: 'Wildcard',
    label: 'Wild Card',
    blurb: "I don't know. Choose for me.",
  },
];

const CHANGE_COPY = 'Changing your vibe generates new fortunes. Your decorations stay the same.';

/**
 * @param {object} opts
 * @param {HTMLElement} opts.slotHost — Theme Container slot (replaces Pick a Vibe)
 * @param {HTMLButtonElement} opts.triggerBtn — existing Pick a Vibe button
 * @param {() => boolean} [opts.hasDecorations] — true if any paint or stickers exist
 * @param {(info: { vibe: string|null, fortunes: string[] }) => void} [opts.onChange]
 */
export function mountVibeSelector({ slotHost, triggerBtn, hasDecorations, onChange }) {
  /** @type {string|null} confirmed vibe */
  let confirmedVibe = null;
  /** @type {string[]} */
  let fortunes = [];
  /** @type {string|null} draft selection inside overlay */
  let draftVibe = null;

  const overlay = document.createElement('div');
  overlay.className = 'vibe-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Choose a vibe');
  overlay.innerHTML = `
    <div class="vibe-overlay-scrim" data-vibe-scrim></div>
    <div class="vibe-overlay-panel" data-node-id="1133:9509">
      <div class="vibe-overlay-cards" role="listbox" aria-label="Vibe cards" data-vibe-cards></div>
      <button type="button" class="vibe-confirm-btn figma-stroke-inside" data-vibe-confirm data-state="disabled" disabled>
        Confirm
      </button>
    </div>
  `;
  document.body.appendChild(overlay);

  const cardsEl = overlay.querySelector('[data-vibe-cards]');
  const confirmBtn = overlay.querySelector('[data-vibe-confirm]');
  /** @type {Map<string, HTMLButtonElement>} */
  const cardBtns = new Map();

  for (const vibe of VIBES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'vibe-card';
    btn.dataset.vibe = vibe.id;
    btn.dataset.variant = 'default';
    btn.setAttribute('role', 'option');
    btn.setAttribute('aria-label', vibe.label);
    btn.innerHTML = `
      <img class="vibe-card-icon" data-icon alt="" width="48" height="48" draggable="false" />
      <span class="vibe-card-copy">
        <span class="vibe-card-title-row">
          <span class="vibe-card-title">${vibe.label}</span>
        </span>
        <span class="vibe-card-blurb">${vibe.blurb}</span>
      </span>
    `;
    const icon = btn.querySelector('[data-icon]');
    icon.src = iconSrc(vibe.id, 'default');
    cardsEl.appendChild(btn);
    cardBtns.set(vibe.id, btn);

    btn.addEventListener('pointerenter', () => {
      // Hover works on every non-selected card, including visual "disabled"
      if (draftVibe && vibe.id === draftVibe) return;
      btn.dataset.variant = 'hover';
      icon.src = iconSrc(vibe.id, 'selected');
    });
    btn.addEventListener('pointerleave', () => {
      // Restore base default / selected / disabled for this card
      if (!draftVibe) {
        btn.dataset.variant = 'default';
        btn.setAttribute('aria-selected', 'false');
        icon.src = iconSrc(vibe.id, 'default');
        return;
      }
      if (vibe.id === draftVibe) {
        btn.dataset.variant = 'selected';
        btn.setAttribute('aria-selected', 'true');
        icon.src = iconSrc(vibe.id, 'selected');
      } else {
        btn.dataset.variant = 'disabled';
        btn.setAttribute('aria-selected', 'false');
        icon.src = iconSrc(vibe.id, 'disabled');
      }
    });
    btn.addEventListener('click', () => {
      draftVibe = vibe.id;
      syncOverlayCards();
    });
  }

  const selectedHost = document.createElement('div');
  selectedHost.className = 'vibe-selected-slot';
  selectedHost.hidden = true;
  slotHost.appendChild(selectedHost);

  const changeDialog = document.createElement('div');
  changeDialog.className = 'vibe-change-dialog';
  changeDialog.hidden = true;
  changeDialog.setAttribute('role', 'alertdialog');
  changeDialog.setAttribute('aria-modal', 'true');
  changeDialog.setAttribute('aria-labelledby', 'vibe-change-copy');
  changeDialog.innerHTML = `
    <div class="vibe-change-scrim" data-change-scrim></div>
    <div class="vibe-change-panel">
      <p class="vibe-change-copy" id="vibe-change-copy">${CHANGE_COPY}</p>
      <div class="vibe-change-actions">
        <button type="button" class="vibe-change-confirm figma-stroke-inside" data-change-confirm>Confirm</button>
        <button type="button" class="vibe-change-cancel" data-change-cancel>Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(changeDialog);

  /** @type {string|null} pending vibe awaiting change confirm */
  let pendingVibe = null;

  function emit() {
    onChange?.({ vibe: confirmedVibe, fortunes: [...fortunes] });
  }

  function syncConfirmBtn() {
    const enabled = !!draftVibe;
    confirmBtn.disabled = !enabled;
    confirmBtn.dataset.state = enabled ? 'enabled' : 'disabled';
  }

  function syncOverlayCards() {
    for (const vibe of VIBES) {
      const btn = cardBtns.get(vibe.id);
      const icon = btn.querySelector('[data-icon]');
      // Card "disabled" is a visual variant only — other cards stay clickable
      // so the maker can switch the draft selection (incl. pre-highlighted reopen).
      if (!draftVibe) {
        btn.dataset.variant = 'default';
        btn.setAttribute('aria-selected', 'false');
        icon.src = iconSrc(vibe.id, 'default');
        continue;
      }
      if (vibe.id === draftVibe) {
        btn.dataset.variant = 'selected';
        btn.setAttribute('aria-selected', 'true');
        icon.src = iconSrc(vibe.id, 'selected');
      } else {
        btn.dataset.variant = 'disabled';
        btn.setAttribute('aria-selected', 'false');
        icon.src = iconSrc(vibe.id, 'disabled');
      }
    }
    syncConfirmBtn();
  }

  function renderSelectedCard() {
    if (!confirmedVibe) {
      selectedHost.hidden = true;
      selectedHost.innerHTML = '';
      triggerBtn.hidden = false;
      return;
    }
    const meta = VIBES.find((v) => v.id === confirmedVibe);
    triggerBtn.hidden = true;
    selectedHost.hidden = false;
    // Panel uses DEFAULT card + edit=true (selected variant is overlay-only)
    selectedHost.innerHTML = `
      <button type="button" class="vibe-card vibe-card--panel" data-variant="default" data-edit="true" data-panel-card aria-label="${meta.label}, edit vibe">
        <img class="vibe-card-icon" alt="" width="48" height="48" draggable="false" src="${iconSrc(confirmedVibe, 'default')}" />
        <span class="vibe-card-copy">
          <span class="vibe-card-title-row">
            <span class="vibe-card-title">${meta.label}</span>
            <span class="vibe-edit-badge" aria-hidden="true">
              <img src="${new URL('edit-pencil.svg', ICON_BASE).href}" width="16" height="16" alt="" />
              edit
            </span>
          </span>
          <span class="vibe-card-blurb">${meta.blurb}</span>
        </span>
      </button>
    `;
    selectedHost.querySelector('[data-panel-card]').addEventListener('click', () => openOverlay(true));
  }

  function openOverlay(preHighlight) {
    draftVibe = preHighlight && confirmedVibe ? confirmedVibe : null;
    syncOverlayCards();
    overlay.hidden = false;
    document.body.dataset.vibeOverlay = '1';
  }

  function closeOverlay() {
    overlay.hidden = true;
    document.body.dataset.vibeOverlay = '';
    draftVibe = null;
  }

  function applyVibe(vibeId) {
    confirmedVibe = vibeId;
    fortunes = pickFortunes(vibeId, 8);
    renderSelectedCard();
    closeOverlay();
    emit();
  }

  function requestConfirm(vibeId) {
    if (!confirmedVibe) {
      applyVibe(vibeId);
      return;
    }
    if (confirmedVibe === vibeId) {
      closeOverlay();
      return;
    }
    // No paint and no stickers → change immediately; otherwise confirm first.
    if (!hasDecorations?.()) {
      applyVibe(vibeId);
      return;
    }
    pendingVibe = vibeId;
    changeDialog.hidden = false;
  }

  triggerBtn.disabled = false;
  triggerBtn.removeAttribute('aria-disabled');
  triggerBtn.closest('.decorate-step--vibe')?.removeAttribute('aria-disabled');
  triggerBtn.addEventListener('click', () => openOverlay(false));

  confirmBtn.addEventListener('click', () => {
    if (!draftVibe) return;
    requestConfirm(draftVibe);
  });

  overlay.querySelector('[data-vibe-scrim]').addEventListener('click', () => {
    closeOverlay();
  });

  changeDialog.querySelector('[data-change-confirm]').addEventListener('click', () => {
    if (!pendingVibe) return;
    applyVibe(pendingVibe);
    pendingVibe = null;
    changeDialog.hidden = true;
  });
  changeDialog.querySelector('[data-change-cancel]').addEventListener('click', () => {
    pendingVibe = null;
    changeDialog.hidden = true;
  });
  changeDialog.querySelector('[data-change-scrim]').addEventListener('click', () => {
    pendingVibe = null;
    changeDialog.hidden = true;
  });

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!changeDialog.hidden) {
      pendingVibe = null;
      changeDialog.hidden = true;
      return;
    }
    if (!overlay.hidden) closeOverlay();
  });

  return {
    getVibe: () => confirmedVibe,
    getFortunes: () => [...fortunes],
    destroy() {
      overlay.remove();
      changeDialog.remove();
      selectedHost.remove();
    },
  };
}
