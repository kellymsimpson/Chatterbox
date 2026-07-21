# Play mode — status

**Status: STAGE 1 IN REVIEW** (2026-07-20) — rendering foundation fixed to Decorate path

Decorate mode is **COMPLETE / LOCKED**. Do not reopen Decorate UI unless explicitly unlocked. See `DECORATE-STATUS.md`.

## Rendering audit (issues 1–2) — authoritative

### Decorate (verified / locked)

| Concern | Path |
|---|---|
| Renderer | `components/decorate-canvas.js` → `DecorateCanvas` |
| Paper | `assets/frames/v33.svg` as `<img>` |
| Closed fills | `assets/fills/closed-{top_left,top_right,bottom_left,bottom_right}.svg` placed via `assets/fills/closed-placements.json` (component set **492:14781** instances; path `fill` + `fill-opacity` from `--paint-opacity` **0.70**) |
| Stickers | `stickerImageUrl()` in `components/sticker-art.js` — strips Figma `#BEBEBE` plate + `#9747FF` guides, then blob URL on UV/matrix3d warp (`STICKER_UV_PX` / `STICKER_SCALE`) |
| Hit testing | `DecorateCanvas.hitFlapFromClient` + `decorateQuadsVisual()` |

### Wrong path (first Play draft — removed)

| Concern | Path |
|---|---|
| Renderer | `Chatterbox` + `PaintStickerLayer` (`components/chatterbox.js` / `paint-layer.js`) |
| Fills | Same SVG files, but **warped onto flap quads via `matrix3d`** — not placement-composed → “made-up” shapes |
| Stickers | Raw `assets/stickers/{id}.svg` `<img src>` — **keeps `#BEBEBE` grey plate** |

### Play now (must stay identical for closed V33)

`components/play-mode.js` mounts **`new DecorateCanvas(stageEl, { flap_colors, stickers })`** and `await canvas.ready()`.

- No `PaintStickerLayer` / no `Chatterbox` on the Stage 1 closed surface
- Stickers normalized `sticker_id` → `id` before handoff to `DecorateCanvas`
- Open/close animation later may use `Chatterbox` sequences; **closed Stage 1 paint/stickers stay on DecorateCanvas**

## Stage 1 checklist

| Item | Status |
|---|---|
| Fetch by `?id=` | ✅ `fetchChatterbox` |
| Decorate-identical closed render | ✅ `DecorateCanvas` |
| Instruction `"Select a flap color to spell."` @ Figma `492:14465` | ✅ |
| PLAY heading (Comfortaa 44) under wordmark | ✅ |
| Flap click → store colour + advance | ✅ `state.stage = 2`, `selectedFlap`, `selectedColor { id, label, hex }` on `window.__play` |
| Esc / no motion | ✅ expected until Stage 2 |
| Empty-state “← Back to Decorate” padding | ✅ same as `.save-sheet-schoolyard` (`8px 32px`, h 48, underline) |

### State after colour pick (ready for Stage 2)

```js
window.__play = {
  stage: 2,                    // past colour pick
  selectedFlap: 'top_left',    // etc.
  selectedColor: { id, label, hex },
  record,                      // full Supabase row
  canvas,                      // DecorateCanvas instance
}
```

No open/close animation yet — Stage 2 consumes this.

## Entry

`screens/play.html?id=<uuid>`  
(from confirmation sheet, or hard-refresh with `?v=s1c` if you still see grey squares — that was the old PaintStickerLayer cache)

## Remaining stages

2. Spell It Out  
3. Number Pick  
4. Count It Out  
5. Second Number Pick  
6. Fortune Reveal (`REVEAL_MAP` + `FLAP_NUMBER_MAP`)
