# Play mode — status

**Status: NOT STARTED** (stub — next session)

Decorate mode is **COMPLETE / LOCKED**. Do not reopen Decorate UI unless explicitly unlocked. See `DECORATE-STATUS.md`.

## Goal

Load a saved chatterbox by `id` and run the play experience (fold / pick numbers / reveal fortunes) per PRD.

## Entry points (stubbed from Decorate save)

| From | URL |
|---|---|
| Confirmation sheet — Play | `screens/play-placeholder.html?id=<uuid>` |
| Confirmation sheet — Schoolyard | `screens/schoolyard-placeholder.html?spotlight=<uuid>` |

## Consume Decorate’s locked payload

Play must read the `chatterboxes` row as saved:

- `vibe`, `maker_name`, `flap_colors`, `stickers[{ sticker_id, flap, u, v }]`
- `fortunes` keyed `"1"`–`"8"` (sequential — not remapped)

Reusable: `components/vibe-pill.js` (Figma `1377:2665`) for vibe tag UI.

## Suggested first increments

1. Replace `play-placeholder.html` with a real Play screen shell
2. Fetch chatterbox by `id` from Supabase
3. Render decorated closed chatterbox + open/close / number pick / fortune reveal
4. Schoolyard spotlight later (out of scope until Play core works)

## Blockers / notes

- None known beyond implementing Play against the existing schema.
- Env same as Decorate: `node scripts/write-supabase-env.mjs` after `.env.local` keys.
