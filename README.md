# Chatterbox

A digital paper fortune teller (cootie catcher) — fold, decorate, and play chatterboxes with friends. Built with vanilla JS, Vercel, and Supabase.

**Start here → `HANDOFF.md`** — master checklist, asset export list, and the first Cursor session prompt.

## Stack
- **Frontend**: Vanilla JS / HTML / CSS (no framework)
- **Hosting**: Vercel · **Database**: Supabase (one table: `chatterboxes`)
- **Figma file key**: `dRqS5TWdiu2J4TPhiEyLrb`

## Reading order for Cursor
1. `HANDOFF.md` — rules, asset checklist, open items
2. `PLAN.md` — build order and critical instructions
3. `docs/Chatterbox-PRD-v1_5.md` — the full authoritative spec

## Layout
- `index.html` — Home screen · `showcase.html` — component QA page
- `styles/` — tokens + base CSS · `components/` — JS modules (chatterbox engine, coords, fortunes, identity)
- `screens/` — Cursor scaffolds decorate/play/construct/schoolyard here
- `icons/`, `assets/` — Cursor exports Figma assets here (see HANDOFF.md §3)
- `sandbox/` — isolated animation test page
