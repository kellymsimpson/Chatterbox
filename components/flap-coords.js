/**
 * Chatterbox — Flap Coordinates
 *
 * Coordinates are measured as four corner points (C0–C3) per flap.
 *
 * ── DECORATE MODE ──
 * Coordinates are in LOCAL chatterbox space (origin = chatterbox top-left corner).
 * At runtime, add getBoundingClientRect() offsets before using for hit detection:
 *
 *   const rect = chatterboxEl.getBoundingClientRect();
 *   const screenX = localX + rect.left;
 *   const screenY = localY + rect.top;
 *
 * Measured from Figma node 915-8868 at 267×294px.
 *
 * ── PLAY MODE ──
 * Coordinates are in screen/frame space — no offset needed.
 * Measured from Play mode Figma frames at 267×294px.
 *
 * DO NOT remeasure. These are final.
 */

// ── Decorate mode (local chatterbox space) ──
export const decorate_flap_coords = {
  top_left: {
    C0: [24.26, 39.03], C1: [133.63, 50.45], C2: [132.31, 144.70], C3: [35.17, 144.71],
  },
  top_right: {
    C0: [133.96, 50.29], C1: [242.18, 39.23], C2: [231.38, 144.76], C3: [132.61, 145.14],
  },
  left: {
    C0: [132.78, 144.54], C1: [233.90, 144.54], C2: [241.69, 255.05], C3: [132.78, 248.29],
  },
  right: {
    C0: [35.05, 144.30], C1: [132.82, 144.30], C2: [132.82, 248.21], C3: [29.89, 255.10],
  },
};

