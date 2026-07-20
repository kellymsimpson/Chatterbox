# Play mode — status

**Status: NOT STARTED** (stub for next session)

Decorate mode is complete and locked — see `DECORATE-STATUS.md`.

## Goal

Load a saved chatterbox by id and run the play experience (fold / pick / reveal fortunes) per PRD.

## Entry points (already stubbed)

| From | URL |
|---|---|
| Confirmation sheet — Play | `screens/play-placeholder.html?id=<uuid>` |
| Confirmation sheet — Schoolyard | `screens/schoolyard-placeholder.html?spotlight=<uuid>` |

## Suggested first increments

1. Replace `play-placeholder.html` with a real Play screen shell
2. Fetch chatterbox row by `id` from Supabase (flap colours, stickers, fortunes, vibe, maker)
3. Render decorated closed chatterbox + wire open/close / number pick / fortune reveal
4. Hook Schoolyard spotlight separately (out of scope until Play core works)

## Blockers / notes

- None known beyond implementing Play UI against the existing `chatterboxes` schema.
- Decorate save payload and fortune keying (`"1"`–`"8"` sequential) are locked — Play should consume that shape as-is.
