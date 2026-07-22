/**
 * Chatterbox — Identity
 *
 * Display name: optional, stored in localStorage, editable at any time.
 * Maker token:  persistent device identity, generated once and never changed.
 *               Format: 'usr_' + crypto.randomUUID()
 *
 * Anonymous chatterboxes always show "A Mysterious Maker" — fixed string, never generated.
 */

export const ANON_NAME = 'A Mysterious Maker';

/** Display name for a saved row — DB null/blank → canonical anonymous string. */
export function displayMakerName(name) {
  const trimmed = name == null ? '' : String(name).trim();
  return trimmed || ANON_NAME;
}

export function getMakerToken() {
  let token = localStorage.getItem('maker_token');
  if (!token) {
    token = 'usr_' + crypto.randomUUID();
    localStorage.setItem('maker_token', token);
  }
  return token;
}

export function getDisplayName() {
  return localStorage.getItem('display_name') || null;
}

export function setDisplayName(name) {
  if (name && name.trim()) {
    localStorage.setItem('display_name', name.trim());
  }
}

export function getMakerName() {
  return getDisplayName() || ANON_NAME;
}

export function clearDisplayName() {
  localStorage.removeItem('display_name');
}
