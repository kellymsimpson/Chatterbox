**CHATTERBOX**

Product Requirements Document

v1.5  ·  2026  ·  Portfolio & Product Edition

*Living document — annotations inline throughout*

| 📋 | **HOW TO READ THIS DOCUMENT:  **Annotations appear throughout inline with the spec. 🚨 BLOCKER = cannot ship without resolving. ⚠️ FLAG = needs resolution before dev starts. ❓ OPEN Q = gap in spec needing a decision. 💬 NOTE = context or engineering guidance. ✅ RESOLVED = previously flagged, now closed. |
| --- | --- |

# **1. Overview**

Chatterbox is a digital paper fortune teller (cootie catcher). Users construct, decorate, and play paper fortune tellers — then their creations enter a shared community pool where other users can pick them up and have their fortune told.

Originally scoped for Config Makeathon 2026, Chatterbox is now a portfolio piece with monetisation potential. The spec reflects a product that needs to be shippable, maintainable, and extensible — not a demo.

The experience is organised into four screens and three distinct modes:

- Home — entry point and mode selection

- Construct (mode) — guided fold-by-fold chatterbox assembly

- Decorate (mode) — personalise with paint, stickers, and a vibe

- Play (mode) — the fortune-telling game loop

- Schoolyard — community pool screen, accessed via the Play card

The app is designed desktop-first at 1440×900. Tablet responsiveness is planned in Phase 2.

# **2. Goals ****&**** Non-Goals**

| **GOALS** Fully playable fortune-telling game loop (construct → decorate → play → reveal) Community play — browse and play chatterboxes made by other users Mobile-compatible interaction model (hover-optional for all core flows) Optional display name — attached to chatterbox for sharing; anonymous mode available 50 sticker variants, 7 Magic Paint colours, 4 vibe categories, Wildcard Persistent community pool — chatterboxes survive beyond a single session (backend required) Shareable chatterboxes — each saved chatterbox has a unique public URL Portfolio-quality visual polish across all states and transitions | **NON-GOALS** No user accounts or passwords in v1 — identity is display-name only No cross-session played-chatterbox history per user (v1) No freehand drawing or painting No webcam or finger tracking No real-time multiplayer Mobile-specific build is Phase 2 — desktop must be stable first No monetisation mechanics in v1 — architecture must not preclude them in v2 |
| --- | --- |

| 💬 | **NOTE:  **The shift from Makeathon demo to portfolio/product changes several constraints. Backend is required (not optional). Session-only data is a v1 limitation, not a permanent design decision. The non-goals are scoped to v1 specifically — paid sticker packs, persistent identity, and share features are v2 candidates. |
| --- | --- |

# **3. Users**

The Maker — constructs and decorates a chatterbox, optionally attaches a display name, and releases it into the Schoolyard community pool.

The Player — visits the Schoolyard, browses the infinite scroll visually, picks a chatterbox, and plays it.

The Lurker — arrives via a shareable chatterbox URL. Lands directly on the play screen for that specific chatterbox. May or may not go on to make their own.

*A single user will commonly be both Maker and Player: they construct and decorate, then immediately play their own creation, then optionally browse and play others**'**.*

# **4. Platform ****&**** Constraints**

| **Desktop (Primary)** Design baseline: 1440×900 Minimum supported viewport: 1440px wide At 1920px: layout stays centred at 1440px, extra desk background fills the sides — no layout stretching Primary input: mouse / trackpad Hover states are valid design affordances Apply min-width: 1440px in CSS so viewports narrower than 1440px get a horizontal scrollbar rather than a broken layout | **Tablet / Mobile (Phased)** Tablet landscape (1024px+): two-column layout — Phase 2 Tablet portrait (768px): chatterbox pinned top, tabbed tools below — Phase 2 Mobile (390px): full-screen stepped flow — Phase 2 Mobile is unlikely to support the full Decorate mode experience (paint tray, sticker placement, three columns) without a fundamentally different layout — defer entirely to Phase 2 |
| --- | --- |

*Design all interactions to be hover-optional even on desktop. Hover states enhance the experience but must never be the only way to trigger an action.*

| 💬 | **NOTE:  **Sticker placement on mobile (Phase 2): no hover skew preview available on touch. The sticker snaps directly to the flap on tap. |
| --- | --- |

| ⚠️ | **FLAG:  **The 1440px design baseline means users on 1280px screens will see the layout clip unless a min-width CSS rule is applied. Recommended: set min-width: 1440px at root so narrower viewports get a horizontal scrollbar. Document this as a known v1 limitation. |
| --- | --- |

# **5. Visual Identity**

## **5.1 Three-World System**

| **Paper World** Realistic, tactile, analogue No outlines — soft shadows only Paper grain texture: Mono noise ~6% opacity, Multiply blend, #C9B99A Warm muted palette from the Secondary colour group Numbers 1–8 and illustrated text are flattened into the illustration — they move and distort with the chatterbox and are not functional UI text | **Sticker World** Bold flat vector illustration Die-cut black border — weight defined in Figma source file (authoritative) High saturation, graphic clarity Feels like a physical sticker sheet | **Desk World** Background for all screens #7D5F36 Desk Brown base colour Wood texture image layered on top All UI text appears in Bright White (#FEFBFB) on this surface — never on the paper WCAG contrast: 5.73:1 — AA PASS |
| --- | --- | --- |

## **5.2 Colour Palette**

| **Grays** | #FEFBFB Bright White · #E8E7E7 Soft White · #BCBABA Light Gray · #878787 Medium Gray · #5E5E5E Dark Gray · #020101 Soft Black |
| --- | --- |
| **Primary (Teal)** | #78A79F Seaglass · #22BDAA Hover Teal · #2A9D8F Bright Teal · #217D72 Teal · #287271 Deep Teal · #264653 Dark Teal |
| **Secondary (Paper)** | #FAF7F0 Front of Paper · #EFE9DD Back of Paper · #E9C46A Golden Yellow · #EFB366 Warm Amber · #F4A261 Peach Amber · #E76F51 Coral Red |
| **Accents** | #F0A4C1 Magic Pink · #8AB17D Verdigris · #8FB7B3 Danish Blue |
| **Environment** | #7D5F36 Desk Brown — all screen backgrounds, under wood texture layer |

| **Colour pair** | **Ratio · WCAG AA · WCAG AAA** |
| --- | --- |
| **Bright White #FEFBFB on Desk Brown #7D5F36 (all screen text)** | 5.73:1 · ✅ AA PASS · ❌ AAA FAIL |
| **Soft Black #020101 on Front of Paper #FAF7F0 (illustrated, not UI)** | 19.48:1 · ✅ AA PASS · ✅ AAA PASS |
| **Soft Black #020101 on Back of Paper #EFE9DD (illustrated, not UI)** | 17.24:1 · ✅ AA PASS · ✅ AAA PASS |

| 💬 | **NOTE:  **Bright White on Desk Brown passes WCAG AA (5.73:1 vs the 4.5:1 threshold). If AAA is desired, darken Desk Brown to ~#6A5030 to reach 7.0:1. Paper-surface text is illustrated and not functional UI — no contrast requirement applies to it. |
| --- | --- |

## **5.3 Typography**

| **Role** | **Typeface / Specs** |
| --- | --- |
| **Heading 1** | Comfortaa Bold · 32pt · LH 35.7 |
| **Heading 2** | Comfortaa · 24pt · LH 26.8 |
| **Heading 3** | Comfortaa Bold · 16pt · LH 17.8 |
| **Body 1** | Outfit Medium · 20pt · LH 25.2 |
| **Body 2** | Outfit Bold · 20pt · LH 25.2 |
| **Helper Text** | Outfit Regular · 16pt · LH 20.2 |
| **Fortune / Chatterbox text** | Patrick Hand · 48pt · LH 29 (Figma auto-height — see note) |

