/**
 * OFFLINE — not imported by any runtime path.
 *
 * Retained from the Option-1 / decor-fade experiment (2026-07-17).
 * Intermediate frames (V33.1, V33.2, V35.1, V35.2) and decor fades were
 * cut from runtime by design decision: open/close is V33↔V34 / V33↔V36
 * with full-opacity decorations and a ~120ms container scale-squash.
 *
 * Kept for reference only. Do not wire into chatterbox.js or step4.
 */

export const LEGACY_FADE_MS = 90;
export const LEGACY_H_CYCLE = ['V33', 'V33.1', 'V33.2', 'V34', 'V33.2', 'V33.1', 'V33'];
export const LEGACY_V_CYCLE = ['V33', 'V35.1', 'V35.2', 'V36', 'V35.2', 'V35.1', 'V33'];

/**
 * @param {object} ctx
 * @param {() => Element | null} ctx.getDecor
 * @param {(ms: number) => Promise<void>} ctx.sleep
 * @param {(frame: string, opts?: {decorOpacity?: number}) => Promise<void>} ctx.showFrame
 * @param {() => boolean} ctx.alive
 * @param {(msg: string) => void} [ctx.onStatus]
 */
export async function legacyFadeDecor(ctx, toOpacity, easing) {
  const decor = ctx.getDecor();
  if (!decor) return ctx.alive();
  ctx.onStatus?.(
    `Fade ${toOpacity === 0 ? 'out' : 'in'} ${LEGACY_FADE_MS}ms ${easing}`,
  );
  decor.style.transition = `opacity ${LEGACY_FADE_MS}ms ${easing}`;
  void decor.offsetWidth;
  decor.style.opacity = String(toOpacity);
  await ctx.sleep(LEGACY_FADE_MS);
  if (!ctx.alive()) return false;
  decor.style.transition = 'none';
  return true;
}

/**
 * Fade on stables → intermediates with no decor → fade in on destination.
 * Not used at runtime.
 */
export async function legacyRunFadeCycle(ctx, frames, stepMs) {
  const openStableIdx = Math.floor(frames.length / 2);
  const start = frames[0];
  const openStable = frames[openStableIdx];
  const openMids = frames.slice(1, openStableIdx);
  const closeMids = frames.slice(openStableIdx + 1, frames.length - 1);
  const end = frames[frames.length - 1];

  if (!ctx.alive()) return false;
  await ctx.showFrame(start, { decorOpacity: 1 });
  if (!(await legacyFadeDecor(ctx, 0, 'ease-out'))) return false;

  for (const f of openMids) {
    if (!ctx.alive()) return false;
    await ctx.showFrame(f);
    await ctx.sleep(stepMs);
  }

  if (!ctx.alive()) return false;
  await ctx.showFrame(openStable, { decorOpacity: 0 });
  if (!(await legacyFadeDecor(ctx, 1, 'ease-in'))) return false;
  await ctx.sleep(stepMs);

  if (!(await legacyFadeDecor(ctx, 0, 'ease-out'))) return false;

  for (const f of closeMids) {
    if (!ctx.alive()) return false;
    await ctx.showFrame(f);
    await ctx.sleep(stepMs);
  }

  if (!ctx.alive()) return false;
  await ctx.showFrame(end, { decorOpacity: 0 });
  if (!(await legacyFadeDecor(ctx, 1, 'ease-in'))) return false;
  return ctx.alive();
}
