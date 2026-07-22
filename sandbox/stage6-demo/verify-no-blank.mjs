/**
 * Verify Stage 6 rotation → first lift has no blank stage.
 * Captures samples around transform clear / V37 first paint.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';

const DEMO = '408c846b-8fad-46e1-a5fb-d54021cb38b7';
const OUT = '/Users/kellysimpson/Downloads/chatterbox-handoff/sandbox/stage6-demo';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });

const url = `http://127.0.0.1:8877/screens/play.html?id=${DEMO}&review=V34&v=s32`;
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('.fortune-flap:not([disabled])', { timeout: 20000 });

await page.click('.fortune-flap[data-number="1"]');
await page.waitForFunction(() => window.__play?.stage === 5, null, { timeout: 30000 });
await page.waitForSelector('.fortune-flap:not([disabled])', { timeout: 10000 });

// Instrument: sample stage contents from Stage 5 pick through first reveal frame.
await page.evaluate(() => {
  window.__blankTrace = [];
  const stage = document.getElementById('play-stage');
  const wrap = document.getElementById('play-stage-wrap');
  const tick = () => {
    const kids = stage?.children?.length ?? 0;
    const paper =
      stage?.querySelector('.reveal-frame-paper, .stable-frame-paper, .chatterbox-frame') || null;
    const frame = stage?.dataset?.frame || '';
    const transform = wrap?.style?.transform || '';
    const blank = kids === 0 || (!paper && !stage?.querySelector('svg'));
    window.__blankTrace.push({
      t: performance.now(),
      kids,
      frame,
      transform,
      blank,
      hasPaper: !!paper,
    });
  };
  window.__blankInterval = setInterval(tick, 16);
  tick();
});

await page.click('.fortune-flap[data-number="6"]');
await page.waitForFunction(() => {
  const f = document.getElementById('play-stage')?.dataset?.frame;
  return f === 'V37' || f === 'V37.1' || f === 'V37.2' || f === 'V38.1';
}, null, { timeout: 15000 });

// A few more samples after first reveal paint
await page.waitForTimeout(400);
await page.evaluate(() => clearInterval(window.__blankInterval));

const shotPath = `${OUT}/no-blank-after-rotate-V37.png`;
await page.screenshot({ path: shotPath, fullPage: false });

// Wait for fortune land shot too
await page.waitForSelector('#play-fortune.is-visible', { timeout: 20000 }).catch(() => {});
const landPath = `${OUT}/land-V38-after-180.png`;
await page.screenshot({ path: landPath, fullPage: false });

const trace = await page.evaluate(() => window.__blankTrace || []);
await browser.close();

const afterStage6 = (() => {
  // Keep samples from last ~2s of rotation→lift (all of them; filter blanks)
  return trace;
})();

const blanks = afterStage6.filter((s) => s.blank);
const firstReveal = afterStage6.find((s) => s.frame?.startsWith('V37') || s.frame?.startsWith('V38'));
const rotating = afterStage6.filter((s) => s.transform.includes('rotate'));

const report = {
  url,
  samples: afterStage6.length,
  blankSamples: blanks.length,
  blanks,
  rotatingSamples: rotating.length,
  firstReveal,
  shotPath,
  landPath,
  ok: blanks.length === 0 && !!firstReveal,
};

writeFileSync(`${OUT}/no-blank-trace.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