*'**Nunito**'** used in earlier documentation has been replaced. Headings use Comfortaa. Fortune reveal text uses Patrick Hand. Patrick Hand is flattened in the Figma illustrations — leading values reflect Figma auto-height and do not need to match CSS line-height.*

| 💬 | **NOTE:  **Comfortaa, Outfit, and Patrick Hand are Google Fonts. At build time, add system font fallbacks to your CSS font stack (e.g. 'Comfortaa', Arial, sans-serif) so the UI degrades gracefully if the CDN is unavailable. This is a one-line CSS task during project setup. |
| --- | --- |

# **6. Home Screen**

## **6.1 Purpose**

The Home screen is the entry point. It orients the user and lets them choose their path via three action cards. The Schoolyard (community pool) is a separate screen reached by clicking the Play card — it is not part of the Home layout. Screen design exists in Figma.

## **6.2 Layout**

- Top: wordmark + tagline — 'Make a fortune teller. Share a fate.'

- Centre: three primary action cards — Construct (mode), Decorate (mode), Play (mode)

- Top-right corner: display name badge (persistent across all screens)

| 💬 | **NOTE:  **Home screen design exists in Figma. This layout description is for engineering reference — defer to Figma as source of truth for spacing, sizing, and visual treatment. |
| --- | --- |

## **6.3 Three Action Cards**

| **Construct** Fold and cut your chatterbox from scratch. | **Decorate** Choose a theme, paint the flaps, and add stickers. | **Play** Choose a chatterbox and find your fortune. Opens the Schoolyard. |
| --- | --- | --- |

| 💬 | **NOTE:  **The Schoolyard is only accessible via the Play card. It does not appear on the Home screen. Clicking Play takes the user directly to the Schoolyard infinite scroll. |
| --- | --- |

## **6.4 Identity — Display Name**

- Optional. Prompt on first visit: 'What should we call you?' with a 'Play anonymously' skip link.

- Display name is stored in localStorage — persists across browser closes on the same device. No account required.

- Appears as a small badge in the top-right corner of all screens. Editable at any time from the badge.

- Shown on the save confirmation sheet when a chatterbox is released.

- Shown on the play screen in Bright White, positioned above, below, or to the right of the chatterbox — not written on the chatterbox flap. Exact position TBD in Schoolyard Figma design.

- In the Schoolyard, the maker's name is revealed on hover over their chatterbox thumbnail.

- Anonymous chatterboxes always show the fixed placeholder 'A Mysterious Maker' in all of the above locations.

| ⚠️ | **FLAG:  **localStorage is device-specific. A user who clears browser storage or switches devices loses their display name. Plan a lightweight persistent token tied to a backend identity for v2. Architecture should not preclude this migration. |
| --- | --- |

## **6.5 The Schoolyard (Community Pool)**

