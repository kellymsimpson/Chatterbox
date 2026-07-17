/**
 * Chatterbox — Frame-swap animation engine
 *
 * All chatterbox animation uses frame-swap (not interpolation).
 * Pre-built Figma frames are displayed in sequence.
 *
 * ─────────────────────────────────────────────────────────────────────
 * CANONICAL OPEN/CLOSE ANIMATION (approved 2026-07-17)
 * ─────────────────────────────────────────────────────────────────────
 * Sequences (stables only):
 *   Horizontal: V33 ↔ V34
 *   Vertical:   V33 ↔ V36
 * Intermediate frames (V33.1, V33.2, V35.1, V35.2) remain in asset/coord
 * libraries but are NOT in any runtime sequence.
 *
 * Decorations: full opacity on every displayed frame (no fades / hides).
 *
 * Swap motion — scale-squash pop on the container:
 *   duration:  120ms          (SWAP_SQUASH_MS)
 *   keyframes: scale(1, 1) → scale(1.05, 0.90) @ 40% → scale(1, 1)
 *   easing:    ease-out       (= cubic-bezier(0, 0, 0.58, 1))
 * Hold after each swap:
 *   duration:  200ms          (STABLE_HOLD_MS)
 *
 * Design decision 2026-07-17: these values are canonical and REPLACE
 * Figma prototype timings for the cut intermediate open/close sequences.
 * Do not re-read or re-apply those prototype durations for runtime H/V
 * open/close. (Figma file key remains the source for assets / geometry.)
 * ─────────────────────────────────────────────────────────────────────
 *
 * Frame reference:
 *   V33     — Closed (resting state)
 *   V33.1   — H-Start (asset only; not in runtime sequences)
 *   V33.2   — H-Half  (asset only; not in runtime sequences)
 *   V34     — H-Open (number picking, Stages 3 & 5)
 *   V35.1   — V-Start (asset only; not in runtime sequences)
 *   V35.2   — V-Half  (asset only; not in runtime sequences)
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

import { PaintStickerLayer } from './paint-layer.js';

const FRAME_FILES = {
  V33: 'v33.svg',
  'V33.1': 'v33.1.svg',
  'V33.2': 'v33.2.svg',
  V34: 'v34.svg',
  'V35.1': 'v35.1.svg',
  'V35.2': 'v35.2.svg',
  V36: 'v36.svg',
  V37: 'v37.svg',
  'V37.1': 'v37.1.svg',
  'V37.2': 'v37.2.svg',
  'V38.1': 'v38.1.svg',
  'V38.2': 'v38.2.svg',
  V39: 'v39.svg',
  'V39.1': 'v39.1.svg',
  'V39.2': 'v39.2.svg',
  'V40.1': 'v40.1.svg',
  'V40.2': 'v40.2.svg',
  V41: 'v41.svg',
  V42: 'v42.svg',
};

const FRAMES_BASE = new URL('../assets/frames/', import.meta.url);

/** Canonical: container scale-squash pop duration (see file header). */
export const SWAP_SQUASH_MS = 120;

/** Canonical: hold on a stable after each swap (see file header). */
export const STABLE_HOLD_MS = 200;

