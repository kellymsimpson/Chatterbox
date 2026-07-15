# Chatterbox — Build Plan (synced to PRD v1.5)

> Paste the full PRD (docs/Chatterbox-PRD-v1_5.md) alongside this file at the start of every Cursor session.
> This file is a quick-reference companion — not a replacement for the PRD.

## What we're building
A digital paper fortune teller web app. Users construct, decorate, and play chatterboxes.
Their creations enter a shared Schoolyard where other users can pick them up and have their fortune told.

## Screens
1. **Home** — entry point, three action cards (Construct / Decorate / Play), display name prompt
2. **Construct** — guided fold-by-fold assembly, scissors cut interaction
3. **Decorate** — vibe selection, Magic Paint (7 colours), 50 stickers, save & release
4. **Play** — 6-stage fortune-telling ritual, dual H/V reveal paths
5. **Schoolyard** — infinite scrolling canvas of community chatterboxes on concrete background

## Build order (follow this sequence)
1. Export all Figma assets FIRST (see HANDOFF.md asset checklist)
2. Supabase table + Vercel deploy
3. Decorate mode (Magic Paint → stickers → vibe → save)
4. Play mode (game loop → fortune reveal)
5. Schoolyard (virtual scroll → thumbnails → spotlight)
6. Home screen
7. Construct mode (last — most complex)

## Critical Cursor instructions
- **Figma file key**: `dRqS5TWdiu2J4TPhiEyLrb`
- **Vibe card icons**: export from Figma Design System node `772-9087`. Do NOT generate or substitute.
- **Chatterbox size**: 267px wide in BOTH Decorate and Play modes. Do not resize.
- **Flap coordinates**: copy from PRD §15 / components/flap-coords.js directly. Do not remeasure.
- **Decorate mode coordinates**: add `getBoundingClientRect()` offset at runtime.
- **Play mode coordinates**: already in screen space, no offset needed.
- **Fortune category**: use `Funny` — not `Chaotic`.
- **Reveal frames (v1.5)**: V37.3 and V39.3 DELETED from Figma — do not reference or export.
  Lift sequences are 3 frames (V37→V37.1→V37.2 and V39→V39.1→V39.2).
  Post-reveal frame chosen by number parity: V38.1/V40.1 = even (2,6 / 4,8), V38.2/V40.2 = odd (1,5 / 3,7).
- **Rotation (v1.5)**: use REVEAL_MAP in components/chatterbox.js — it is authoritative.
  H-mode: 1,2 no rotation; 5,6 → 180°. V-mode: EVERY selection rotates — 8,7 → 90° right; 3,4 → 90° left.
- **Decorated fills in reveal**: fills in Play mode Figma frames are PLACEHOLDERS. Render the maker's
  flap_colors + stickers at runtime. Outer flap ↔ inner number association (FLAP_NUMBER_MAP, fixed):
  top-left → 1,8 · top-right → 2,3 · bottom-right → 4,5 · bottom-left → 6,7.
- **Schoolyard shadows**: offset ~17px right, 12px down. Light source top-left. Never centre shadow under chatterbox.
- **Schoolyard canonical design**: Figma node `1186:9339`. Do NOT use node 1163:9232 (deprecated).
- **Post-fortune buttons**: "Play another" (always) / "Make one" or "Make another" (conditional on Supabase state) / "Home" (tertiary)
- **min-width**: 1440px in CSS

## Supabase schema
```sql
create table chatterboxes (
  id uuid default gen_random_uuid() primary key,
  maker_name text,
  maker_token text not null,
  vibe text not null,
  flap_colors jsonb not null,     -- { top, right, bottom, left }
  stickers jsonb not null,        -- [{ sticker_id, flap, u, v }]
  fortunes jsonb not null,        -- { "1": "...", ..., "8": "..." }
  created_at timestamptz default now()
);
```

## Identity
- On first visit: generate `usr_` + `crypto.randomUUID()`, store in `localStorage`
- Display name stored in `localStorage`, editable at any time
- Anonymous chatterboxes show "A Mysterious Maker" — fixed string, not generated

## Shareable URL
- Pattern: `/play/[chatterbox-id]`
- ID comes from Supabase auto-generated UUID on save

## Open questions (resolve before building affected feature)
- ~~V39/V40 vertical reveal frames complete?~~ ✅ RESOLVED — verified in Figma (v1.5)
- ~~Reveal frame mapping~~ ✅ RESOLVED — see PRD §9.4 mapping table / REVEAL_MAP (v1.5)
- V34 vs V41 distinction — V41 is the Play-mode variant; if identical, export once
- Fortune array-to-flap mapping — sequential or random? Confirm before Stage 6 build
- Maker name position on Play screen
- ~~200 fortunes~~ ✅ RESOLVED — content final, populated in components/fortunes.js (50 per vibe)