The Schoolyard is a dedicated screen reached only via the Play card on Home. It is the community pool of all decorated chatterboxes ever saved. Screen design is complete — see Figma node 1186:9339 ('Schoolyard. KELLY'S DESIGN' frame, Screens page).

- Background: aged warm concrete — #464039 base colour with a seamless repeating Photoshop texture image layered on top (Design System component: 'Schoolyard background', node 1074:7286, 1920×5999px, scales to 1440px width). The texture repeats vertically without seams as the user scrolls. Background colour passes WCAG AAA for Bright White text (9.94:1 contrast ratio).

- Visual metaphor: an infinite surface with chatterboxes scattered across it like objects on a desk.

- Layout: horizontal position is randomised per chatterbox. Vertical axis is chronological — newest at the top, older ones further down as the user scrolls. Pre-compute x positions on data load and store them — do not randomise on every render or chatterboxes will jump.

- Scroll behaviour: the canvas scrolls vertically without pagination or 'load more'. At any point the user sees a viewport's worth of chatterboxes with more accessible by scrolling down. The background tiles seamlessly through the scroll.

- Thumbnails: live off-screen canvas render of the decorated V33 closed state at ~200×200px, cached in memory per session. Same rendering code as Decorate mode — any future polish automatically improves all thumbnails.

- Shadows: each chatterbox thumbnail has a shadow offset to the bottom-right — approximately translateX(17px) translateY(12px) — at reduced opacity and with blur. This simulates a consistent light source from the top-left (outdoor sun). The offset is the same for every chatterbox regardless of its rotation, so the light source feels coherent across the whole canvas. Do not align shadows directly under the chatterbox — the directional offset is intentional.

- Interaction: the user browses visually and clicks any chatterbox to play it. No vibe filter, no search, no Wildcard button.

- Maker name: revealed on hover over a chatterbox thumbnail as a Bright White pill tooltip.

- Played state: a chatterbox the user has already played this session appears greyed out and is not clickable.

- On save: the user's newly released chatterbox appears instantly at the top. The view pans and zooms to spotlight it before the user continues.

- Shareable URL: every chatterbox has a unique public URL. Clicking a share link opens the play screen for that specific chatterbox directly.

- Performance: virtual scrolling is a v1 requirement — only chatterboxes within or near the viewport are rendered in the DOM at any time. Library choice TBD with engineering.

- Empty state: 'Nothing here yet — be the first to Decorate one!'

| 💬 | **NOTE:  **Canonical Figma reference: node 1186:9339, 'Schoolyard. KELLY'S DESIGN', Screens page. This is the authoritative design. The frame uses two stacked repeat layers — SHADOW REPEAT (directional shadows, offset bottom-right) and CHATTERBOX REPEAT (the actual chatterbox illustrations and fills) — tiled vertically as more chatterboxes are added. Engineering should defer entirely to this frame. Do not reference node 1163:9232. |
| --- | --- |

# **7. Construct Mode**

## **7.1 Purpose**

Construct mode guides the user through folding a virtual chatterbox from a flat sheet of paper. It is skippable. Completing it earns the satisfaction of having 'made' your own chatterbox.

## **7.2 Entry**

- From Home → Construct card, or from Decorate's entry screen ('Build your own').

- A flat A4 paper appears centred on the desk surface.

| 💬 | **NOTE:  **The screen visible after the user clicks Decorate (including the entry state before a chatterbox exists) has been designed in Figma. Engineering should reference the Figma file for this state. |
| --- | --- |

## **7.3 Fold Tutorial**

- Pre-built Figma frames play as a frame-swap animation sequence. Multiple frames exist per step to produce smooth animation between user actions.

- The user clicks Next (or taps on mobile) to advance each step. No auto-play.

- Each step shows a short instruction below the paper in Outfit Regular (Helper Text style).

- Step counter visible: 'Step X of [N]' — total step count TBD pending Figma file handoff to engineering.

- Back arrow available at all steps. Progress is not saved — navigating away restarts from step 1.

| 💬 | **NOTE:  **Figma designs for the fold tutorial are complete. Full Figma file handoff to engineering is required before this feature can be built. Step count and exact frame sequence to be confirmed at handoff. |
| --- | --- |

| ⚠️ | **FLAG:  **Consider adding an exit confirmation ('Are you sure? Your progress will be lost') to prevent accidental navigation away mid-tutorial. |
| --- | --- |

## **7.4 The Cut Interaction**

- A visible guide rail (dashed cut line) appears on the paper.

- Scissors appear at the start of the rail in their closed state.

- The user clicks and drags the scissors along the rail. They animate between open and closed states as they travel (frame-swap).

- The drag is rail-constrained — scissors cannot deviate from the path.

- If the user releases the mouse before reaching the end of the rail, the scissors complete the cut automatically — travelling the remainder of the rail and triggering the snip.

- On completion: a snip sound plays and the cut is complete.

- Mobile (Phase 2): finger drag along the rail, wider hit target.

| 💬 | **NOTE:  **Sound design is P2 Deferred globally — confirm whether the Construct snip sound is an exception and should be P0 for Construct mode specifically. |
| --- | --- |

## **7.5 Completion**

- 'Decorate this one' → enters Decorate mode with this chatterbox pre-loaded.

- 'Play an existing chatterbox' → goes to the Schoolyard. This option is only available if at least one decorated chatterbox exists in the pool. An undecorated chatterbox has no fortunes and cannot be played.

# **8. Decorate Mode**

## **8.1 Purpose**

Decorate mode is where the maker personalises their chatterbox. They choose a fortune vibe, paint the four outer flaps, and place stickers. Saving automatically releases the chatterbox to the Schoolyard community pool.

## **8.2 Entry**

- From Construct completion → 'Decorate this one'

- From Home → Decorate card (a pre-built chatterbox is provided — Construct is skipped)

| ❓ | **OPEN Q:  **OQ1: Pre-built chatterbox template — when the user skips Construct and goes straight to Decorate, which base template is provided? Should there be variants? Does the template affect gameplay (e.g. different flap geometry) or is it purely cosmetic? |
| --- | --- |

## **8.3 Canvas Layout**

Screen design exists in Figma (node 915-8868, frame 'V33.5 - new layout') — defer to Figma as source of truth for all exact measurements, spacing, and visual treatment.

- All screens sit on the Desk World background: #7D5F36 Desk Brown with a wood texture image layer. All UI text appears in Bright White (#FEFBFB) on this surface — never on the paper.

- Left column (301px): chatterbox at 267px wide with 17px left padding. '[Username]'s Chatterbox' label in Bright White Body 1 below the chatterbox. Save & Finish (primary) and Start Over (tertiary underline) buttons below the label.

- Centre column (423px): ① 'Choose a vibe.' step with Vibe Selector button. ② 'Paint the flaps.' step with paint tray. TIP 'Use the eraser to make changes.' below paint tray.

- Right column (352px): ③ 'Add stickers (or not).' step with sticker sheet, vertically scrollable.

| 💬 | **NOTE:  **The chatterbox is 267px wide in both Decorate and Play modes — it was not resized. Flap coordinates have been measured from this size and are documented in §15. Do not resize the chatterbox before building. |
| --- | --- |

## **8.4 Vibe Selection**

- Step ① label: 'Choose a vibe.' This label remains unchanged in both the default and selected states — consistent language signals the step is still interactive.

- The step shows a 'Pick a Vibe.' button (interests Material Symbol icon, secondary button style: Soft White background, Dark Teal border and text).

- Clicking the button opens a full-screen overlay presenting four vibe cards plus Wildcard. The vibe card icons are custom-designed illustrations in the Figma design system — Cursor must use these assets directly from Figma, not substitute Material Symbols or generate alternatives. Export the vibe card icon assets from the Design System (node 772-9087) before building the overlay.

**Overlay interaction**

- Vibe card states: default, hover, selected, disabled. All four states exist in the Figma design system.

- When the user hovers a card it shows its hover state. Clicking a card enters the selected state — all other cards switch to their disabled state.

- A Confirm button appears once a card is selected. The user must confirm — selecting a card alone does not close the overlay.

- On confirm: the overlay closes. The 'Pick a Vibe.' button is replaced by the selected vibe card displayed inline at button scale.

**Selected state in the Decorate panel**

- The vibe card uses its selected variant from the Card component set in the Design System.

- The selected variant includes a pencil edit badge as a boolean property (edit=true), positioned in the top-right corner of the card, overlapping the card edge slightly like a notification badge. The badge is built into the component — not a separate layer in the screen frame. It scales and moves with the card automatically.

- Tapping the card (or its badge) re-opens the vibe selection overlay with the previously selected vibe card pre-highlighted.

- The step number badge remains as a number, not a 'done' checkmark — the step is complete but still editable, so 'done' would be misleading.

**Changing the vibe mid-decoration**

- Changing the vibe re-seeds the 8 fortunes from the new vibe's pool. All paint and sticker work is fully preserved.

- A confirmation prompt appears: 'Changing your vibe will reseed your fortunes. Your decorations will be kept.' with Confirm and Cancel options.

- Fortunes are sealed — the maker never sees them.

| **Vibe** | Description & fortunes |
| --- | --- |
| **✶ Mystical** | Cosmic, fate-forward — draws from the Mystical fortune pool (50 fortunes) |
| **✺ Funny** | Absurdist, playful — draws from the Funny fortune pool (50 fortunes) |
| **❀ Wholesome** | Warm, earnest — draws from the Wholesome fortune pool (50 fortunes) |
| **☾ Dramatic** | Theatrical, flair — draws from the Dramatic fortune pool (50 fortunes) |
| **★ Wildcard** | Draws 8 fortunes randomly across all four pools. Vibe assigned randomly at save time — not shown to maker. |

- Selecting a vibe seeds the chatterbox with 8 fortunes drawn randomly from that vibe's pool of 50, without replacement (no duplicate fortunes within one chatterbox).

| 💬 | **NOTE:  **Figma reference: V33.6 (node 1086:24774) shows the selected vibe state. Card component set in the Design System contains the selected variant with the edit badge boolean property. V33.7 (node 1092:9006) shows the recommended affordance comparison. |
| --- | --- |

## **8.5 Magic Paint**

- Step ② label: 'Paint the flaps.'

- 7 colour pods: Pink #FFB2D2 · Red #EA6949 · Orange #F6AA41 · Yellow #E9D26D · Green #7AA86A · Blue #649FC6 · Purple #B285CD

- Paint is applied as a semi-transparent wash at 70% opacity so the paper texture shows through.

- Clicking the paintbrush picks it up — the cursor becomes the brush at a 45° angle.

- With the brush cursor active, clicking a colour pod selects that colour. The selected pod shows its active state. All other pods immediately switch to their disabled variant (greyed out visually).

- Clicking a greyed-out (disabled) pod switches the active colour directly — no need to deselect the current pod first.

- Clicking the currently active pod again deactivates Magic Paint — all pods return to default state and the cursor returns to default.

- Clicking any outer flap fills the entire flap with a wash of the selected colour at 70% opacity. One click = entire flap. No freehand drawing.

- Clicking a painted flap with a new colour repaints it.

- Flap paint boundaries are crisp — paint is clipped exactly to each flap's edges with no bleed between flaps.

- All four flaps must be painted before the chatterbox can be saved. The Save & Finish button is disabled until all four flaps are painted. A helper prompt shows how many flaps remain (e.g. 'Paint 2 more flaps to save').

- Instruction copy: 'Click the brush to pick it up, then click a colour and paint a flap.' (Desktop — click, not tap.)

## **8.6 Magic Eraser**

- Shown as a TIP below the paint tray, not a numbered step — it is optional.

- Clicking the eraser picks it up — it shrinks and rotates 45° to become a cursor.

- Clicking a painted flap removes only that flap's paint. Clicking a sticker on top of a painted flap removes only the sticker — not the paint beneath it.

- Ctrl/Cmd+Z undoes the last eraser action.

- Pressing Esc or clicking the eraser again puts it back down and returns to the default cursor.

## **8.7 Stickers**

- Step ③ label: 'Add stickers (or not).'

- The sticker sheet shows all 50 sticker variants in a scrollable grid in the right column.

- Hovering a sticker triggers its hover state (boolean variable on the component).

- Clicking a sticker picks it up — it follows the cursor.

- To cancel, click back onto the sticker sheet — the sticker returns to the sheet with no placement recorded.

- Hovering over a flap shows a live skew preview via four-corner projective mapping (transform2d → CSS matrix3d).

- Clicking while over a flap places the sticker, anchored at that (u, v) position.

- Multiple stickers may be placed on the same flap. Maximum 20 stickers per chatterbox across all flaps.

- If the user tries to pick up a sticker after reaching the 20-sticker limit: 'Sorry, you've reached the maximum number of stickers.'

- Placed stickers track and skew through all open/close animation states.

- Magic Eraser removes a sticker on click (see §8.6).

- Undo (Ctrl/Cmd+Z): removes stickers in reverse placement order. Multi-undo is supported.

*Sticker coordinates use hand-measured corner values from Figma as the authoritative source. MCP-extracted bounding-box coordinates are not used. Coordinates must be remeasured after the Decorate layout resize (see §8.3 and §8.9).*

## **8.8 Inside Flap Numbers**

- Numbers 1–8 are pre-printed on the eight inside flaps. The maker does not place or change these.

- Flattened into the chatterbox illustration — they move and distort with the chatterbox.

- Number-to-flap assignment: 1, 2, 5, 6 are on the inner flaps visible on H-open; 3, 4, 7, 8 are on the inner flaps visible on V-open.

- In H-open (V34/V41): 1 top-left, 2 top-right, 5 bottom-left, 6 bottom-right.

- In V-open (V36): 8 top-left, 3 top-right, 7 bottom-left, 4 bottom-right.

- In each open state, the two bottom numbers appear upside-down (5, 6 in H-open; 4, 7 in V-open). This is baked into the flap artwork and has no engineering significance — rotation logic is keyed to the selected number, not to number orientation. See §9.4 Stage 6.

**Outer flap ↔ inner number association**

Each of the four outer (paintable) flaps is associated with two inner numbers. This association is fixed by the fold geometry and never changes, regardless of the user's paint colours or stickers:

| **Outer flap** | **Inner numbers** |
| --- | --- |
| **Top left** | 1 and 8 |
| **Top right** | 2 and 3 |
| **Bottom right** | 4 and 5 |
| **Bottom left** | 6 and 7 |

This association drives which outer-flap decorations are visible during the fortune reveal — see §9.4 Stage 6.

## **8.9 Saving ****&**** Releasing**

- Steps 1 (vibe) and 2 (paint all four flaps) must be completed before the chatterbox can be saved. Step 3 (stickers) is optional.

- The user does not need to follow the steps in order — they can paint before choosing a vibe, or add stickers at any point.

- If the user clicks Save & Finish before completing steps 1 and/or 2, an inline validation message appears directly below the Save button in Helper Text style (warning colour). No overlay is needed — this is inline form validation:

-    Missing vibe only: 'Choose a vibe before saving.'

-    Missing paint only: 'Paint all four flaps before saving.'

-    Missing both: 'Choose a vibe and paint all four flaps before saving.'

- The Save & Finish button itself does not need a disabled state — it is always clickable, but triggers validation if steps are incomplete. This gives the user immediate specific feedback rather than a silently greyed-out button.

- When both steps 1 and 2 are complete, clicking Save & Finish saves the chatterbox, automatically releases it to the Schoolyard, and slides up a confirmation sheet showing: the chatterbox thumbnail, the vibe tag, and the maker's display name (or 'A Mysterious Maker').

- The confirmation sheet has two actions: 'Play this chatterbox' (enters Play mode with their just-saved chatterbox pre-loaded) and 'Go to Schoolyard' (navigates to the Schoolyard with the new chatterbox spotlighted).

- Dismissing the confirmation sheet (click outside / Escape) closes it and returns to Decorate mode. The chatterbox has already been saved — dismissal does not undo the save.

| 💬 | **NOTE:  **No new overlay or modal component needed for save validation — it is inline helper text below the Save button. The Helper Text style (Outfit Regular 16pt) already exists in the design system. Use a warning colour token for the message text. |
| --- | --- |

| 💬 | **NOTE:  **Thumbnail is a live off-screen canvas render of the decorated V33 closed state at ~200×200px, cached in memory per session. No separate image capture or file storage required in v1. |
| --- | --- |

## **8.10 Chatterbox Component Architecture**

The chatterbox illustration is a single shared base component in Figma with fill variables for the four painted flap colours. It is used in both Decorate mode and Play mode — but at different sizes to suit each screen's layout.

**Component structure**

| **Base component** | The chatterbox illustration including all animation frames (V33–V42). Contains fill variables for the four outer flap colours. Never resized directly — always used via a mode-specific wrapper instance. |
| --- | --- |
| **Chatterbox/Decorate** | Instance of the base component at 267px width in the Decorate mode left column (node 915-8868). Flap coordinates for Decorate mode are measured from this instance — see §15. |
| **Chatterbox/Play** | Instance of the base component at the same 267px width in the Play mode screen. The chatterbox is the same size in both modes. Flap coordinates for Play mode are measured separately — see §15. |

**Fill variables (shared)**

The four flap paint colours are stored as fill variables on the base component. These are set at decoration time and read at play time — the same variable values flow automatically from Decorate mode into Play mode. Do not duplicate or fork the fill variable system between modes.

| **flap-top** | Fill colour for the top outer flap |
| --- | --- |
| **flap-right** | Fill colour for the right outer flap |
| **flap-bottom** | Fill colour for the bottom outer flap |
| **flap-left** | Fill colour for the left outer flap |

**Flap coordinates — confirmed, do not remeasure**

- Flap coordinates have been measured at 267px width and are documented in full in §15.

- Decorate mode coordinates and Play mode coordinates are stored separately in code even though the chatterbox is the same size — if the Play screen layout ever changes, the coordinate sets remain decoupled.

- Do not resize the chatterbox before or after measuring. The coordinates in §15 are final.

| 💬 | **NOTE:  **Figma reference: Chatterbox base component in Design System. Decorate instance in node 915-8868. Play instances in Play Mode section frames. |
| --- | --- |

**Responsive sizing**

- 1440px desktop: Decorate instance fills the left column (~365px usable width). Play instance: TBD.

- 1024–1279px tablet landscape: Decorate instance scales down proportionally for narrower left column in two-column layout.

- 768–1023px tablet portrait: chatterbox pinned to top half of screen, scales to ~60% of viewport width.

# **9. Play Mode**

## **9.1 Purpose**

Play mode is the fortune-telling ritual. The player interacts with a chatterbox — picking colours, counting, and eventually revealing a hidden fortune.

## **9.2 Entry**

- From Decorate save confirmation → 'Play this chatterbox' — enters Play mode with their just-saved chatterbox pre-loaded directly.

- From Home → Play card → Schoolyard → user selects a chatterbox visually → Play mode.

- From a shareable URL → lands directly on the Play screen for that specific chatterbox.

## **9.3 Schoolyard Browse (Pool Entry)**

- There is no vibe selection screen. The user browses the Schoolyard infinite scroll and clicks any chatterbox to play it.

- No filtering, no Wildcard button, no vibe categories in the selection flow.

- A chatterbox the user has already played this session is greyed out and not clickable.

- Played-chatterbox tracking is in-memory per session (cleared on tab close/refresh). Per-user persistent history is a v2 improvement.

## **9.4 The Game Loop — Six Stages**

The loop always starts with a horizontal move. The chatterbox can land on either H-open or V-open at the end of spelling and counting — both reveal paths are required. OQ3 (H-open guarantee) has been resolved by removing the constraint.

*Key: even number of moves from H-open → ends V-open. Odd number of moves from H-open → ends H-open. Even from V-open → ends H-open. Odd from V-open → ends V-open.*

**Stage 1 — Pick a Colour**

- The chatterbox sits closed (V33), showing 4 painted outer flaps. All four flaps are guaranteed to be painted (save gate enforces this — see §8.5).

- The player clicks one of the four coloured flaps to select a colour.

- The selected colour name appears on the desk background in Bright White, Comfortaa — not on the paper.

**Stage 2 — Spell It Out**

- The chatterbox opens and closes once per letter of the colour name, starting on horizontal.

- Even number of letters → ends on V-open. Odd number of letters → ends on H-open.

- Sequence per cycle: V33→V33.1→V33.2→V34→V33.2→V33.1→V33 (horizontal), V33→V35.1→V35.2→V36→V35.2→V35.1→V33 (vertical).

- Each letter of the colour name animates on screen in Bright White in sync with each open/close.

- Rotation rules: 90° rotation applied to the chatterbox container (not the screen) when in vertical mode. 180° rotation applied when the bottom-left or bottom-right flap was selected in Stage 1.

| 💬 | **NOTE:  **Animation timing (fps / ms per frame) is defined in Figma prototype mode. Devs must reference the Figma file — do not invent timing values. |
| --- | --- |

| ⚠️ | **FLAG:  **Rotation rules reference 'bottom-left or bottom-right flap.' Provide a labelled diagram or coordinate reference for the four flap positions in the engineering handoff. |
| --- | --- |

**Stage 3 — Number Pick**

- If Stage 2 ends on H-open (V34/V41): player sees numbers 1, 2, 5, 6 and clicks one.

- If Stage 2 ends on V-open (V36): player sees numbers 3, 4, 7, 8 and clicks one.

**Stage 4 — Count It Out**

- The chatterbox opens and closes the selected number of times, applying the same alternating axis logic as Stage 2.

- The count is displayed on the desk background in Bright White as it increments.

**Stage 5 — Second Number Pick**

- The player clicks one of the four visible numbers in whichever open state the chatterbox has landed on.

- H-open shows 1, 2, 5, 6. V-open shows 3, 4, 7, 8.

- The player can pick the same number as Stage 3; this is acceptable.

**Stage 6 — Fortune Reveal**

OQ4 resolved (updated in v1.5 — frame set trimmed, even/odd frame naming adopted).

**Rotation rules**

- H-open (Horizontal Mode): selecting 1 or 2 (top flaps) → no rotation. Selecting 5 or 6 (bottom flaps) → the entire chatterbox rotates 180°.

- V-open (Vertical Mode): every selection rotates the chatterbox — there is no no-rotation path in vertical mode. Selecting 8 or 7 (left-side flaps) → rotate 90° right. Selecting 3 or 4 (right-side flaps) → rotate 90° left.

- Rotation is applied to the chatterbox container and all its elements (fills, stickers, numbers) — not to the screen.

**Reveal frame selection — even/odd**

The reveal-open and post-reveal frames are shared by number parity, matching the Figma frame names. V38.1 and V40.1 show an even number selected (2, 6 horizontal; 4, 8 vertical); V38.2 and V40.2 show an odd number selected (1, 5 horizontal; 3, 7 vertical). V38.x and V40.x are essentially the same end state reached by two different paths (horizontal vs vertical).

**Number → rotation → frame mapping (authoritative)**

| **Selected** | **Mode** | **Rotation** | **Reveal sequence** |
| --- | --- | --- | --- |
| **1** | H | none | V37→V37.1→V37.2 → V38.2 (odd) |
| **2** | H | none | V37→V37.1→V37.2 → V38.1 (even) |
| **5** | H | 180° | V37→V37.1→V37.2 → V38.2 (odd) |
| **6** | H | 180° | V37→V37.1→V37.2 → V38.1 (even) |
| **8** | V | 90° right | V39→V39.1→V39.2 → V40.1 (even) |
| **7** | V | 90° right | V39→V39.1→V39.2 → V40.2 (odd) |
| **3** | V | 90° left | V39→V39.1→V39.2 → V40.2 (odd) |
| **4** | V | 90° left | V39→V39.1→V39.2 → V40.1 (even) |

| 💬 | **NOTE:  **Why rotation exists: the number-selection states (V34/V41, V36) are illustrated from a top-down perspective, while the reveal states (V37–V40) are illustrated from a frontal perspective. The chatterbox must rotate so the selected flap faces the viewer before the reveal animation can play. |
| --- | --- |

| 💬 | **NOTE:  **v1.5 change: frames V37.3 and V39.3 have been deleted from the Figma file — they were duplicative of V38.1 and V40.1 respectively. The H-Reveal and V-Reveal lift sequences are each 3 frames (start → mid → open), followed by the parity-matched post-reveal frame. Do not reference V37.3 or V39.3 anywhere in code or asset exports. |
| --- | --- |

**Decorated fills during reveal**

- The coloured flap fills shown in the Play mode Figma frames are placeholder examples only. At runtime, the flaps must render the fills and stickers the maker assigned in Decorate mode (flap_colors and stickers from the chatterbox record).

- During the reveal, two front fill flaps remain visible. Which two outer-flap decorations they show is determined by the selected number via the outer flap ↔ inner number association in §8.8 (top left → 1, 8 · top right → 2, 3 · bottom right → 4, 5 · bottom left → 6, 7). The association is fixed; only the maker's colours and stickers vary.

- Engineering: bind the runtime fill variables to the flap positions in the reveal frames using this association, and verify the visible-flap positions per frame against the Figma reveal frames (V38.1, V38.2, V40.1, V40.2) during the build.

| **Frame** | **Usage** |
| --- | --- |
| **V37** | H-Reveal start — inner flap begins to lift |
| **V37.1** | H-Reveal mid |
| **V37.2** | H-Reveal open — flap fully lifted |
| **V38.1** | H-Fortune Reveal — even number flaps (2, 6) — includes post-reveal overlay |
| **V38.2** | H-Fortune Reveal — odd number flaps (1, 5) — includes post-reveal overlay |
| **V39** | V-Reveal start — inner flap begins to lift |
| **V39.1** | V-Reveal mid |
| **V39.2** | V-Reveal open — flap fully lifted |
| **V40.1** | V-Fortune Reveal — even number flaps (4, 8) — includes post-reveal overlay |
| **V40.2** | V-Fortune Reveal — odd number flaps (3, 7) — includes post-reveal overlay |

- After a 500ms beat of silence, the fortune text fades in at the bottom of the screen on the Desk Brown background in Bright White, Patrick Hand 48pt centred. It does not appear on the paper surface.

- The chatterbox remains visible above the fortune text.

- Two action buttons appear: 'Play again' and 'Make one'.

## **9.5 Post-Fortune Actions**

- 'Play another' — returns to the Schoolyard to browse and select another chatterbox. Always shown.

- 'Make one' or 'Make another' — navigates to Home with Decorate pre-selected. Label is conditional: if the user has not yet saved a chatterbox this session, label reads 'Make one'; if they have already saved at least one, label reads 'Make another'. Engineering checks whether maker_token has any saved chatterboxes in Supabase to determine which label to render.

- 'Home' — navigates to the Home screen. Shown as the lowest-weight tertiary action.

| 💬 | **NOTE:  **These are the canonical button labels used in the post-reveal overlay Figma frames (V38.1, V38.2, V40.1, V40.2) and in this section. All references across code, Figma frames, and copy must use exactly these strings. 'Make one / Make another' appears as a slash annotation in Figma to signal the conditional — engineering renders one or the other at runtime, never both. |
| --- | --- |

# **10. Animation States**

All chatterbox animation uses frame-swap (not interpolation). Pre-built Figma frames are displayed in sequence to produce correct fold geometry. Animation timing is defined in Figma prototype mode — reference the Figma file; do not invent timing values.

| **Frame** | **Name ****&**** Usage** |
| --- | --- |
| **V33** | Closed — resting state. Decorate mode start. Play mode start. |
| **V33.1** | H-Start — first frame of horizontal open/close |
| **V33.2** | H-Half — mid-point of horizontal open/close |
| **V34 / V41** | H-Open — fully horizontal open. Shows numbers 1, 2, 5, 6. V41 is the Play-mode variant of V34. |
| **V35.1** | V-Start — first frame of vertical open/close |
| **V35.2** | V-Half — mid-point of vertical open/close |
| **V36** | V-Open — fully vertical open. Shows numbers 3, 4, 7, 8. |
| **V37–V37.2** | H-Reveal — horizontal fortune reveal lift animation (3 frames). REQUIRED. |
| **V38.1–V38.2** | H-Fortune Reveal — even (2, 6) / odd (1, 5) number flaps, with post-fortune overlay. REQUIRED. |
| **V39–V39.2** | V-Reveal — vertical fortune reveal lift animation (3 frames). REQUIRED (OQ3 resolved). |
| **V40.1–V40.2** | V-Fortune Reveal — even (4, 8) / odd (3, 7) number flaps, with post-fortune overlay. REQUIRED (OQ3 resolved). |
| **V42** | Post Reveal Screen — final resting state after fortune and overlay shown. |

| ⚠️ | **FLAG:  **V34 and V41 are both H-Open states, but V41 is labelled 'Play-mode variant.' The difference between them is not documented. Clarify before building the horizontal animation axis — if they are identical, only one is needed. |
| --- | --- |

| 💬 | **NOTE:  **v1.5: V37.3 and V39.3 no longer exist in the Figma file (deleted as duplicative of V38.1 and V40.1). Reveal lift sequences are 3 frames each. |
| --- | --- |

| ❓ | **OPEN Q:  **Idle behaviour: what happens if the user doesn't click at any click-waiting stage (colour pick, number pick)? Is there a timeout? A prompt? Define idle behaviour before building the game loop. |
| --- | --- |

# **11. Fortune System**

- Total fortune pool: 200 fortunes — 50 per vibe (Mystical, Funny, Wholesome, Dramatic).

- On vibe selection in Decorate mode: 8 fortunes drawn randomly from the chosen vibe's pool via pickFortunes(vibe) in chatterbox-fortunes.js. Sampling is without replacement — no duplicate fortunes within one chatterbox.

- The same fortune can appear in different chatterboxes — the pool is not depleted globally across chatterboxes.

- Wildcard draws 8 fortunes randomly across all four pools (without replacement within that draw).

- Fortunes are assigned to the 8 inner numbered flaps (1–8) at decoration time and stored with the chatterbox.

- The maker never sees the fortunes.

- Fortune reveal text is displayed in Patrick Hand, 48pt, centred, at the bottom of the screen on the Desk Brown background in Bright White.

*The Fortunes PDF and some earlier assets still use **'**Chaotic**'** as the category label. chatterbox-fortunes.js will be written fresh with **'**Funny**'** as the category name — no rename needed.*

| 💬 | **NOTE:  **'Chaotic → Funny' rename: RESOLVED. Building chatterbox-fortunes.js from scratch with 'Funny' as the category name. No find-and-replace required. |
| --- | --- |

| ⚠️ | **FLAG:  **Fortune array-to-flap mapping is not specified. Is it sequential (fortune[0] → flap 1, fortune[1] → flap 2, etc.) or random? Confirm the mapping before building the fortune reveal logic. |
| --- | --- |

| ❓ | **OPEN Q:  **Who wrote the 200 fortunes? Are they final and ready to add to chatterbox-fortunes.js, or will placeholders be used during development? |
| --- | --- |

# **12. Feature Status**

| **Feature** | **Priority** | **Status** | **Notes** |
| --- | --- | --- | --- |
| Frame-swap open/close animation (vertical) | P0 | ✅ Done | V33→V35.1→V35.2→V36 working |
| Sticker pick & follow cursor | P0 | ✅ Done | 50 sticker variants confirmed |
| Sticker skew preview on flap hover | P0 | ✅ Done | transform2d / matrix3d; mobile: snap on tap (Phase 2) |
| Sticker placement on flap | P0 | ✅ Resolved | Coordinates measured and in §15 at 267px width — no further remeasure needed |
| Sticker cancel (click back to sheet) | P0 | 🔲 To Build | Clicking sticker sheet while holding sticker cancels placement |
| Sticker cap (20 max with message) | P0 | 🔲 To Build | 'Sorry, you've reached the maximum number of stickers' |
| Magic Eraser (targeted) | P0 | ✅ Done | Clicks remove sticker OR paint on clicked element only; Ctrl+Z undoes |
| Construct — fold tutorial | P0 | 🔲 To Build | Figma designs complete; multiple frames per step; step count TBD at handoff |
| Construct — scissors cut | P1 | 🔲 To Build | Rail-guided drag; auto-completes on mid-rail release |
| Decorate — vibe selector button & overlay | P0 | 🔲 To Build | interests icon; secondary button; full-screen overlay; vibe card icons from Figma Design System (node 772-9087) — do not substitute |
| Decorate — vibe selected state (edit badge) | P0 | 🔲 To Build | Card component selected variant with edit badge boolean (edit=true); pencil badge top-right corner; tapping card or badge re-opens overlay |
| Decorate — Magic Paint (7 colours) | P0 | 🔲 To Build | Brush pickup; pod disabled states; one-click flap fill at 70% opacity; crisp boundaries |
| Decorate — save validation (inline) | P0 | 🔲 To Build | Inline helper text below Save button; dynamic message for missing step(s) |
| Decorate — save & auto-release flow | P0 | 🔲 To Build | Auto-releases to Schoolyard; 'Play this chatterbox' / 'Go to Schoolyard'; dismiss returns to Decorate |
| Flap coordinates | P0 | ✅ Resolved | Measured at 267px in both Decorate and Play modes — full tables in §15 |
| Play — H-open animation axis | P0 | 🔲 To Build | V33.1/V33.2/V34/V41 frames |
| Play — V-open animation axis | P0 | 🔲 To Build | V35.1/V35.2/V36 frames — now required for dual-mode loop |
| Play — full game loop (dual H+V) | P0 | 🔲 To Build | 6-stage ritual; lands on H-open or V-open; both reveal paths required |
| Play — H-fortune reveal (V37–V38) | P0 | 🔲 To Build | 3-frame lift; rotation per §9.4 mapping table (180° for 5, 6); parity frame V38.1/V38.2; Patrick Hand fade |
| Play — V-fortune reveal (V39–V40) | P0 | 🔲 To Build | 3-frame lift; every V-mode selection rotates ±90° per §9.4 mapping table; parity frame V40.1/V40.2 |
| Play — post-fortune actions | P0 | 🔲 To Build | 'Play another' (always); 'Make one' / 'Make another' (conditional on whether user has saved a chatterbox); 'Home' (tertiary) |
| Home screen | P1 | 🔲 To Build | 3 action cards + name entry prompt; design in Figma |
| Schoolyard — infinite canvas | P1 | 🔲 To Build | Figma design complete (node 1186:9339 — Kelly's design); concrete bg; directional shadows (top-left light source, offset bottom-right); chrono vertical / random horizontal scatter; virtual scrolling; hover tooltip for maker name; spotlight on save; greyed played state |
| Shareable chatterbox URL | P1 | 🔲 To Build | Unique public URL per chatterbox; links open Play screen for that chatterbox |
| Display name / identity | P1 | 🔲 To Build | localStorage-persistent; shown on save confirmation, play screen, Schoolyard hover; 'A Mysterious Maker' placeholder |
| Session played-chatterbox tracking | P1 | 🔲 To Build | In-memory set per session |
| Thumbnail — live canvas render | P1 | 🔲 To Build | Off-screen canvas render at ~200×200px; cached per session; reused in Schoolyard and save confirmation |
| Backend / persistence (Vercel + Supabase) | P0 | ✅ Resolved | Vercel hosting; Supabase database; localStorage identity token; /play/[id] URL structure — see §13 OQ2 |
| Tablet responsive layout | P2 | ⏸ Deferred | 1024–1279px two-column; 768–1023px pinned-top tabbed; design required |
| Mobile layout | P2 | ⏸ Deferred | Phase 2 — 390px stepped full-screen flow |
| Sound design | P2 | ⏸ Deferred | Clarify whether Construct snip sound is P0 exception |
| Desk Brown + wood texture background | P2 | ⏸ Deferred | Cosmetic — add last |

# **13. Open Questions**

| **OQ** | **Question / Status** |
| --- | --- |
| **OQ1** | Pre-built chatterbox template: when the user skips Construct and goes straight to Decorate, which base template is provided? Should there be variants? Does the template affect gameplay or is it purely cosmetic? |
| **OQ2 — ✅ RESOLVED** | Hosting: Vercel. Database: Supabase. Identity: random localStorage token ('usr_' + random string) generated on first visit, attached to all chatterboxes saved by that browser. Data model: one chatterbox table — id (auto), maker_name, maker_token, vibe, flap_colors (JSON), stickers (JSON array), fortunes (JSON object keyed 1–8), created_at (auto). Shareable URL: /play/[chatterbox-id] using the Supabase auto-generated id. |
| **OQ3 — ✅ RESOLVED** | H-open guarantee removed. The loop lands on H-open for odd letter/number counts and V-open for even counts. Both reveal paths (V37/V38 and V39/V40) are now required. See §9.4. |
| **OQ4 — ✅ RESOLVED** | Full reveal mapping specified in §9.4 Stage 6 (updated v1.5). H-open: 1, 2 no rotation; 5, 6 rotate 180°. V-open: every selection rotates — 8, 7 rotate 90° right; 3, 4 rotate 90° left. Post-reveal frame chosen by number parity: V38.1/V40.1 even, V38.2/V40.2 odd. V37.3 and V39.3 deleted. |
| **OQ5** | Monetisation architecture: if sticker packs, premium vibes, or other paid features are planned for v2, the data model and identity layer must accommodate entitlements from day one. Decide the v2 monetisation surface before finalising the v1 data model. |

# **14. Glossary**

| **Term** | **Definition** |
| --- | --- |
| **Chatterbox** | A paper fortune teller (cootie catcher). The core artifact of the app. |
| **Flap** | One of the four outer triangular sections of the closed chatterbox. |
| **Inner flap** | One of the eight numbered sections visible when the chatterbox is open. |
| **H-open** | Horizontal-open state (V34/V41). Shows inner flap numbers 1, 2, 5, 6. |
| **V-open** | Vertical-open state (V36). Shows inner flap numbers 3, 4, 7, 8. |
| **Vibe** | The fortune category: Mystical, Funny, Wholesome, or Dramatic. |
| **Wildcard** | A selection mode that draws from all vibe pools at random. Not a fifth category. Vibe assigned randomly at save time. |
| **Schoolyard** | The community pool screen — an infinite canvas of all saved chatterboxes, accessed via the Play card. |
| **Magic Paint** | The one-click, 7-colour flap-fill tool in Decorate mode. Activated by clicking the brush; colour selected with the brush cursor active. Applied at 70% opacity, crisp flap boundaries. |
| **Magic Eraser** | Targeted eraser tool. Clicks remove only the element clicked (sticker or paint on a single flap). Shrinks and rotates 45° when picked up. Ctrl+Z undoes last action. |
| **Vibe Selector** | The trigger button in Decorate mode (interests Material Symbol icon, secondary style) that opens the vibe selection full-screen overlay. |
| **transform2d** | The four-corner projective mapping function that warps stickers to match flap geometry. |
| **u, v** | Normalised 0–1 coordinates used to anchor a sticker's position within a flap's local space. |
| **Frame-swap** | Animation technique: pre-built Figma frames displayed in sequence, not interpolated. Timing defined in Figma prototype mode. |
| **V33–V42** | Figma frame labels for all chatterbox animation and reveal states. See §10. |
| **Patrick Hand** | The typeface used for fortune reveal text. 48pt, centred, on Desk Brown in Bright White. |
| **Comfortaa** | The typeface used for all UI headings (H1–H3). |
| **H-open guarantee** | REMOVED (OQ3 resolved). The game loop now lands on H-open or V-open depending on letter/number count. Both reveal paths are required. |
| **Thumbnail** | A live off-screen canvas render of a decorated chatterbox at ~200×200px. Cached per session. Used in the Schoolyard and save confirmation sheet. |
| **Session** | A single browser tab lifetime, for v1 played-chatterbox tracking. Community pool data persists via backend beyond any single session. |
| **Desk World** | The background environment for all screens: #7D5F36 Desk Brown with a wood texture image layer. All UI text appears here in Bright White — never on the paper. |
| **Play again** | Post-fortune button: returns to the Schoolyard to select another chatterbox. Canonical label — use exactly this string in code and Figma. |
| **Make one** | Post-fortune button: navigates to Home with Decorate pre-selected. Canonical label — use exactly this string in code and Figma. |

# **15. Cursor Engineering Handoff Notes**

This section captures decisions and context specifically useful for building in Cursor.

**Stack**

- Hosting: Vercel — connect your GitHub repo and Vercel auto-deploys on every push.

- Database: Supabase — free tier, Postgres under the hood, dashboard looks like a spreadsheet. Create one table: chatterboxes.

- Tell Cursor: 'I'm building Chatterbox — a digital paper fortune teller web app. I'm using Vercel for hosting and Supabase as my database. The Figma file key is dRqS5TWdiu2J4TPhiEyLrb. Here is the full PRD.' Then paste this document.

**Before you write a single line of code**

- The flap coordinates are already measured and documented in the Flap coordinates section below — copy them directly into code as decorate_flap_coords and play_flap_coords. Do not remeasure.

- Confirm V39/V40 vertical reveal frames are complete in Figma (Play Mode section) before asking Cursor to build the vertical reveal logic.

- Create the Supabase chatterboxes table using the schema in Key data structures below before building any save or Schoolyard features.

**Key data structures**

- Chatterbox table (Supabase): id (auto UUID), maker_name (text), maker_token (text), vibe (text), flap_colors (jsonb: {top, right, bottom, left}), stickers (jsonb array: [{sticker_id, flap, u, v}]), fortunes (jsonb: {"1":"...", "2":"...", ..., "8":"..."}), created_at (auto timestamp).

- Identity token: on first visit, generate 'usr_' + crypto.randomUUID() and store in localStorage. Attach to all chatterboxes saved from that browser.

- Session state: played_chatterbox_ids (Set, in-memory), current_display_name (localStorage), current_user_token (localStorage).

- Flap coordinates: decorate_flap_coords and play_flap_coords — two separate objects, never shared. See full coordinate tables and implementation notes below.

**Flap coordinates — full data ****&**** implementation**

Coordinates are measured as four corner points (C0–C3) per flap in the LOCAL coordinate space of the chatterbox instance — i.e. with the chatterbox top-left corner as (0, 0). They are NOT in screen/viewport space.

CRITICAL for Cursor: when using these coordinates for hit detection or sticker placement in the browser, you must add the chatterbox instance's current position on screen to each coordinate. The chatterbox in Decorate mode sits at approximately x: 97, y: 168 within the 1440x900 frame. So a flap corner at local (24.26, 39.03) becomes screen position (24.26 + chatX, 39.03 + chatY) where chatX and chatY are the chatterbox element's getBoundingClientRect().left and .top values at runtime.

Tell Cursor: 'The flap coordinates below are in the local coordinate space of the chatterbox element. To convert to screen coordinates for hit detection, add the chatterbox element's getBoundingClientRect().left to each X value and getBoundingClientRect().top to each Y value at runtime.'

**Decorate mode flap coordinates (V33.5 — Chatterbox/Decorate instance, 267×294px)**

| **Flap** | **C0 (x,y)** |
| --- | --- |
| **Top left (V33.5/6)** | **24.26, 39.03** |
| **Top right (V33.5/7)** | **133.96, 50.29** |
| **Left (V33.5/8)** | **132.78, 144.54** |
| **Right (V33.5/9)** | **35.05, 144.30** |

**Play mode flap coordinates — V35 Close (closed state)**

| **Flap** | **C0 (x,y)** |
| --- | --- |
| **Top left** | **612.41, 180.75** |
| **Top right** | **722.11, 191.72** |
| **Left** | **623.20, 285.74** |
| **Right** | **720.94, 285.98** |

**Play mode flap coordinates — V35.1 Animated vertical start open/close**

| **Flap** | **C0 (x,y)** |
| --- | --- |
| **Top left** | **594.09, 189.80** |
| **Top right** | **721.70, 176.55** |
| **Left** | **624.25, 284.91** |
| **Right** | **720.65, 300.28** |

**Play mode flap coordinates — V35.2 Animated vertical half open/close**

| **Flap** | **C0 (x,y)** |
| --- | --- |
| **Top left** | **636.73, 243.68** |
| **Top right** | **721.70, 227.87** |
| **Left** | **650.12, 322.62** |
| **Right** | **719.62, 411.68** |

**Play mode flap coordinates — V36 Vertical open**

| **Flap** | **C0 (x,y)** |
| --- | --- |
| **Top left** | **636.73, 183.77** |
| **Top right** | **725.87, 164.31** |
| **Left** | **650.12, 284.97** |
| **Right** | **719.17, 399.91** |

| 💬 | **NOTE:  **Play mode coordinates (V35, V35.1, V35.2, V36) are in screen/frame coordinate space of their respective Play mode frames — they do NOT need the getBoundingClientRect() offset that the Decorate mode coordinates require. Store these as play_flap_coords in code, separate from decorate_flap_coords. |
| --- | --- |

**Shareable URL**

- Pattern: yoursite.vercel.app/play/[chatterbox-id]

- The id comes from Supabase automatically when a chatterbox is saved — no extra ID generation needed.

- When a user lands on /play/[id], fetch that chatterbox from Supabase and load it into Play mode directly.

**Game loop logic**

- Colour name → count letters → starting open state is H. Letters alternate H/V. Even letters → ends V-open. Odd letters → ends H-open.

- Number pick → count moves → same alternation rule applies from whatever state the chatterbox is currently in.

- After Stage 5 number pick → determine reveal frame set (V37 series for H-open, V39 series for V-open) → determine rotation (H-open: none for 1/2, 180° for 5/6; V-open: 90° right for 8/7, 90° left for 3/4 — every V-open selection rotates) → determine post-reveal frame by number parity (V38.1/V40.1 even, V38.2/V40.2 odd) → bind the maker's decorated fills to the visible front flaps via the outer flap ↔ inner number association in §8.8.

**Fortune system**

- Tell Cursor: 'Create chatterbox-fortunes.js with 200 fortunes — 50 each for Mystical, Funny, Wholesome, and Dramatic — and a pickFortunes(vibe) function that randomly draws 8 unique fortunes from the specified vibe's pool without replacement.'

- Use 'Funny' as the category name throughout — not 'Chaotic'.

**Figma file reference**

- File key: dRqS5TWdiu2J4TPhiEyLrb

- Design system / colour tokens: node 772-9087

- Decorate mode layout (current): node 915-8868

- Decorate mode — vibe selected state (V33.6): node 1086:24774

- Decorate mode — affordance comparison (V33.7): node 1092:9006

- Schoolyard background component: node 1074:7286 (Design System page)

- Schoolyard canonical design: node 1186:9339 — 'Schoolyard. KELLY'S DESIGN', Screens page. This is the only Schoolyard reference. Do not use node 1163:9232.

- Previous Decorate layouts (reference only): node 879-19687, 780-17081

- Wood desk background / texture: node 265-4444

- Animation frame timing: defined in Figma prototype mode — reference prototype, not spec values.

**Virtual scrolling for the Schoolyard**

- Implement virtual scrolling from day one — do not render all chatterboxes in the DOM.

- Layout: pre-compute randomised x position per chatterbox on data load and store it — do not randomise on every render or positions will jump.

- Thumbnail renders: off-screen canvas at 200×200px, cache in a Map keyed by chatterbox id.

| 💬 | **NOTE:  **The canonical Schoolyard design is node 1186:9339 ('Schoolyard. KELLY'S DESIGN') on the Screens page. It uses two stacked layers per repeat section: SHADOW REPEAT underneath (directional shadows offset ~17px right, 12px down from each chatterbox to simulate top-left sunlight) and CHATTERBOX REPEAT on top (the illustrated chatterboxes with fills). These tile vertically as new chatterboxes are added. The background concrete texture (node 1074:7286) tiles seamlessly. Engineering should defer entirely to this frame — do not reference any other Schoolyard frame. |
| --- | --- |

# **Review Summary — What Needs Resolving Before You Hand Off to Cursor**

| 🚨 | **BLOCKERS — resolve these before writing code  **These must be decided first. Everything else depends on them. |
| --- | --- |

| **Blocker** | **Status / Action** |
| --- | --- |
| **Flap coordinate remeasure — ✅ RESOLVED** | Measured at 267px width. Full tables in §15. decorate_flap_coords and play_flap_coords ready to copy into code. Apply getBoundingClientRect() offset for Decorate mode coordinates at runtime. |
| **Schoolyard Figma design — ✅ RESOLVED** | Complete. Canonical design: node 1186:9339 ('Schoolyard. KELLY'S DESIGN'), Screens page. Do not reference node 1163:9232. |
| **Backend / persistence (Vercel + Supabase) — ✅ RESOLVED** | Architecture decided. See §13 OQ2 and §15 for full schema and implementation notes. |
| **'****Chaotic → Funny****'**** rename — ✅ RESOLVED** | Building chatterbox-fortunes.js fresh with 'Funny'. No rename needed. |
| **V39/V40 vertical reveal — ✅ RESOLVED** | Verified complete in the Figma Play Mode section: V39, V39.1, V39.2, V40.1, V40.2 all present. V39.3 was deleted as duplicative of V40.1 (v1.5). |

| ⚠️ | **FLAGS — resolve before each feature is built  **These don't block everything, but each blocks the specific feature it's associated with. |
| --- | --- |

| **Flag** | **What it blocks** |
| --- | --- |
| **V34 vs V41 distinction undocumented** | Horizontal animation axis — clarify difference or confirm identical before building |
| **Fortune array-to-flap mapping unspecified** | Fortune reveal logic — sequential or random? Confirm before building Stage 6 |
| **Maker name position on play screen** | Play screen layout — above, below, or right of chatterbox? Confirm before Play mode build |
| **Construct snip sound — P0 or P2?** | Construct cut interaction — clarify before building §7.4 |
| **Game loop idle behaviour unspecified** | Game loop — what happens if user doesn't click at colour/number pick stages? |
| **Exit confirmation missing from Construct tutorial** | §7.3 — add exit prompt before navigating away mid-tutorial |
| **Vibe card icons — must come from Figma** | Cursor must export vibe icon assets from Design System (node 772-9087), not generate substitutes. Flag this explicitly in the Cursor handoff session. |

| ❓ | **OPEN QUESTIONS — lower priority but worth answering before v1 ships  ** |
| --- | --- |

| **OQ** | **Question** |
| --- | --- |
| **OQ1** | Pre-built chatterbox template for direct-to-Decorate entry — cosmetic or functional? |
| **OQ5** | Monetisation surface for v2 — decide before locking v1 data model |
| **Fortunes** | Are the 200 fortunes written and final in chatterbox-fortunes.js, or will placeholders be used during development? |
| **Display name v2** | Plan localStorage → backend identity migration path for v2 |
| **Virtual scrolling library** | Confirm library choice with engineering before Schoolyard build |

| 📋 | **OVERALL  **The spec is complete and ready to hand off to Cursor. All major blockers are resolved: backend (Vercel + Supabase), flap coordinates (measured, tabulated in §15), Schoolyard design (node 1186:9339), and Chaotic rename (building fresh). The chatterbox is 267px in both Decorate and Play modes — do not resize. Vibe card icons must come from Figma assets, not be generated. The V39/V40 vertical reveal frames are verified complete in Figma. Fortune content (200 fortunes in chatterbox-fortunes.js) is the remaining content dependency. Give Cursor this full PRD at the start of the session. |
| --- | --- |