export class Chatterbox {
  /**
   * @param {HTMLElement} containerEl
   * @param {{ flap_colors?: Record<string,string>, stickers?: object[] }} [decoration]
   */
  constructor(containerEl, decoration = {}) {
    this.container = containerEl;
    this.currentFrame = 'V33';
    this.decoration = {
      flap_colors: decoration.flap_colors || {},
      stickers: decoration.stickers || [],
    };
    this._playing = false;

    this.container.classList.add('chatterbox');
    this.container.style.width = '267px';
    this.container.style.height = '294px';
    this.container.style.position = 'relative';
    this.container.style.overflow = 'visible';
    this.container.style.transformOrigin = '50% 50%';

    this.frameImg = document.createElement('img');
    this.frameImg.className = 'chatterbox-frame';
    this.frameImg.alt = '';
    this.frameImg.draggable = false;
    Object.assign(this.frameImg.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      pointerEvents: 'none',
      userSelect: 'none',
    });
    this.container.appendChild(this.frameImg);

    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: '267px',
      height: '294px',
      pointerEvents: 'none',
      overflow: 'visible',
    });
    this.container.appendChild(this.overlay);

    this.paintLayer = new PaintStickerLayer(this.overlay, this.decoration);
    this.showFrame('V33');
  }

  setDecoration(decoration) {
    this.decoration = {
      flap_colors: decoration.flap_colors || {},
      stickers: decoration.stickers || [],
    };
    this.paintLayer.setDecoration(this.decoration);
    this.paintLayer.render(this.currentFrame);
  }

  showFrame(frameName) {
    this.currentFrame = frameName;
    const file = FRAME_FILES[frameName];
    if (file) {
      this.frameImg.src = new URL(file, FRAMES_BASE).href;
    }
    this.paintLayer.render(frameName);
    this.container.dataset.frame = frameName;
    this.container.dispatchEvent(
      new CustomEvent('chatterbox:frame', { detail: { frame: frameName } }),
    );
  }

  /**
   * Swap to a frame at full decor opacity, with a ~120ms scale-squash pop.
   * @param {string} frameName
   * @param {{ squashMs?: number }} [opts]
   */
  async swapFrame(frameName, { squashMs = SWAP_SQUASH_MS } = {}) {
    this.showFrame(frameName);
    await this._squashPop(squashMs);
  }

  /** Ease-out scale-squash so a hard frame swap reads as a pop. */
  async _squashPop(ms = SWAP_SQUASH_MS) {
    const el = this.container;
    el.style.transformOrigin = '50% 50%';
    const anim = el.animate(
      [
        { transform: 'scale(1, 1)' },
        { transform: 'scale(1.05, 0.90)', offset: 0.4 },
        { transform: 'scale(1, 1)' },
      ],
      { duration: ms, easing: 'ease-out', fill: 'none' },
    );
    await anim.finished;
  }

  /**
   * Play a frame sequence. Consecutive distinct frames swap with squash;
   * identical consecutive frames are skipped. Hold after each swap (not after last).
   * @param {string[]} frames
   * @param {number} [holdMs] dwell after each swap (default STABLE_HOLD_MS)
   */
  async playSequence(frames, holdMs = STABLE_HOLD_MS) {
    if (this._playing) return;
    this._playing = true;
    try {
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        if (frame !== this.currentFrame) {
          await this.swapFrame(frame);
        } else if (i === 0) {
          this.showFrame(frame);
        }
        if (i < frames.length - 1) {
          await new Promise((r) => setTimeout(r, holdMs));
        }
      }
    } finally {
      this._playing = false;
    }
  }

  /** Runtime sequences — stables only (intermediates cut by design decision). */
  get H_OPEN_SEQ()  { return ['V33', 'V34']; }
  get H_CLOSE_SEQ() { return ['V34', 'V33']; }
  get V_OPEN_SEQ()  { return ['V33', 'V36']; }
  get V_CLOSE_SEQ() { return ['V36', 'V33']; }
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
  1: { mode: 'H', rotation: 0,    lift: ['V37', 'V37.1', 'V37.2'], post: 'V38.2' },
  2: { mode: 'H', rotation: 0,    lift: ['V37', 'V37.1', 'V37.2'], post: 'V38.1' },
  5: { mode: 'H', rotation: 180,  lift: ['V37', 'V37.1', 'V37.2'], post: 'V38.2' },
  6: { mode: 'H', rotation: 180,  lift: ['V37', 'V37.1', 'V37.2'], post: 'V38.1' },
  8: { mode: 'V', rotation: 90,   lift: ['V39', 'V39.1', 'V39.2'], post: 'V40.1' },
  7: { mode: 'V', rotation: 90,   lift: ['V39', 'V39.1', 'V39.2'], post: 'V40.2' },
  3: { mode: 'V', rotation: -90,  lift: ['V39', 'V39.1', 'V39.2'], post: 'V40.2' },
  4: { mode: 'V', rotation: -90,  lift: ['V39', 'V39.1', 'V39.2'], post: 'V40.1' },
};

/** Outer flap ↔ inner number association (PRD §8.8). Fixed — never changes. */
export const FLAP_NUMBER_MAP = {
  top_left:     [1, 8],
  top_right:    [2, 3],
  bottom_right: [4, 5],
  bottom_left:  [6, 7],
};
