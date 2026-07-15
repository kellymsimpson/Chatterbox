# Chatterbox — Brand Guidelines

## Two-world design system

### Paper World
- Realistic, tactile, analogue
- No outlines — soft shadows only
- Paper grain texture: Mono noise ~6% opacity, Multiply blend, `#C9B99A`
- Warm muted palette from Secondary colour group
- Figma texture asset: node `265-4444`

### Sticker World
- Bold flat vector illustration
- Thick die-cut black border (~5% of image width)
- High saturation, graphic clarity
- Feels like a physical sticker sheet

---

## Colour palette

### Grays
| Token | Hex | Usage |
|---|---|---|
| `--color-bright-white` | `#FEFBFB` | All UI text on desk/concrete surfaces |
| `--color-soft-white` | `#E8E7E7` | Secondary button background |
| `--color-light-gray` | `#BCBABA` | Disabled states |
| `--color-medium-gray` | `#878787` | Helper text |
| `--color-dark-gray` | `#5E5E5E` | Subtle UI |
| `--color-soft-black` | `#020101` | Body copy on paper |

### Primary (Teal)
| Token | Hex |
|---|---|
| `--color-seaglass` | `#78A79F` |
| `--color-hover-teal` | `#22BDAA` |
| `--color-bright-teal` | `#2A9D8F` |
| `--color-teal` | `#217D72` |
| `--color-deep-teal` | `#287271` |
| `--color-dark-teal` | `#264653` |

### Secondary (Paper)
| Token | Hex | Usage |
|---|---|---|
| `--color-paper-front` | `#FAF7F0` | Front face of paper |
| `--color-paper-back` | `#EFE9DD` | Back face / folded areas |
| `--color-golden-yellow` | `#E9C46A` | Accent |
| `--color-warm-amber` | `#EFB366` | Accent |
| `--color-peach-amber` | `#F4A261` | Accent |
| `--color-coral-red` | `#E76F51` | Accent |

### Accents
| Token | Hex |
|---|---|
| `--color-magic-pink` | `#EFB366` |
| `--color-verdigris` | `#8AB17D` |
| `--color-danish-blue` | `#8FB7B3` |

### Backgrounds
| Token | Hex | WCAG vs Bright White |
|---|---|---|
| `--color-desk-brown` | `#7D5F36` | 5.73:1 AA ✅ |
| `--color-schoolyard-concrete` | `#464039` | 9.94:1 AAA ✅ |

---

## Magic Paint colours
| Name | Hex | CSS token |
|---|---|---|
| Pink | `#FFB2D2` | `--paint-pink` |
| Red | `#EA6949` | `--paint-red` |
| Orange | `#F6AA41` | `--paint-orange` |
| Yellow | `#E9D26D` | `--paint-yellow` |
| Green | `#7AA86A` | `--paint-green` |
| Blue | `#649FC6` | `--paint-blue` |
| Purple | `#B285CD` | `--paint-purple` |

Applied at **70% opacity** so paper texture shows through.

---

## Typography
| Role | Typeface | Size | Line Height |
|---|---|---|---|
| Heading 1 | Comfortaa Bold | 32pt | 35.7 |
| Heading 2 | Comfortaa | 24pt | 26.8 |
| Heading 3 | Comfortaa Bold | 16pt | 17.8 |
| Body 1 | Outfit Medium | 20pt | 25.2 |
| Body 2 | Outfit Bold | 20pt | 25.2 |
| Helper Text | Outfit Regular | 16pt | 20.2 |
| Fortune Reveal | Patrick Hand | 48pt | 29 |

Load via Google Fonts. Apply CSS fallbacks at build time.

---

## Layout
- **Design baseline**: 1440×900px
- **At 1920px**: layout centred at 1440px, desk background fills sides
- **min-width**: `1440px` — narrower viewports get horizontal scrollbar
- **Tablet / Mobile**: Phase 2, not in current scope
