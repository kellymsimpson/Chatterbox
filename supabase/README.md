# Supabase

## `chatterboxes` table

Schema source of truth: `PLAN.md` / PRD OQ2. Migration:

`migrations/20260717140000_create_chatterboxes.sql`

### Apply (pick one)

1. **Dashboard** — Supabase → SQL Editor → paste the migration → Run.
2. **CLI** (linked project):
   ```bash
   npx supabase db push
   ```
3. **Service role** (CI / agent), with `SUPABASE_DB_URL` or project ref + service role in env:
   ```bash
   node supabase/apply-migration.mjs
   ```

RLS: public `SELECT` + `INSERT` for `anon` / `authenticated`. No update/delete in v1.
