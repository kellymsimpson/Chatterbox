#!/usr/bin/env node
/**
 * Apply the chatterboxes migration via PostgREST SQL is not available;
 * uses the Supabase Management / Postgres connection when SUPABASE_DB_URL
 * is set, otherwise prints the SQL for the dashboard.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, 'migrations/20260717140000_create_chatterboxes.sql');
const sql = readFileSync(sqlPath, 'utf8');

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.log('No SUPABASE_DB_URL / DATABASE_URL in env.');
  console.log('Paste this into the Supabase SQL Editor:\n');
  console.log(sql);
  process.exit(2);
}

const { default: pg } = await import('pg').catch(() => ({ default: null }));
if (!pg) {
  console.error('Install pg to apply via DATABASE_URL: npm i pg');
  console.log(sql);
  process.exit(2);
}

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(sql);
  console.log('Applied: chatterboxes table + RLS policies.');
} finally {
  await client.end();
}
