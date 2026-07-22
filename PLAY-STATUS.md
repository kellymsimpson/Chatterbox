# Play mode — status

**Status: PLAY COMPLETE (Stages 1–6)** (2026-07-22)

Decorate mode is **COMPLETE / LOCKED**. Do not reopen Decorate UI unless explicitly unlocked. See `DECORATE-STATUS.md`.

## Ritual (end-to-end)

**color → spell → number → count → number → reveal**

| Stage | Name | What happens |
|---|---|---|
| 1 | Pick a Colour | Closed V33; pick a flap colour |
| 2 | Spell It Out | Open/close H↔V once per letter of the colour name |
| 3 | Number Pick | Fortune Selector on landed axis; pick N to count to |
| 4 | Count It Out | Alternate H/V counting to N; land open |
| 5 | Second Number Pick | Same UI; pick flap number for fortune |
| 6 | Fortune Reveal | Rotate → lift → land; show fortune on desk |

## Rendering (locked)

| Mode | Renderer |
|---|---|
| Stage 1 closed V33 | `DecorateCanvas` — placement fills + `sticker-art` cleaned stickers |
| Stage 2–5 H/V motion | `Chatterbox` → `StableFrameCompositor` — placement fills; **flap numbers** from `v34-numbers.svg` / `v36-numbers.svg` layered **above** fills (Figma V41.2 stack). Stickers on crop-local quads. |
| Stage 6 reveal V37–V40 | `Chatterbox` → `RevealFrameCompositor` — `reveal-left` / `reveal-right` masks; maker colors via **opposite** pair (`revealFacesForNumber`); stickers `matrix3d` onto reveal face diamond quads. |

## Stage instructions (Body 1 on `.play-instruction`)

| Stage | Copy | Source |
|---|---|---|
| 1 | `Select a flap color to spell.` | existing |
| 2 / 4 | Hidden (desk letter/count on `#play-color-name`) | Stage 1→2 pattern |
| 3 | `Select a number to count to.` | Figma `417:4683` |
| 5 | `Select a flap to reveal it's fortune.` | Figma `514:17597` |
| 6 | Hidden (fortune on `#play-fortune`) | PRD §9.4 |

Same Outfit Medium 20 / weight 500 / Bright White / centered at Stage 1 Y (~504.9).

## Stage 1 — Pick a Colour ✅

Instruction, DecorateCanvas closed, colour pick → state for Stage 2.

## Stage 2 — Spell It Out ✅

| Rule | Implementation |
|---|---|
| One open(/close) per letter | `swapFrame` open → 200ms hold → `swapFrame` V33 (except last stays open) |
| Start H, alternate | Letter index parity: even → H (V34), odd → V (V36) |
| Odd letters → H-open (V34); even → V-open (V36) | Last cycle does not close |
| Letter sync | ALL CAPS Comfortaa Bright White, `letter-spacing: 6px` (`#play-color-name`) |
| Timing | 120ms squash-pop + 200ms hold (`SWAP_SQUASH_MS` / `STABLE_HOLD_MS`) |
| Rotation | **None in Stages 1–5.** H/V axis opens only; flap order never reshuffles. All rotation (180° / ±90°) is Stage 6 only via `REVEAL_MAP`, applied right before flap-lift. |

## Stage 3 — Number Pick ✅

| Rule | Implementation |
|---|---|
| Landed H (V34) | Selectable **1, 2, 5, 6**; 3/4/7/8 disabled on Fortune Selector |
| Landed V (V36) | Selectable **3, 4, 7, 8**; 1/2/5/6 disabled |
| Desk buttons | Fortune Selector instance `431:5963` at (366, 580), gap **12**, flaps **78×78** — Fortune Flaps `423:4889` A/B × default/hover/disabled/selected |
| Flap numbers | Crop-local match Figma instances (`Horizontal` @ ~93,52; `Vertical` @ ~83,109). Composited as `v34/v36-numbers.svg` **above** fills so paint masks don’t occlude glyphs (V41.2 stack). |
| Click | Selected state → **~500ms beat** (`SELECT_BEAT_MS`) → stores `selectedNumber`, fires `play:number-picked`, starts Stage 4. **No confirmation overlay.** |

