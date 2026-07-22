/**
 * Verify Stage 6 opposite flap pairs + sticker warp for demo chatterbox.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';

const DEMO = '408c846b-8fad-46e1-a5fb-d54021cb38b7';
const OUT = '/Users/kellysimpson/Downloads/chatterbox-handoff/sandbox/stage6-demo';
mkdirSync(OUT, { recursive: true });

const EXPECT = {
  1: { left: 'bottom_left', right: 'bottom_right', colors: ['#F6AA41', '#B285CD'] },
  2: { left: 'bottom_left', right: 'bottom_right', colors: ['#F6AA41', '#B285CD'] },
  5: { left: 'top_left', right: 'top_right', colors: ['#EA6949', '#FFB2D2'] },
  6: { left: 'top_left', right: 'top_right', colors: ['#EA6949', '#FFB2D2'] },
  3: { left: 'top_left', right: 'bottom_left', colors: ['#EA6949', '#F6AA41'] },
  4: { left: 'top_left', right: 'bottom_left', colors: ['#EA6949', '#F6AA41'] },
  7: { left: 'top_right', right: 'bottom_right', colors: ['#FFB2D2', '#B285CD'] },
  8: { left: 'top_right', right: 'bottom_right', colors: ['#FFB2D2', '#B285CD'] },
};

const CASES = [
  { num: 1, review: 'V34', pick1: 1, pick2: 1, label: 'pair-1-BL-BR' },
  { num: 2, review: 'V34', pick1: 1, pick2: 2, label: 'pair-2-BL-BR' },
  { num: 5, review: 'V34', pick1: 1, pick2: 5, label: 'pair-5-TL-TR' },
  { num: 6, review: 'V34', pick1: 1, pick2: 6, label: 'pair-6-TL-TR' },
  { num: 3, review: 'V36', pick1: 4, pick2: 3, label: 'pair-3-TL-BL' },
  { num: 4, review: 'V36', pick1: 4, pick2: 4, label: 'pair-4-TL-BL' },
  { num: 7, review: 'V36', pick1: 4, pick2: 7, label: 'pair-7-TR-BR' },
  { num: 8, review: 'V36', pick1: 4, pick2: 8, label: 'pair-8-TR-BR' },
];

function normHex(h) {
  return String(h || '').trim().toUpperCase();
}

async function runCase(browser, c) {
  const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
  const url = `http://127.0.0.1:8877/screens/play.html?id=${DEMO}&review=${c.review}&v=s33`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('.fortune-flap:not([disabled])', { timeout: 20000 });
  await page.click(`.fortune-flap[data-number="${c.pick1}"]`);
  await page.waitForFunction(() => window.__play?.stage === 5, null, { timeout: 45000 });
  await page.waitForSelector('.fortune-flap:not([disabled])', { timeout: 15000 });
  await page.click(`.fortune-flap[data-number="${c.pick2}"]`);
  await page.waitForFunction(
    () => {
      const f = document.getElementById('play-stage')?.dataset?.frame || '';
      return /^V3[789]|^V40/.test(f);
    },
    null,
    { timeout: 20000 },
  );
  // Mid-lift / land: wait for stickers to resolve
  await page.waitForTimeout(900);

  const shot = `${OUT}/${c.label}.png`;
  await page.screenshot({ path: shot, fullPage: false });

  const info = await page.evaluate(() => {
    const stage = document.getElementById('play-stage');
    const fills = [...stage.querySelectorAll('.reveal-frame-fills [data-flap][data-face]')].map(
      (el) => ({
        flap: el.getAttribute('data-flap'),
        face: el.getAttribute('data-face'),
        fill: el.querySelector('path')?.getAttribute('fill'),
      }),
    );
    const stickers = [...stage.querySelectorAll('.reveal-frame-stickers .sticker-on-flap')].map(
      (el) => ({
        flap: el.dataset.flap,
        face: el.dataset.face,
        transform: el.style.transform || '',
        hasImg: !!el.querySelector('img[src]'),
      }),
    );
    return {
      frame: stage.dataset.frame,
      selectedNumber2: window.__play?.selectedNumber2,
      fills,
      stickers,
    };
  });

  await page.close();

  const exp = EXPECT[c.num];
  const byFace = Object.fromEntries(info.fills.map((f) => [f.face, f]));
  const leftOk =
    byFace.left?.flap === exp.left &&
    normHex(byFace.left?.fill) === normHex(exp.colors[0]);
  const rightOk =
    byFace.right?.flap === exp.right &&
    normHex(byFace.right?.fill) === normHex(exp.colors[1]);
  const stickersWarped =
    info.stickers.length > 0 &&
    info.stickers.every((s) => s.transform.includes('matrix3d') && s.hasImg);

  return {
    label: c.label,
    num: c.num,
    url,
    shot,
    ok: leftOk && rightOk && stickersWarped,
    leftOk,
    rightOk,
    stickersWarped,
    expected: exp,
    info,
  };
}

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});

const results = [];
for (const c of CASES) {
  try {
    const r = await runCase(browser, c);
    results.push(r);
    console.log(r.ok ? 'OK' : 'FAIL', c.label, {
      leftOk: r.leftOk,
      rightOk: r.rightOk,
      stickersWarped: r.stickersWarped,
      fills: r.info.fills,
    });
  } catch (e) {
    results.push({ label: c.label, num: c.num, ok: false, error: e.message });
    console.error('FAIL', c.label, e.message);
  }
}

await browser.close();
const report = {
  demoColors: {
    top_left: '#EA6949',
    top_right: '#FFB2D2',
    bottom_left: '#F6AA41',
    bottom_right: '#B285CD',
  },
  passed: results.filter((r) => r.ok).length,
  total: results.length,
  results,
};
writeFileSync(`${OUT}/pair-verify.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ passed: report.passed, total: report.total }, null, 2));
if (report.passed !== report.total) process.exit(1);
