# Decorate mode — status

**Status: COMPLETE / LOCKED** (2026-07-20)

Do not change paint, stickers, vibe, or save behaviour unless the product owner unlocks an increment. Confirmation sheet is Figma `1379:10483` (Post save Overlay); vibe pill is reusable component `1377:2665`.

## Build cadence (shipped)

1. **Magic Paint** — locked
2. **Sticker sheet** — locked
3. **Vibe selector overlay** — locked
4. **Save & release flow** — locked (Figma confirmation sheet + vibe pill, 2026-07-20)

## What's built

| Piece | Location | Notes |
|---|---|---|
| Desk 3-column shell | `screens/decorate.html`, `styles/decorate.css` | Left canvas + CTAs, centre steps, right stickers |
| V33 canvas + closed fills | `components/decorate-canvas.js` | Paint washes + sticker UV warp |
| Magic Paint tray | `components/magic-paint.js` | Brush, 7 pods, eraser (paint), floating cursor |
| Sticker sheet | `components/sticker-sheet.js`, `sticker-catalog.js`, `sticker-art.js` | Place / move / remove on flaps |
| Vibe selector | `components/vibe-selector.js`, `fortunes.js` | Overlay cards; Confirm; change-vibe dialog; `pickFortunes` |
| Save & Finish | `components/save-flow.js`, `supabase-api.js` | Always-clickable; validation; Supabase insert; confirmation sheet |
| Vibe pill (reusable) | `components/vibe-pill.js`, `assets/ui/vibe-pill/` | Figma `1377:2665` — also for Schoolyard tooltip / Play later |
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

## Confirmation sheet — Figma `1379:10483`

Opaque **560×500** wood-desk card (`assets/textures/desk-wood.png` + desk brown + 20% black wash, `border-radius: 50px`, `overflow: hidden`) over vibe-overlay scrim (`rgba(2,1,1,0.55)`). Slide-up entrance; Esc / scrim dismiss does **not** undo the save. Root background fill is required — do not render contents on a transparent panel.

Measured spacing (locked to frame):

| Value | Figma source | Applied |
|---|---|---|
| Thumbnail left pad | Frame 134 `paddingLeft` | **6px** (paper x = **188.64** in 560) |
| Thumb → pill gap | Frame 133 gap 8 + Frame 132 padTop 1 | **9px** |
| Schoolyard → sheet bottom | Tertiary Button bottom gap | **47.24px** (panel `padding: 47.24px 0`) |

1. Live thumbnail (~189px wide canvas clone + schoolyard drop-shadow)
2. Vibe pill (`1377:2665`) — icon + label, Comfortaa Bold 13 / line-height 100%, Soft White inside stroke
3. Maker — Outfit Medium 20 Bright White (`getMakerName()`)
4. Primary — “Play this Chatterbox” → play placeholder `?id=`
5. Secondary — “Go to Schoolyard” → schoolyard placeholder `?spotlight=`

## Demo

Local: `http://127.0.0.1:8877/screens/decorate.html`

## Next session

**Play mode** — see `PLAY-STATUS.md`.
