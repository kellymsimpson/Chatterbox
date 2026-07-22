/**
 * Stage 6 FakeText — triangle shape-outside verification (s37).
 * Short + long fortune on each land frame (V38.1/2, V40.1/2).
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';

const DEMO = '408c846b-8fad-46e1-a5fb-d54021cb38b7';
const BASE = 'http://127.0.0.1:8877/screens/play.html';
const OUT = '/Users/kellysimpson/Downloads/chatterbox-handoff/sandbox/stage6-demo';
const CACHE = 's37';

const SHORT = 'Yes.';
const LONG =
  'Your invisible thread of destiny is rearranging a spectacular coincidence into an extraordinary opportunity that softens every question before the answer arrives.';

/** Stage-5 → Stage-6 picks that land on each frame. */
const FRAME_PICKS = [
  { frame: 'V38.2', label: 'H-odd', review: 'V34', n1: '1', n2: '1' },
  { frame: 'V38.1', label: 'H-even', review: 'V34', n1: '1', n2: '2' },
  { frame: 'V40.2', label: 'V-odd', review: 'V36', n1: '4', n2: '3' },
  { frame: 'V40.1', label: 'V-even', review: 'V36', n1: '4', n2: '8' },
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
page.on('console', (msg) => {
  const t = msg.text();
  if (/\[play\]|error|Error/i.test(t)) logs.push(t);
});
page.on('pageerror', (err) => logs.push('PAGEERROR: ' + err.message));

async function gotoFresh(review) {
  const url = `${BASE}?id=${DEMO}&review=${review}&v=${CACHE}&t=${Date.now()}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('.fortune-flap:not([disabled])', { timeout: 15000 });
  return url;
}

async function reachLand(n1, n2) {
  await page.click(`.fortune-flap[data-number="${n1}"]`);
  await page.waitForFunction(() => window.__play?.stage === 5, null, { timeout: 30000 });
  await page.waitForSelector(`.fortune-flap[data-number="${n2}"]:not([disabled])`, {
    timeout: 15000,
  });
  await page.click(`.fortune-flap[data-number="${n2}"]`);
  await page.waitForFunction(() => window.__play?.stage === 6, null, { timeout: 10000 });
  await page.waitForSelector('#play-fortune.is-visible', { timeout: 20000 });
  await page.waitForSelector('.reveal-fake-text', { timeout: 5000 });
}

async function measureAndShot(tag, fortuneText) {
  await page.evaluate(async (text) => {
    const play = window.__play;
    const cb = play.cb;
    const frame = cb.currentFrame;
    cb.setRevealFortune(text);
    await cb.showFrame(frame);
  }, fortuneText);

  await page.waitForSelector('.reveal-fake-text-copy', { timeout: 5000 });
  await page.waitForTimeout(150);

  const metrics = await page.evaluate(() => {
    const fake = document.querySelector('.reveal-fake-text');
    const copy = document.querySelector('.reveal-fake-text-copy');
    const shapes = [...document.querySelectorAll('.reveal-fake-text-shape')];
    if (!fake || !copy) return { ok: false, reason: 'missing nodes' };

    const boxW = parseFloat(fake.style.width);
    const boxH = parseFloat(fake.style.height);
    const cs = getComputedStyle(copy);
    const text = copy.textContent || '';
    const words = text.split(/\s+/).filter(Boolean);

    let midWordBreaks = 0;
    let shortWordLetterSplit = false;
    for (const word of words) {
      if (word.length < 2 || !copy.firstChild) continue;
      const start = text.indexOf(word);
      if (start < 0) continue;
      const range = document.createRange();
      let prevTop = null;
      for (let i = 0; i < word.length; i++) {
        range.setStart(copy.firstChild, start + i);
        range.setEnd(copy.firstChild, start + i + 1);
        const rect = range.getBoundingClientRect();
        if (prevTop != null && Math.abs(rect.top - prevTop) > 2) {
          midWordBreaks += 1;
          if (word.length <= 5) shortWordLetterSplit = true;
          break;
        }
        prevTop = rect.top;
      }
    }

    // Ink vs triangle — measure on an untransformed clone.
    let inkOverflow = false;
    let inkDetail = null;
    let lineWidths = [];
    const clone = fake.cloneNode(true);
    Object.assign(clone.style, {
      position: 'fixed',
      left: '-10000px',
      top: '0',
      transform: 'none',
      visibility: 'hidden',
      pointerEvents: 'none',
      zIndex: '-1',
    });
    document.body.appendChild(clone);
    try {
      const cCopy = clone.querySelector('.reveal-fake-text-copy');
      const wrapRect = clone.getBoundingClientRect();
      const clip = clone.style.clipPath || '';
      const apexMatch = /polygon\(\s*([\d.]+)%/.exec(clip);
      const apexX = apexMatch ? parseFloat(apexMatch[1]) / 100 : 0.5;

      const xRangeAt = (y) => {
        const t = Math.max(0, Math.min(1, y / boxH));
        const left = apexX * boxW * (1 - t);
        const right = apexX * boxW + (1 - apexX) * boxW * t;
        return [left, right];
      };

      if (cCopy?.firstChild) {
        const range = document.createRange();
        range.selectNodeContents(cCopy);
        for (const r of range.getClientRects()) {
          if (r.width < 0.5 || r.height < 0.5) continue;
          const top = r.top - wrapRect.top;
          const bottom = r.bottom - wrapRect.top;
          const left = r.left - wrapRect.left;
          const right = r.right - wrapRect.left;
          lineWidths.push({ y: (top + bottom) / 2, w: r.width, left, right });
          if (top < -1.25 || bottom > boxH + 1.25) {
            inkOverflow = true;
            inkDetail = { overT: -top, overB: bottom - boxH };
            break;
          }
          for (const y of [top, (top + bottom) / 2, bottom]) {
            const [lo, hi] = xRangeAt(y);
            if (left < lo - 1.25 || right > hi + 1.25) {
              inkOverflow = true;
              inkDetail = { y, left, right, lo, hi, overL: lo - left, overR: right - hi };
              break;
            }
          }
          if (inkOverflow) break;
        }
      }
    } finally {
      clone.remove();
    }

    // Fan-out: later lines should tend to be wider than early ones (long text).
    let fansOut = null;
    if (lineWidths.length >= 3) {
      const first = lineWidths.slice(0, Math.ceil(lineWidths.length / 3));
      const last = lineWidths.slice(-Math.ceil(lineWidths.length / 3));
      const avg = (arr) => arr.reduce((s, x) => s + x.w, 0) / arr.length;
      fansOut = avg(last) > avg(first) * 1.05;
    }

    const wordAwareCss =
      cs.wordBreak === 'normal' &&
      cs.overflowWrap === 'normal' &&
      cs.hyphens === 'auto';

    return {
      ok: true,
      text,
      frame: document.getElementById('play-stage')?.dataset.frame || null,
      boxW,
      boxH,
      fontSize: cs.fontSize,
      textAlign: cs.textAlign,
      wordBreak: cs.wordBreak,
      overflowWrap: cs.overflowWrap,
      hyphens: cs.hyphens,
      lang: copy.lang || copy.getAttribute('lang'),
      wrapOverflow: fake.style.overflow,
      clipPath: fake.style.clipPath,
      shapeCount: shapes.length,
      shapeOutside: shapes.map((s) => s.style.shapeOutside),
      lineCount: lineWidths.length,
      lineWidths,
      fansOut,
      insideBounds: !inkOverflow,
      inkOverflow,
      inkDetail,
      midWordBreaks,
      shortWordLetterSplit,
      wordAwareCss,
    };
  });

  const full = `${OUT}/fake-text-${tag}.png`;
  const closeup = `${OUT}/fake-text-${tag}-closeup.png`;
  await page.screenshot({ path: full, fullPage: false });

  const stage = page.locator('#play-stage');
  const box = await stage.boundingBox();
  if (box) {
    await page.screenshot({
      path: closeup,
      clip: {
        x: Math.max(0, box.x - 20),
        y: Math.max(0, box.y - 20),
        width: Math.min(500, box.width + 40),
        height: Math.min(420, box.height + 40),
      },
    });
  }

  const desk = await page.evaluate(
    () => document.getElementById('play-fortune')?.textContent || '',
  );

  return { tag, fortuneText, metrics, full, closeup, desk };
}

const results = {};
let demoUrl = '';
const deskByFrame = {};

for (const pick of FRAME_PICKS) {
  demoUrl = await gotoFresh(pick.review);
  await reachLand(pick.n1, pick.n2);

  const landed = await page.evaluate(() => window.__play?.cb?.currentFrame);
  const shortR = await measureAndShot(`${pick.label}-short`, SHORT);
  const longR = await measureAndShot(`${pick.label}-long`, LONG);
  deskByFrame[pick.frame] = shortR.desk;

  results[pick.frame] = {
    label: pick.label,
    expectedFrame: pick.frame,
    landedFrame: landed,
    short: shortR,
    long: longR,
    pass: {
      landedOk: landed === pick.frame,
      shortInside: Boolean(shortR.metrics.insideBounds),
      longInside: Boolean(longR.metrics.insideBounds),
      shortWordAware: Boolean(shortR.metrics.wordAwareCss),
      longWordAware: Boolean(longR.metrics.wordAwareCss),
      shortNoLetterSplit: shortR.metrics.shortWordLetterSplit === false,
      longHasShapes: shortR.metrics.shapeCount === 2 && longR.metrics.shapeCount === 2,
      longFansOut: longR.metrics.fansOut === true,
      clipIsPolygon: String(longR.metrics.clipPath || '').startsWith('polygon'),
      deskUnchanged: shortR.desk === longR.desk && shortR.desk.length > 0,
      boxIsTriangleAABB:
        Math.abs((shortR.metrics.boxW || 0) - 178.381) < 1 &&
        Math.abs((shortR.metrics.boxH || 0) - 130.251) < 1,
    },
  };
}

const report = {
  url: demoUrl.replace(/&t=\d+/, ''),
  cache: CACHE,
  results,
  logs,
};

const allPass = Object.values(results).every((r) => Object.values(r.pass).every(Boolean));
writeFileSync(`${OUT}/fake-text-fit-verify.json`, JSON.stringify(report, null, 2));
await browser.close();

console.log(JSON.stringify(report, null, 2));
process.exit(allPass ? 0 : 1);
