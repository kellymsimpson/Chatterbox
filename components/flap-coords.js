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

// ── Play mode — V35 Close (screen space) ──
export const play_flap_coords = {
  V35_close: {
    top_left:  { C0:[612.41,180.75], C1:[721.78,191.89], C2:[720.46,286.13], C3:[623.20,286.00] },
    top_right: { C0:[722.11,191.72], C1:[830.33,180.66], C2:[819.54,286.19], C3:[720.76,286.19] },
    left:      { C0:[623.20,285.74], C1:[720.98,285.74], C2:[720.98,389.64], C3:[618.04,396.54] },
    right:     { C0:[720.94,285.98], C1:[822.06,285.98], C2:[829.84,396.48], C3:[719.99,389.44] },
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
