import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const DEMO = '408c846b-8fad-46e1-a5fb-d54021cb38b7';
const BASE = 'http://127.0.0.1:8877/screens/play.html';
mkdirSync('./sandbox/stage6-demo', { recursive: true });

async function runPath({ review, pick1, pick2, label }) {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const logs = [];
  page.on('console', (msg) => {
    const t = msg.text();
    if (t.includes('[play]')) logs.push(t);
  });
  page.on('pageerror', (err) => logs.push('PAGEERROR: ' + err.message));

  await page.goto(`${BASE}?id=${DEMO}&review=${review}&v=s29`, { waitUntil: 'networkidle' });
  await page.waitForSelector(`.fortune-flap[data-number="${pick1}"]:not([disabled])`, { timeout: 15000 });
  await page.click(`.fortune-flap[data-number="${pick1}"]`);
  await page.waitForFunction(() => window.__play?.stage === 5, null, { timeout: 30000 });
  await page.waitForSelector(`.fortune-flap[data-number="${pick2}"]:not([disabled])`, { timeout: 10000 });
  await page.click(`.fortune-flap[data-number="${pick2}"]`);
  await page.waitForSelector('#play-fortune.is-visible', { timeout: 20000 });
  await page.waitForSelector('.play-actions.is-visible', { timeout: 5000 });

  const result = await page.evaluate(() => {
    const play = window.__play;
    const fortune = document.getElementById('play-fortune');
    const stage = document.getElementById('play-stage');
    const fills = [...stage.querySelectorAll('[data-flap]')].map((el) => ({
      flap: el.getAttribute('data-flap'),
      face: el.getAttribute('data-face'),
      fill: el.querySelector('path')?.getAttribute('fill'),
    }));
    return {
      stage: play.stage,
      selectedNumber2: play.selectedNumber2,
      landAxisAfterCount: play.landAxis,
      frame: stage.dataset.frame || play.cb?.currentFrame,
      fortune: fortune?.textContent || '',
      fills,
      stickers: stage.querySelectorAll('.reveal-frame-stickers img[src]').length,
      actions: [...document.querySelectorAll('.play-action')].map((a) => a.textContent.trim()),
      recordFortune: play.record?.fortunes?.[String(play.selectedNumber2)] || null,
    };
  });
  const shot = `./sandbox/stage6-demo/${label}.png`;
  await page.screenshot({ path: shot });
  await browser.close();
  return { label, result, logs, shot };
}

const out = [];
for (const p of [
  // even Stage-3 pick → land V36 for Stage 5 V reveal
  { review: 'V36', pick1: 4, pick2: 8, label: 'V-8-even-90' },
  { review: 'V36', pick1: 4, pick2: 3, label: 'V-3-odd-m90' },
]) {
  try {
    out.push(await runPath(p));
    console.log('OK', p.label);
  } catch (e) {
    console.error('FAIL', p.label, e.message);
    out.push({ label: p.label, error: e.message });
  }
}
console.log(JSON.stringify(out, null, 2));
