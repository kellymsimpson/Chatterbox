# Decorate mode — status

**Status: COMPLETE / LOCKED** (2026-07-20)

Decorate mode is finished. Do not change paint, stickers, vibe, save, or confirmation-sheet behaviour unless the product owner unlocks an increment.

Final lock commit on `main`: confirmation sheet spacing to Figma `1379:10483` (see git log for `Lock confirmation sheet spacing`).

## Shipped increments (all locked)

1. **Magic Paint** — tray, brush, 7 pods, flap wash, eraser (paint)
2. **Sticker sheet** — place / move / remove on flaps (UV warp)
3. **Vibe selector** — overlay cards, Confirm, change-vibe dialog, `pickFortunes`
4. **Save & release** — validation, Supabase insert, Figma confirmation sheet + reusable vibe pill

## What's built

| Piece | Location | Notes |
|---|---|---|
| Desk 3-column shell | `screens/decorate.html`, `styles/decorate.css` | Left canvas + CTAs, centre steps, right stickers |
| V33 canvas + closed fills | `components/decorate-canvas.js` | Paint washes + sticker UV warp |
| Magic Paint tray | `components/magic-paint.js` | Brush, pods, eraser, floating cursor |
| Sticker sheet | `components/sticker-sheet.js`, `sticker-catalog.js`, `sticker-art.js` | Optional stickers on flaps |
| Vibe selector | `components/vibe-selector.js`, `fortunes.js` | Overlay + fortunes on confirm |
| Save & Finish | `components/save-flow.js`, `supabase-api.js` | Always-clickable; insert; sheet |
| Vibe pill (reusable) | `components/vibe-pill.js`, `assets/ui/vibe-pill/` | Figma `1377:2665` — reuse in Schoolyard / Play |
| Identity | `components/identity.js` | `maker_token` + “A Mysterious Maker” when anon |
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

## Confirmation sheet — Figma `1379:10483`

Opaque **560×500** wood-desk card (`assets/textures/desk-wood.png` + desk brown + 20% black wash, `border-radius: 50px`, `overflow: hidden`) over vibe-overlay scrim (`rgba(2,1,1,0.55)`). Slide-up entrance; Esc / scrim dismiss does **not** undo the save. Always honour root/background fills on overlays (including clipped children).

Measured spacing (locked to frame):

| Value | Figma source | Applied |
|---|---|---|
| Thumbnail left pad | Frame 134 `paddingLeft` | **6px** (paper x = **188.64** in 560) |
| Thumb → pill gap | Frame 133 gap 8 + Frame 132 padTop 1 | **9px** |
| Schoolyard → sheet bottom | Tertiary Button bottom gap | **47.24px** (panel `padding: 47.24px 0`) |

Content structure (stable):

1. Live thumbnail (Frame 134 **194.72×196.52**, schoolyard drop-shadow)
2. Vibe pill (`1377:2665`) — icon + label, Comfortaa Bold 13 / line-height 100%
3. Maker — Outfit Medium 20 Bright White (`getMakerName()`)
4. Primary — “Play this Chatterbox” → `play-placeholder.html?id=`
5. Secondary — “Go to Schoolyard” → `schoolyard-placeholder.html?spotlight=`

## Demo

Local: `http://127.0.0.1:8877/screens/decorate.html`

## Next session

**Play mode** — start from `PLAY-STATUS.md`. Decorate is closed.