## Stage 4 — Count It Out ✅

| Rule | Implementation |
|---|---|
| Same parity as Stage 2 | Count index: even → H (V34), odd → V (V36). Odd N → V34; even N → V36 |
| Adapt closed-start | Stage 3 left open → `swapFrame(V33)` first, then mirror spell: open → hold → close (last stays open) |
| Alternate H/V each count | Direct V33↔V34 / V33↔V36 only |
| Count on desk | Accumulates `"1 2 … N"` on `#play-color-name` (Comfortaa Bright White, `letter-spacing: 6px`) |
| Timing | 120ms squash-pop + 200ms hold |
| Rotation | **None** — wrap transform cleared; Stage 6 only |
| After count | Lands **OPEN** (never V33); fires `play:counted`; mounts Stage 5 on landed axis |

## Stage 5 — Second Number Pick ✅

| Rule | Implementation |
|---|---|
| Same UI as Stage 3 | Reuses `mountNumberPick` / Fortune Selector + flap highlights |
| Landed H (V34) | Selectable **1, 2, 5, 6**; others disabled |
| Landed V (V36) | Selectable **3, 4, 7, 8**; others disabled |
| Axis source | Stage 4 `state.landAxis` / `state.landFrame` (odd N → H/V34; even N → V/V36) |
| Same number OK | May re-pick Stage 3’s number |
| Click | Selected state → **~500ms beat** → stores `selectedNumber2`, fires `play:number-picked` (`stage: 5`), then `startReveal()` |
| No confirm | No “are you sure” / dialog on number pick |

## Stage 6 — Fortune Reveal ✅

| Rule | Implementation |
|---|---|
| Entry | After Stage 5 beat → `startReveal()` |
| Rotation | `REVEAL_MAP` on `#play-stage-wrap` (`REVEAL_ROTATE_MS` 320 + hold). Reveal papers/masks **preload during rotation**; wrap transform cleared only after preload, and compositor keeps prior frame until first lift paper is decoded (no blank gap). Stages 1–5 still never rotate. |
| H lift | `V37 → V37.1 → V37.2` then parity post |
| V lift | `V39 → V39.1 → V39.2` then parity post |
| Timing | Same squash-pop + `STABLE_HOLD_MS` via `playSequence` |
| Land | Even → `V38.1` / `V40.1`; odd → `V38.2` / `V40.2` |
| Fills | `RevealFrameCompositor` — opposite-pair `flap_colors` + stickers warped onto reveal face diamond quads (`revealFacesForNumber`) |
| Fortune | After `REVEAL_FORTUNE_BEAT_MS` (500): `#play-fortune` — Patrick Hand 48 / Bright White / centered on desk; text = `fortunes["N"]` for `selectedNumber2` |
| Actions | **Play another** → schoolyard placeholder; **Make one** / **Make another** (via `countChatterboxesForMaker(maker_token)`); **Home** → `index.html` |

## Entry

`http://127.0.0.1:8877/screens/play.html?id=<uuid>&v=s39`

Review path (skip spell): `?review=V34` or `?review=V36` → Stage 3 pick → Stage 4 count → Stage 5 second pick → Stage 6 reveal.
Fastest existing jump to Stage 6 (no extra `?review=reveal` helper — two picks is already short).

### Demo id `408c846b-8fad-46e1-a5fb-d54021cb38b7`

Flap colors: TL `#EA6949` · TR `#FFB2D2` · BL `#F6AA41` · BR `#B285CD`

Reveal shows the **opposite** pair (pre-rotation):

| Path | Paste URL | Picks | Visible fills |
|---|---|---|---|
| H 1/2 → BL+BR | `…&review=V34&v=s39` | **1** → count → **1** or **2** | yellow + purple |
| H 5/6 → TL+TR | same | **1** → count → **5** or **6** | coral + pink |
| V 3/4 → TL+BL | `…&review=V36&v=s39` | **4** → count → **3** or **4** | coral + yellow |
| V 7/8 → TR+BR | same | **4** → count → **7** or **8** | pink + purple |

## Remaining

Play mode Stages 1–6 complete for this handoff. Schoolyard / Home polish still placeholder-routed from post-reveal actions.