// ── Play mode (screen/frame space of each Play frame) ──
// Authoritative C0–C3 clockwise measurements (same method/space as PRD §15 V35 tables).
// V33.1 / V33.2 / V34: hand-measured 2026-07-17. V35.* / V36: PRD §15.
// play left/right = visual bottom_left / bottom_right (see playQuadsVisual).
export const play_flap_coords = {
  V35_close: {
    top_left:  { C0:[612.41,180.75], C1:[721.78,191.89], C2:[720.46,286.13], C3:[623.20,286.00] },
    top_right: { C0:[722.11,191.72], C1:[830.33,180.66], C2:[819.54,286.19], C3:[720.76,286.19] },
    left:      { C0:[623.20,285.74], C1:[720.98,285.74], C2:[720.98,389.64], C3:[618.04,396.54] },
    right:     { C0:[720.94,285.98], C1:[822.06,285.98], C2:[829.84,396.48], C3:[719.99,389.44] },
  },
  // H-open intermediates + H-open stable (no fill masks on intermediates — derive paint from quads)
  V33_1_anim_start: {
    top_left:  { C0:[613.20,173.73], C1:[721.79,191.87], C2:[708.51,286.13], C3:[623.21,286.13] },
    top_right: { C0:[722.12,191.71], C1:[830.34,173.92], C2:[823.23,286.18], C3:[734.24,286.18] },
    left:      { C0:[623.21,285.73], C1:[709.00,285.73], C2:[719.06,380.20], C3:[612.42,397.99] },
    right:     { C0:[733.87,285.97], C1:[822.06,285.97], C2:[830.51,398.92], C3:[720.29,381.11] },
  },
  V33_2_anim_half: {
    top_left:  { C0:[614.56,180.46], C1:[720.29,192.00], C2:[621.17,285.68], C3:[592.35,285.68] },
    top_right: { C0:[719.86,191.52], C1:[830.33,180.65], C2:[850.70,286.17], C3:[823.19,286.17] },
    left:      { C0:[592.84,285.68], C1:[621.13,285.73], C2:[718.94,378.03], C3:[612.42,395.35] },
    right:     { C0:[823.39,285.97], C1:[850.30,285.97], C2:[828.72,390.56], C3:[719.91,378.57] },
  },
  V34_h_open: {
    top_left:  { C0:[614.56,199.61], C1:[719.95,208.66], C2:[621.17,285.48], C3:[593.12,285.48] },
    top_right: { C0:[719.86,208.65], C1:[830.33,199.77], C2:[850.17,285.88], C3:[823.22,285.69] },
    left:      { C0:[592.84,285.48], C1:[621.13,285.52], C2:[720.04,361.08], C3:[612.42,374.98] },
    right:     { C0:[823.39,285.72], C1:[850.30,285.72], C2:[828.72,371.07], C3:[719.79,361.10] },
  },
  V35_1_anim_start: {
    top_left:  { C0:[594.09,189.80], C1:[721.12,176.81], C2:[720.60,268.08], C3:[624.67,285.25] },
    top_right: { C0:[721.70,176.55], C1:[847.99,184.06], C2:[818.96,286.09], C3:[720.93,268.11] },
    left:      { C0:[624.25,284.91], C1:[720.47,300.28], C2:[719.58,389.90], C3:[602.01,393.39] },
    right:     { C0:[720.65,300.28], C1:[821.78,284.96], C2:[840.82,394.76], C3:[720.65,389.99] },
  },
  V35_2_anim_half: {
    top_left:  { C0:[636.73,243.68], C1:[721.29,227.92], C2:[721.29,246.23], C3:[649.92,323.37] },
    top_right: { C0:[721.70,227.87], C1:[812.07,246.01], C2:[817.04,305.10], C3:[721.82,246.01] },
    left:      { C0:[650.12,322.62], C1:[719.03,411.54], C2:[719.03,429.77], C3:[639.49,411.54] },
    right:     { C0:[719.62,411.68], C1:[801.84,322.92], C2:[811.42,413.67], C3:[719.17,430.88] },
  },
  V36_vertical_open: {
    top_left:  { C0:[636.73,183.77], C1:[724.60,164.51], C2:[726.29,187.03], C3:[649.54,285.93] },
    top_right: { C0:[725.87,164.31], C1:[811.68,186.75], C2:[801.85,286.12], C3:[725.87,186.75] },
    left:      { C0:[650.12,284.97], C1:[719.03,398.97], C2:[719.03,422.34], C3:[639.50,398.97] },
    right:     { C0:[719.17,399.91], C1:[801.84,285.35], C2:[811.43,401.70], C3:[719.17,423.77] },
  },
};

/**
 * Bridge: play screen space → decorate-local (267×294).
 * Derived from V35_close.C0 − decorate.top_left.C0 (same closed geometry).
 */
export const PLAY_TO_LOCAL_ORIGIN = [
  play_flap_coords.V35_close.top_left.C0[0] - decorate_flap_coords.top_left.C0[0],
  play_flap_coords.V35_close.top_left.C0[1] - decorate_flap_coords.top_left.C0[1],
];

/** Frame name → play_flap_coords key (null = use decorate_flap_coords). */
export const FRAME_COORD_KEY = {
  V33: 'V35_close',
  'V33.1': 'V33_1_anim_start',
  'V33.2': 'V33_2_anim_half',
  V34: 'V34_h_open',
  'V35.1': 'V35_1_anim_start',
  'V35.2': 'V35_2_anim_half',
  V36: 'V36_vertical_open',
};

/**
 * Visual flap keys used by paint/stickers.
 * Note: decorate_flap_coords.left/right are named opposite to visual bottom_left/right.
 */
export function decorateQuadsVisual() {
  return {
    top_left: decorate_flap_coords.top_left,
    top_right: decorate_flap_coords.top_right,
    bottom_left: decorate_flap_coords.right,
    bottom_right: decorate_flap_coords.left,
  };
}

/** Play-space flap set → visual keys (play left/right match visual bottom_left/right). */
export function playQuadsVisual(playSet) {
  return {
    top_left: playSet.top_left,
    top_right: playSet.top_right,
    bottom_left: playSet.left,
    bottom_right: playSet.right,
  };
}
