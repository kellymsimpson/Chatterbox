# Schoolyard status — ✅ Complete / approved

Canonical Figma: **1186:9339**. Texture: **1074:7286** → `assets/textures/schoolyard-concrete.png`.

## Shipped

| Piece | Status |
|---|---|
| Concrete bg, `repeat-y`, seamless | ✅ `.schoolyard-bg` + body concrete |
| Dynamic scroll height (count → tiles × ~1196.97) | ✅ `canvasHeight()` |
| Overscroll buffer — no desk-brown sliver | ✅ content + 160px top/bottom |
| Vertical scroll shell + chrome | ✅ `screens/schoolyard.html` |
| `fetchAllChatterboxes()` newest-first (+ flap_colors, stickers) | ✅ `components/supabase-api.js` |
| **Exact Figma REPEAT scatter** (14 slots, tile H ≈ 1196.97) | ✅ `SLOT_TEMPLATE` in `components/schoolyard.js` |
| SHADOW REPEAT **+17 / +11.5** | ✅ tokens + CSS |
| Virtual scroll + “↓ more chatterboxes below” | ✅ |
| Decorated V33 thumbs (same DecorateCanvas path as save sheet) | ✅ `decorate-thumb.js` + session cache |
| Maker pill — “A Mysterious Maker” when anon; no debug id | ✅ |
| Click item → Play | ✅ `play.html?id=<uuid>&v=s39` |

## Navigation (wired)

| From | CTA | To |
|---|---|---|
| Play post-fortune | **Play another** | `screens/schoolyard.html` (+ optional `?spotlight=`) |
| Decorate save sheet | **Go to Schoolyard** | `screens/schoolyard.html?spotlight=<id>` |
| Schoolyard item | click / Enter | `screens/play.html?id=<id>&v=s39` |
| Home Play card | | `screens/schoolyard.html` |

## Demo

`http://127.0.0.1:8877/screens/schoolyard.html?v=s8`

## Deferred (not blocking approval)

- Session “played” grey-out (PRD P1)
- Spotlight pan/zoom on `?spotlight=` (URL is set; camera motion not built)
