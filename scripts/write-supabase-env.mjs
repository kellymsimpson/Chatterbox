#!/usr/bin/env node
/**
 * Writes components/supabase-env.js from .env.local / .env
 * without printing secret values.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envFiles = ['.env.local', '.env', '.env.supabase.tmp', '.env.production.tmp'];

const vars = {};
for (const name of envFiles) {
  const path = resolve(root, name);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith('#') || !s.includes('=')) continue;
    const i = s.indexOf('=');
    const k = s.slice(0, i).trim();
    let v = s.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    vars[k] = v;
  }
}

const url =
  vars.VITE_SUPABASE_URL ||
  vars.SUPABASE_URL ||
  vars.NEXT_PUBLIC_SUPABASE_URL ||
  '';
const key =
  vars.VITE_SUPABASE_ANON_KEY ||
  vars.SUPABASE_ANON_KEY ||
  vars.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const out = resolve(root, 'components/supabase-env.js');
writeFileSync(
  out,
  `/** Auto-generated — do not commit. */\nexport const SUPABASE_URL = ${JSON.stringify(url)};\nexport const SUPABASE_ANON_KEY = ${JSON.stringify(key)};\n`
);
console.log('Wrote components/supabase-env.js (url length', url.length, ', key length', key.length, ')');
