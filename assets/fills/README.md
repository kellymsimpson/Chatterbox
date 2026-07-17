# Flap fill masks (single-color)

14 red (`#EA6949`) silhouette masks from Figma, cleaned to `fill="currentColor"` for runtime recoloring.

## Closed masks (V33 / V35) — component set `492:14781`

Each file is a **separate symbol export** (not rotated/reused).

### Authoritative placement (decorate-local)

Measured from composed instances on **Screens → `573:6020` (V41.1 - Horizontal open.play)**, not from flap-coords quads.

Chatterbox origin in that frame: `(588.758, 141.444)`, bridged via landmark `back left base` (`573:6037` ↔ decorate `874:19605` at local `24.109, 39.023`).

| File | Figma node | Instance (decorate-local) | Export origin | Placed at |
| --- | --- | --- | --- | --- |
| `closed-top-left.svg` | `492:14791` | x=23.941, y=38.479, 109.54×106.22 | (0, 0) | 23.941, 38.479 (110×107 export) |
| `closed-top-right.svg` | `492:14892` | x=132.410, y=38.672, 110.28×106.09 | (0, 0) | 132.410, 38.672 (111×107 export) |
| `closed-bottom-left.svg` | `494:14926` | x=29.210, y=143.938, 104×116 | **(-0.171, +0.748)** | 29.039, 144.686 (104×116 export) |
| `closed-bottom-right.svg` | `496:14949` | x=132.262, y=146.919, 110.28×106.09 | **(-0.054, -2.216)** | 132.208, 144.703 (111×111 export) |

**viewBox note:** Keep the native Figma export viewBox.
- **BR:** path overflows the component upward (~2.22px); export viewBox is 111×111. Shrinking it to component size shifted BR high.
- **BL:** viewBox was never modified (native `0 0 104 116`). Unique among the four: play instance `573:6055` uses blue master `492:14914`, whose path is translated vs red export `494:14926` by `(-0.171, +0.748)`. `exportOrigin = playChildRel − redMasterChildRel` so the red SVG paints on the play content bounds.

Placement = `instanceLocal + exportOrigin`, size = export width/height.

See `closed-placements.json` for the full measured record.

### Compositing (from `573:6020` Fill group `573:6054`)

| | Figma |
| --- | --- |
| **Blend** | `NORMAL` on the solid fill paint (instance/group `PASS_THROUGH`) |
| **Stack** | Bottom → top: `folded paper` → `top` (faces / creases / shading) → **`Fill`** → UI |
| **Opacity** | **0.70 on the solid fill paint**; instance opacity = 1 |

Replicate with paint **above** the paper artwork, `mix-blend-mode: normal`, and **fill-paint alpha 0.70** (not a second layer-opacity multiply). Do not darken the base frame to fake dimension.

## Horizontal masks (V34 / V41) — component set `499:15373`

Measured from **Screens → `573:5921` (V41- Horizontal open.play)**. Paper from **`417:4683`** (V34- Horizontal open.Deco). See `h-placements.json`.

| File | Figma node | Variant | Placed at (crop-local) |
| --- | --- | --- | --- |
| `h-top-left.svg` | `499:15368` | color=red, flap=top left | 8.690, 6.898 — exact V41 instance `573:5953` (path w=132.237; export 133 pad is right-only) |
| `h-top-right.svg` | `499:15401` | color=red, flap=top right | 140.759, 6.897 (134×87 export) — instance box; do not subtract ARB overflow |
| `h-bottom-left.svg` | `499:15412` | color=red, flap=bottom left | 7.045, 93.129 (135×90 export) |
| `h-bottom-right.svg` | `499:15442` | color=red, flap=bottom right | 140.898, 93.044 (135×88 export) |

Same compositing as closed: NORMAL, fills above paper shading, fill-paint opacity 0.70.

## Vertical masks (V36 / V41.2) — component set `496:14975`

Measured from **Screens → `573:6085` (V41.2 - Vertical open.play)**. Paper from **`431:5905`** (V36 - Vertical open.Deco), including **Vertical Flap Numbers** `431:5962` (component `413:1703`) at crop-local ≈ `(82.85, 109.45)`. See `v-placements.json`.

Play Fills group mixes one **INSTANCE** (TL) and three **BOOLEAN_OPERATION** fills (TR/BL/BR) — place from `absoluteRenderBounds` (not `absXY`; 180° flips shift the transform origin).

| File | Figma node | Variant | Placed at (crop-local) |
| --- | --- | --- | --- |
| `v-top-left.svg` | `499:14985` | color=red, flap=top left | 43.406, 32.509 (87×128 export; path w≈86.65) |
| `v-top-right.svg` | `499:15021` | color=red, flap=top right | 130.597, 34.760 (92×128 export; path y-origin ≈1.70) |
| `v-bottom-left.svg` | `499:15045` | color=red, flap=bottom left | 46.082, 158.725 (82×142 export) |
| `v-bottom-right.svg` | `499:15069` | color=red, flap=bottom right | 127.813, 159.113 (94×143 export) |

Same compositing as closed: NORMAL, fills above paper shading, fill-paint opacity 0.70.

## Other masks

| File | State | Flap | Figma node |
| --- | --- | --- | --- |
| `reveal-left.svg` | Reveal face | left | `540:2946` |
| `reveal-right.svg` | Reveal face | right | `540:2970` |

Intermediate frames V33.1 / V33.2 / V35.1 / V35.2 have no Figma fill masks — derive polygons from `play_flap_coords` quads (PRD §8.7 / §15 exception).
