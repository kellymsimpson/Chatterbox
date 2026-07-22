/**
 * Supabase REST helpers for chatterboxes.
 * Credentials from components/supabase-env.js (gitignored; generated from .env.local).
 */

let _envPromise = null;

async function loadEnv() {
  if (_envPromise) return _envPromise;
  _envPromise = import('./supabase-env.js')
    .then((m) => {
      const url = (m.SUPABASE_URL || '').replace(/\/$/, '');
      const key = m.SUPABASE_ANON_KEY || '';
      if (!url || !key || url.includes('YOUR_PROJECT')) {
        throw new Error(
          'Supabase credentials missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local, then run: node scripts/write-supabase-env.mjs'
        );
      }
      return { url, key };
    })
    .catch((err) => {
      _envPromise = null;
      throw err;
    });
  return _envPromise;
}

function authHeaders(key, extra = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra,
  };
}

/**
 * @param {object} row
 * @returns {Promise<{ id: string }>}
 */
export async function insertChatterbox(row) {
  const { url, key } = await loadEnv();
  const res = await fetch(`${url}/rest/v1/chatterboxes`, {
    method: 'POST',
    headers: authHeaders(key, {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }),
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase insert failed (${res.status}): ${text || res.statusText}`);
  }
  const data = await res.json();
  const record = Array.isArray(data) ? data[0] : data;
  if (!record?.id) throw new Error('Supabase insert returned no id');
  return { id: record.id };
}

/**
 * Fetch one chatterbox by UUID.
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function fetchChatterbox(id) {
  if (!id || typeof id !== 'string') {
    throw new Error('Missing chatterbox id');
  }
  const { url, key } = await loadEnv();
  const qs = new URLSearchParams({
    id: `eq.${id}`,
    select: '*',
    limit: '1',
  });
  const res = await fetch(`${url}/rest/v1/chatterboxes?${qs}`, {
    headers: authHeaders(key, { Accept: 'application/json' }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase fetch failed (${res.status}): ${text || res.statusText}`);
  }
  const data = await res.json();
  const record = Array.isArray(data) ? data[0] : data;
  if (!record?.id) throw new Error('Chatterbox not found');
  return record;
}

/**
 * Fetch all chatterboxes, newest first (Schoolyard pool).
 * @returns {Promise<object[]>}
 */
export async function fetchAllChatterboxes() {
  const { url, key } = await loadEnv();
  const qs = new URLSearchParams({
    select: 'id,maker_name,maker_token,vibe,flap_colors,stickers,created_at',
    order: 'created_at.desc',
  });
  const res = await fetch(`${url}/rest/v1/chatterboxes?${qs}`, {
    headers: authHeaders(key, { Accept: 'application/json' }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase list failed (${res.status}): ${text || res.statusText}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * How many chatterboxes this maker_token has saved (for "Make one" / "Make another").
 * @param {string|null|undefined} makerToken
 * @returns {Promise<number>}
 */
export async function countChatterboxesForMaker(makerToken) {
  if (makerToken == null || String(makerToken).trim() === '') return 0;
  const { url, key } = await loadEnv();
  const qs = new URLSearchParams({
    maker_token: `eq.${String(makerToken).trim()}`,
    select: 'id',
  });
  // GET + Range 0-0 + Prefer count=exact → Content-Range total (PostgREST / Supabase).
  const res = await fetch(`${url}/rest/v1/chatterboxes?${qs}`, {
    headers: authHeaders(key, {
      Accept: 'application/json',
      Prefer: 'count=exact',
      Range: '0-0',
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase count failed (${res.status}): ${text || res.statusText}`);
  }
  const range = res.headers.get('content-range') || '';
  // content-range: 0-0/3 or */0
  const m = range.match(/\/(\d+)\s*$/);
  return m ? Number(m[1]) : 0;
}
