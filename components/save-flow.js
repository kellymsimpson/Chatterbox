/**
 * Decorate — Save & Finish flow (PRD §8.9)
 * Always-clickable Save, inline validation, Supabase insert, confirmation sheet.
 * Confirmation sheet: Figma 1379:10483 “Post save Overlay” (reskin; wiring stable).
 */

import { getDisplayName, getMakerToken, getMakerName } from './identity.js?v=r11';
import { insertChatterbox } from './supabase-api.js?v=r11';
import { createVibePill, setVibePill } from './vibe-pill.js?v=r13';
import { buildThumbFromDecorateHost } from './decorate-thumb.js?v=s7';

const MSG_VIBE = 'Choose a vibe before saving.';
const MSG_PAINT = 'Paint all four flaps before saving.';
const MSG_BOTH = 'Choose a vibe and paint your flaps.';

const ASSIGNABLE_VIBES = ['Mystical', 'Funny', 'Wholesome', 'Dramatic'];

/**
 * @param {object} opts
 * @param {HTMLButtonElement} opts.saveBtn
 * @param {HTMLElement} opts.helperEl
 * @param {import('./decorate-canvas.js').DecorateCanvas} opts.canvas
 * @param {() => { vibe: string|null, fortunes: string[] }} opts.getVibeState
 * @param {() => string} [opts.getIdleHelper]
 */
export function mountSaveFlow({ saveBtn, helperEl, canvas, getVibeState, getIdleHelper }) {
  let saving = false;
  let lastSaveId = null;
  let validationActive = false;

  saveBtn.disabled = false;
  saveBtn.removeAttribute('aria-disabled');
  saveBtn.classList.add('is-ready');

  const sheet = document.createElement('div');
  sheet.className = 'save-sheet';
  sheet.hidden = true;
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', 'Chatterbox saved');
  sheet.dataset.nodeId = '1379:10483';
  sheet.innerHTML = `
    <div class="save-sheet-scrim" data-save-scrim></div>
    <div class="save-sheet-panel" data-save-panel>
      <div class="save-sheet-hero">
        <div class="save-sheet-thumb" data-save-thumb aria-hidden="true"></div>
        <div class="save-sheet-meta">
          <div data-save-vibe-host></div>
          <p class="save-sheet-maker" data-save-maker></p>
        </div>
      </div>
      <div class="save-sheet-actions">
        <a class="save-sheet-play figma-stroke-inside" data-save-play href="../screens/play.html">Play this Chatterbox</a>
        <a class="save-sheet-schoolyard" data-save-schoolyard href="../screens/schoolyard.html">Go to Schoolyard</a>
      </div>
    </div>
  `;
  document.body.appendChild(sheet);

  const thumbHost = sheet.querySelector('[data-save-thumb]');
  const vibeHost = sheet.querySelector('[data-save-vibe-host]');
  const vibePill = createVibePill({ vibe: 'Funny' });
  vibeHost.appendChild(vibePill);
  const makerEl = sheet.querySelector('[data-save-maker]');
  const playLink = sheet.querySelector('[data-save-play]');
  const yardLink = sheet.querySelector('[data-save-schoolyard]');

  function setHelper(text, { warning = false } = {}) {
    helperEl.textContent = text;
    helperEl.classList.toggle('is-warning', warning);
    validationActive = warning;
  }

  function clearValidation() {
    if (!validationActive) return;
    setHelper(getIdleHelper?.() || 'Paint all 4 flaps to save.', { warning: false });
  }

  function validationMessage(hasVibe, painted) {
    if (!hasVibe && painted < 4) return MSG_BOTH;
    if (!hasVibe) return MSG_VIBE;
    if (painted < 4) return MSG_PAINT;
    return null;
  }

  function resolveVibeForSave(selectedVibe) {
    if (selectedVibe === 'Wildcard') {
      return ASSIGNABLE_VIBES[Math.floor(Math.random() * ASSIGNABLE_VIBES.length)];
    }
    return selectedVibe;
  }

  function buildFortunesObject(fortunes) {
    /** @type {Record<string, string>} */
    const out = {};
    for (let i = 0; i < 8; i++) {
      out[String(i + 1)] = fortunes[i] || '';
    }
    return out;
  }

  function buildPayload(vibeState) {
    const storedVibe = resolveVibeForSave(vibeState.vibe);
    const flap_colors = {
      top_left: canvas.flap_colors.top_left,
      top_right: canvas.flap_colors.top_right,
      bottom_left: canvas.flap_colors.bottom_left,
      bottom_right: canvas.flap_colors.bottom_right,
    };
    const stickers = canvas.stickers.map((s) => ({
      sticker_id: s.id,
      flap: s.flap,
      u: s.u,
      v: s.v,
    }));
    return {
      maker_name: getDisplayName(), // null when anonymous
      maker_token: getMakerToken(),
      vibe: storedVibe,
      flap_colors,
      stickers,
      fortunes: buildFortunesObject(vibeState.fortunes),
      _selectedVibe: vibeState.vibe, // UI only — stripped before insert
    };
  }

  function renderThumbnail() {
    // Same DecorateCanvas clone + scale path as Schoolyard thumbs.
    // Shadow on a separate wrapper from the scale transform — filter+transform
    // on the same node clips the schoolyard drop-shadow bleed.
    thumbHost.replaceChildren(buildThumbFromDecorateHost(canvas.host));
  }

  function openSheet({ id, displayVibe }) {
    renderThumbnail();
    setVibePill(vibePill, displayVibe);
    makerEl.textContent = getMakerName();
    playLink.href = `../screens/play.html?id=${encodeURIComponent(id)}`;
    yardLink.href = `../screens/schoolyard.html?spotlight=${encodeURIComponent(id)}`;
    sheet.hidden = false;
    document.body.dataset.saveSheet = '1';
  }

  function closeSheet() {
    sheet.hidden = true;
    document.body.dataset.saveSheet = '';
    // Save is NOT undone
  }

  async function onSaveClick() {
    if (saving) return;
    clearValidation();

    const vibeState = getVibeState();
    const painted = canvas.paintedCount();
    const hasVibe = !!vibeState.vibe;
    const msg = validationMessage(hasVibe, painted);
    if (msg) {
      setHelper(msg, { warning: true });
      return;
    }

    saving = true;
    saveBtn.classList.add('is-saving');
    try {
      const payload = buildPayload(vibeState);
      const displayVibe = payload.vibe;
      const selectedVibe = payload._selectedVibe;
      delete payload._selectedVibe;

      const { id } = await insertChatterbox(payload);
      lastSaveId = id;
      window.__lastSaveId = id;
      window.__lastSavePayload = { ...payload, selected_vibe: selectedVibe };
      openSheet({ id, displayVibe });
    } catch (err) {
      console.error(err);
      setHelper('Save failed — check connection.', { warning: true });
    } finally {
      saving = false;
      saveBtn.classList.remove('is-saving');
    }
  }

  saveBtn.addEventListener('click', () => {
    void onSaveClick();
  });

  sheet.querySelector('[data-save-scrim]').addEventListener('click', closeSheet);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !sheet.hidden) closeSheet();
  });

  return {
    clearValidation,
    setHelper,
    getLastSaveId: () => lastSaveId,
    closeSheet,
    openSheet,
    destroy() {
      sheet.remove();
    },
  };
}

export { MSG_VIBE, MSG_PAINT, MSG_BOTH };
