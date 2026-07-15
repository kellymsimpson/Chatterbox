/**
 * Chatterbox — Frame-swap animation engine
 *
 * All chatterbox animation uses frame-swap (not interpolation).
 * Pre-built Figma frames are displayed in sequence.
 *
 * Frame sequence reference:
 *   V33     — Closed (resting state)
 *   V33.1   — H-Start
 *   V33.2   — H-Half
 *   V34     — H-Open (number picking, Stages 3 & 5)
 *   V35.1   — V-Start
 *   V35.2   — V-Half
 *   V36     — V-Open
 *   V37–V37.2  — H-Reveal lift (3 frames)
 *   V38.1   — H-Fortune Reveal, EVEN number selected (2, 6), with overlay
 *   V38.2   — H-Fortune Reveal, ODD number selected (1, 5), with overlay
 *   V39–V39.2  — V-Reveal lift (3 frames)
 *   V40.1   — V-Fortune Reveal, EVEN number selected (4, 8), with overlay
 *   V40.2   — V-Fortune Reveal, ODD number selected (3, 7), with overlay
 *
 *   NOTE (v1.5): V37.3 and V39.3 were DELETED from Figma (duplicative of
 *   V38.1 / V40.1). Do not reference or export them.
 *   V41     — H-Open (Play mode variant of V34)
 *   V42     — Post Reveal Screen
 *
 * Chatterbox size: 267px wide in BOTH Decorate and Play modes.
 *
 * Figma file key: dRqS5TWdiu2J4TPhiEyLrb
 */

// TODO: Tell Cursor to build this component to match the Figma animation frames.
// Export each frame as an SVG or PNG from Figma and place in /assets/.
// This file should handle:
//   - Loading and caching frame assets
//   - Swapping frames in sequence at the correct timing
//   - Applying rotation (90° for vertical mode, 180° for bottom flap selection)
//   - Exposing a play(sequence, onComplete) method

export class Chatterbox {
  constructor(containerEl) {
    this.container = containerEl;
    this.currentFrame = 'V33';
  }

  showFrame(frameName) {
    // TODO: swap displayed frame asset
    this.currentFrame = frameName;
  }

  async playSequence(frames, msPerFrame = 80) {
    for (const frame of frames) {
      this.showFrame(frame);
      await new Promise(r => setTimeout(r, msPerFrame));
    }
  }

  // Horizontal open/close sequence
  get H_OPEN_SEQ()  { return ['V33','V33.1','V33.2','V34']; }
  get H_CLOSE_SEQ() { return ['V34','V33.2','V33.1','V33']; }

  // Vertical open/close sequence
  get V_OPEN_SEQ()  { return ['V33','V35.1','V35.2','V36']; }
  get V_CLOSE_SEQ() { return ['V36','V35.2','V35.1','V33']; }
}

/**
 * Fortune reveal mapping — AUTHORITATIVE (PRD §9.4 Stage 6, v1.5).
 *
 * Rotation rules:
 *   H-mode: 1, 2 → no rotation. 5, 6 → 180°.
 *   V-mode: EVERY selection rotates (reveal frames are frontal; selection
 *   frames are top-down). 8, 7 → 90° right. 3, 4 → 90° left.
 *
 * Post-reveal frame is chosen by number parity:
 *   even (2, 6, 4, 8) → V38.1 / V40.1
 *   odd  (1, 5, 3, 7) → V38.2 / V40.2
 *
 * Decorated fills: the fills in the Play mode Figma frames are placeholders.
 * At runtime, render the maker's flap_colors + stickers from Decorate mode.
 * Outer flap ↔ inner number association (fixed by fold geometry, PRD §8.8):
 *   top-left → 1, 8 · top-right → 2, 3 · bottom-right → 4, 5 · bottom-left → 6, 7
 */
export const REVEAL_MAP = {
  1: { mode: 'H', rotation: 0,    lift: ['V37','V37.1','V37.2'], post: 'V38.2' },
  2: { mode: 'H', rotation: 0,    lift: ['V37','V37.1','V37.2'], post: 'V38.1' },
  5: { mode: 'H', rotation: 180,  lift: ['V37','V37.1','V37.2'], post: 'V38.2' },
  6: { mode: 'H', rotation: 180,  lift: ['V37','V37.1','V37.2'], post: 'V38.1' },
  8: { mode: 'V', rotation: 90,   lift: ['V39','V39.1','V39.2'], post: 'V40.1' }, // 90° right
  7: { mode: 'V', rotation: 90,   lift: ['V39','V39.1','V39.2'], post: 'V40.2' }, // 90° right
  3: { mode: 'V', rotation: -90,  lift: ['V39','V39.1','V39.2'], post: 'V40.2' }, // 90° left
  4: { mode: 'V', rotation: -90,  lift: ['V39','V39.1','V39.2'], post: 'V40.1' }, // 90° left
};

/** Outer flap ↔ inner number association (PRD §8.8). Fixed — never changes. */
export const FLAP_NUMBER_MAP = {
  top_left:     [1, 8],
  top_right:    [2, 3],
  bottom_right: [4, 5],
  bottom_left:  [6, 7],
};
