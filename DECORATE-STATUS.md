# Decorate mode — status

**Status: COMPLETE / LOCKED** (2026-07-20)

Do not change paint, stickers, vibe, or save behaviour unless the product owner unlocks an increment. Confirmation sheet content structure is stable; a later Figma redesign may restyle it without changing the fields or actions.

## Build cadence (shipped)

1. **Magic Paint** — locked
2. **Sticker sheet** — locked
3. **Vibe selector overlay** — locked
4. **Save & release flow** — locked (confirmation sheet approved 2026-07-20)

## What's built

| Piece | Location | Notes |
|---|---|---|
| Desk 3-column shell | `screens/decorate.html`, `styles/decorate.css` | Left canvas + CTAs, centre steps, right stickers |
| V33 canvas + closed fills | `components/decorate-canvas.js` | Paint washes + sticker UV warp; NORMAL @ `--paint-opacity` 0.70 |
| Magic Paint tray | `components/magic-paint.js` | Brush, 7 pods, eraser (paint), floating cursor |
| Sticker sheet | `components/sticker-sheet.js`, `sticker-catalog.js`, `sticker-art.js` | Place / move / remove on flaps |
| Vibe selector | `components/vibe-selector.js`, `fortunes.js` | Overlay cards; Confirm; change-vibe dialog; `pickFortunes` |
| Save & Finish | `components/save-flow.js`, `supabase-api.js` | Always-clickable; validation; Supabase insert; confirmation sheet |
| Identity | `components/identity.js` | `maker_token` + display name / “A Mysterious Maker” |
| Placeholders | `screens/play-placeholder.html`, `screens/schoolyard-placeholder.html` | Linked from confirmation sheet |

## Save validation (locked copy)

| Condition | Helper (coral warning) |
|---|---|
| No vibe, flaps incomplete | `Choose a vibe and paint your flaps.` |
| No vibe only | `Choose a vibe before saving.` |
| Flaps incomplete only | `Paint all four flaps before saving.` |

## Supabase insert (locked shape)

- `maker_name` — display name or `null`
- `maker_token`
- `vibe` — Wildcard assigns one of Mystical / Funny / Wholesome / Dramatic at save; store assigned vibe
- `flap_colors` — `{ top_left, top_right, bottom_left, bottom_right }`
- `stickers` — `[{ sticker_id, flap, u, v }]`
- `fortunes` — keys `"1"`–`"8"` sequential (`fortune[0]` → `"1"`, …)

Env: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env.local` / Vercel. Generate browser env with `node scripts/write-supabase-env.mjs` → gitignored `components/supabase-env.js`.

## Confirmation sheet (locked structure)

Slide-up panel after successful insert. Dismiss (scrim / Esc) does **not** undo the save.

1. Thumbnail (~200px) — canvas clone + schoolyard drop-shadow (padded so shadow isn’t clipped)
2. Vibe pill — assigned/stored vibe label (Comfortaa optical pad)
3. Maker line — display name or “A Mysterious Maker”
4. Primary — “Play this chatterbox” → play placeholder `?id=`
5. Secondary — “Go to Schoolyard” → schoolyard placeholder `?spotlight=`

## Demo

Local: `http://127.0.0.1:8877/screens/decorate.html`

## Next session

**Play mode** — see `PLAY-STATUS.md`.
