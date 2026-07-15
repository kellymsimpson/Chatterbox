# CHATTERBOX — Cursor Engineering Handoff Package
**PRD v1.5 · July 2026 · Prepared for Config Makeathon 2026 build**

This is the master file. Read this first, then follow the first-session prompt at the bottom.

---

## 1. What's in this package

| Path | What it is | Status |
|---|---|---|
| `HANDOFF.md` | This file — master checklist and first-session prompt | ✅ Ready |
| `PLAN.md` | Quick-reference build plan, synced to PRD v1.5 | ✅ Ready |
| `docs/Chatterbox-PRD-v1_5.md` | **Full PRD — the authoritative spec. Paste into Cursor in full.** | ✅ Ready |
| `docs/Chatterbox-PRD-v1_5.docx` | Same PRD as Word doc (human reading copy) | ✅ Ready |
| `docs/brand-guidelines.md` | Colours, typography, two-world design system | ✅ Ready |
| `index.html` | Home screen scaffold | ✅ Ready |
| `showcase.html` | Component showcase / visual QA page | ✅ Ready |
| `styles/tokens.css` | Design tokens — source of truth for all CSS values | ✅ Ready |
| `styles/base.css` | Base styles, buttons, typography | ✅ Ready |
| `components/chatterbox.js` | Frame-swap engine + **REVEAL_MAP + FLAP_NUMBER_MAP (authoritative)** | ✅ Ready |
| `components/flap-coords.js` | All flap hit-target coordinates — **final, do not remeasure** | ✅ Ready |
| `components/fortunes.js` | Fortune system — **200 fortunes populated, content final** | ✅ Ready |
| `components/identity.js` | Maker token + display name (localStorage) | ✅ Ready |
| `sandbox/animation-test.html` | Isolated frame-swap animation test page | ✅ Ready |
| `screens/` | Empty — Cursor scaffolds decorate/play/construct/schoolyard here | 🔲 To build |
| `icons/` | Empty — Cursor exports vibe icons here (see §3) | 🔲 To export |
| `assets/` | Empty — Cursor exports textures, stickers, frames here (see §3) | 🔲 To export |

**Documents intentionally NOT included:** the older Component Architecture doc — it predates the
267px-both-modes decision and contradicts PRD §8.10. The PRD is authoritative; do not use any
earlier architecture document.

---

## 2. External accounts (human sets these up — Cursor cannot)

- [ ] GitHub repo created and this package pushed to it
- [ ] Vercel account, connected to the GitHub repo
- [ ] Supabase account with one project created; URL + anon key available as env vars

Cursor creates the `chatterboxes` table (schema in PLAN.md / PRD §15) — the human only
supplies credentials.

---

## 3. Figma asset export checklist (Cursor's FIRST task, before any UI code)

**Figma file key: `dRqS5TWdiu2J4TPhiEyLrb`** (connect via Figma MCP)

| Asset | Figma source | Export to | Notes |
|---|---|---|---|
| Vibe card icons ×5 | Design System, node `772-9087` | `icons/vibe-{mystical,funny,wholesome,dramatic,wildcard}.svg` | **Custom illustrations — never substitute or regenerate** |
| Sticker sheet ×50 | Design System sticker sheet | `assets/stickers/sticker-01.svg` … `sticker-50.svg` | SVG at 1x |
| Desk wood texture | Node `265-4444` | `assets/textures/desk-wood.png` | Export at 1440px width |
| Schoolyard concrete | Node `1074:7286` | `assets/textures/schoolyard-concrete.png` | Full 1920×5999px — must tile vertically without seams |
| Chatterbox animation frames | Play Mode section, node `486-14261` | `assets/frames/v33.svg` … `v42.svg` | See frame list below |

**Frame export list (v1.5 — exact):**
V33, V33.1, V33.2, V34, V35.1, V35.2, V36, V37, V37.1, V37.2, V38.1, V38.2,
V39, V39.1, V39.2, V40.1, V40.2, V41, V42

**Do NOT export or reference:** V37.3, V39.3 — deleted from the Figma file in v1.5
(they were duplicative of V38.1 and V40.1).

**Animation timing:** defined in Figma prototype mode — read it from the file, do not invent values.

---

## 4. The five rules Cursor must never break

1. **Chatterbox is 267px wide in both Decorate and Play modes.** Never resize it.
2. **Flap coordinates are final.** Copy from `components/flap-coords.js` / PRD §15.
   Decorate coords need a `getBoundingClientRect()` offset at runtime; Play coords do not.
3. **REVEAL_MAP in `components/chatterbox.js` is the authoritative reveal logic.**
   Number → rotation → frames. Every vertical-mode selection rotates (±90°); post-reveal
   frame is chosen by number parity (V38.1/V40.1 even, V38.2/V40.2 odd).
4. **Play-mode fill colours in Figma are placeholders.** At runtime, render the maker's
   `flap_colors` + `stickers` from the Supabase record, bound to flap positions via
   FLAP_NUMBER_MAP (top-left → 1,8 · top-right → 2,3 · bottom-right → 4,5 · bottom-left → 6,7).
5. **Custom assets come from Figma, never generated.** Vibe icons, stickers, frames, textures —
   export them; do not substitute Material Symbols or AI-generated art.

---

## 5. Known gaps / open items (check before building the affected feature)

| Item | Blocks | Action |
|---|---|---|
| Fortune array-to-flap mapping unspecified | Stage 6 reveal | Ask the product owner: sequential (fortune[0] → flap 1) or random? |
| V34 vs V41 distinction | H-animation axis | V41 = Play-mode variant of V34. Compare in Figma; if visually identical, export once and alias |
| Maker name position on Play screen | Play screen layout | Confirm against Figma before Play build |
| Game-loop idle behaviour | Game loop | No timeout/prompt specified — confirm before building |
| Construct snip sound P0 or P2 | Construct §7.4 | Sound is globally P2-deferred; confirm if snip is an exception |
| OQ1: pre-built Decorate template | Decorate entry | Which base chatterbox loads when Construct is skipped? |

---

## 6. First-session prompt (paste this into Cursor to start)

> I'm building Chatterbox — a digital paper fortune teller web app (vanilla JS/HTML/CSS,
> no framework). Hosting is Vercel, database is Supabase. The Figma file key is
> `dRqS5TWdiu2J4TPhiEyLrb` — connect via the Figma MCP.
>
> This repo contains the full handoff package. Read `HANDOFF.md` first, then `PLAN.md`,
> then the full PRD at `docs/Chatterbox-PRD-v1_5.md`. The PRD is the authoritative spec.
>
> Step 1: Export every Figma asset listed in HANDOFF.md §3 into the repo's `icons/` and
> `assets/` folders. Do not write any UI code until the exports are done and verified.
> Never generate or substitute custom assets. Do not export V37.3 or V39.3 — they no
> longer exist.
>
> Step 2: Create the Supabase `chatterboxes` table using the schema in PLAN.md, and
> confirm the Vercel deploy pipeline works with a hello-world push.
>
> Step 3: Build in this order: Decorate mode → Play mode → Schoolyard → Home → Construct.
> Follow the five rules in HANDOFF.md §4 at all times. Flap coordinates are final — never
> remeasure. REVEAL_MAP and FLAP_NUMBER_MAP in `components/chatterbox.js` are the
> authoritative game-loop logic.

---

*Prepared from PRD v1.5. Design authority: K.Melly. All Figma design decisions are
intentional — when a design looks "wrong" (e.g. directional Schoolyard shadows offset
bottom-right), it is deliberate. Build what the file shows.*
