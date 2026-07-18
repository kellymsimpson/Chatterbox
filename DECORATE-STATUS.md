# Decorate mode — status

Last updated: 2026-07-17 (post-merge of `cursor/decorate-magic-paint` → `main`).

## Build cadence (agreed)

Ship one interaction at a time; wait for confirmation before the next:

1. **Magic Paint** (tray / brush / flap wash) ← current review
2. **Sticker sheet**
3. **Vibe selector overlay**
4. **Save & release flow**

PLAN.md lists the same order for Decorate internals (paint → stickers → vibe → save).

## What's built

| Piece | Location | Notes |
|---|---|---|
| Desk 3-column shell | `screens/decorate.html`, `styles/decorate.css` | Left canvas, centre steps, right sticker stub |
| V33 canvas + closed fills | `components/decorate-canvas.js` | Verified decorate-local placements from `closed-placements.json`; NORMAL @ `--paint-opacity` 0.70 |
| Flap hit-testing | `decorate-canvas.js` + `geometry.pointInQuad` | Uses `decorateQuadsVisual()` (left/right name swap → visual bottom_*) |
| Magic Paint tray | `components/magic-paint.js` | Brush pickup, 7 pods (Figma PNGs), selected/disabled pods, Esc to idle |
| Floating brush cursor | `magic-paint.js` / CSS | Follows pointer at −45° while brush/eraser active |
| Eraser tip (paint only) | `magic-paint.js` | Clears flap paint; CSS stub glyph (not Figma Magic Eraser asset yet) |
| Paint helper copy | `decorate.html` | “Paint N more flaps…”, mode-specific prompts |
| Paint UI assets | `assets/ui/magic-paint/` | Pods + brush fragment PNGs from Figma MCP |
| Upstream locked rendering | fills / frames / stickers / motion | Closed fills + sticker UV locked earlier; open/close is V33↔V34 / V33↔V36 + squash |

## Half-done / known gaps (paint increment)

- **Boot reliability:** module imports used cache-bust query strings after a stale `geometry.js` export miss; needs a clean smoke pass on `/screens/decorate.html`.
- **Brush visuals:** tray/cursor use `brush-handle.png` (large fragment), not a fully composed Figma brush-in-slot asset; ferrule/tip/union PNGs are present but unused.
- **Eraser:** functional for paint clear, but not the Figma Magic Eraser component; no sticker-aware erase yet (stickers not on canvas); no Cmd/Ctrl+Z undo (PRD §8.6).
- **Save / Start Over CTAs:** not in the left column yet (PRD §8.3); helper text only.
- **Tray polish:** hover glow on brush slot, exact Figma recess/union under brush, pod active variants beyond CSS grayscale.

## Not started (next increments)

| Increment | Status |
|---|---|
| Sticker sheet (50 stickers, place/warp on flaps, optional) | Placeholder only |
| Stickers on decorate canvas (UV warp, z above paint) | Not wired |
| Vibe selector button + full-screen overlay + edit badge | Placeholder only |
| Fortune seeding on vibe confirm (`pickFortunes`) | Not wired |
| Save & Finish validation + Supabase insert + confirmation sheet | Not wired |
| Start Over | Not wired |

## Infra context (outside Decorate UI)

- Supabase `chatterboxes` table + RLS: created (empty).
- Vercel: project linked; `main` deploys (confirm after this merge).
- Env: `.env.example` has `VITE_SUPABASE_*` placeholders; frontend not reading them yet.

## Immediate next step

**Review Magic Paint on** `/screens/decorate.html` — brush → colour → paint flaps → eraser. After confirmation, build the sticker sheet increment.
