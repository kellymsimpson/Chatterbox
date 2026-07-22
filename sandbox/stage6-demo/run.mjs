import { chromium } from 'playwright';

const DEMO = '408c846b-8fad-46e1-a5fb-d54021cb38b7';
const BASE = 'http://127.0.0.1:8877/screens/play.html';

async function runPath({ review, pick1, pick2, label }) {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const logs = [];
  page.on('console', (msg) => {
    const t = msg.text();
    if (t.includes('[play]') || t.includes('error') || t.includes('Error')) logs.push(t);
  });
  page.on('pageerror', (err) => logs.push('PAGEERROR: ' + err.message));

  const url = `${BASE}?id=${DEMO}&review=${review}&v=s29`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('.fortune-flap:not([disabled])', { timeout: 15000 });

  // Stage 3 pick
  await page.click(`.fortune-flap[data-number="${pick1}"]`);
  // Wait for count + stage 5
  await page.waitForFunction(() => window.__play?.stage === 5, null, { timeout: 30000 });
  await page.waitForSelector('.fortune-flap:not([disabled])', { timeout: 10000 });

  // Stage 5 pick → reveal
  await page.click(`.fortune-flap[data-number="${pick2}"]`);
  await page.waitForFunction(() => window.__play?.stage === 6, null, { timeout: 10000 });
  await page.waitForSelector('#play-fortune.is-visible', { timeout: 20000 });
  await page.waitForSelector('.play-actions.is-visible', { timeout: 5000 });

  const result = await page.evaluate(() => {
    const play = window.__play;
    const fortune = document.getElementById('play-fortune');
    const stage = document.getElementById('play-stage');
    const wrap = document.getElementById('play-stage-wrap');
    const fills = [...stage.querySelectorAll('[data-flap]')].map((el) => ({
      flap: el.getAttribute('data-flap'),
      face: el.getAttribute('data-face'),
      fill: el.querySelector('path')?.getAttribute('fill'),
    }));
    const stickers = stage.querySelectorAll('.reveal-frame-stickers img[src]').length;
    const actions = [...document.querySelectorAll('.play-action')].map((a) => a.textContent.trim());
    return {
      stage: play.stage,
      selectedNumber2: play.selectedNumber2,
      frame: stage.dataset.frame || play.cb?.currentFrame,
      wrapTransform: wrap.style.transform || '',
      fortune: fortune?.textContent || '',
      fortuneVisible: fortune?.classList.contains('is-visible'),
      fills,
      stickers,
      actions,
      recordFortune: play.record?.fortunes?.[String(play.selectedNumber2)] || null,
    };
  });

  const shot = `/Users/kellysimpson/Downloads/chatterbox-handoff/sandbox/stage6-demo/${label}.png`;
  await page.screenshot({ path: shot, fullPage: false });
  await browser.close();
  return { label, url, result, logs, shot };
}

import { mkdirSync } from 'fs';
mkdirSync('/Users/kellysimpson/Downloads/chatterbox-handoff/sandbox/stage6-demo', { recursive: true });

const paths = [
  { review: 'V34', pick1: 1, pick2: 1, label: 'H-1-odd' },
  { review: 'V34', pick1: 1, pick2: 6, label: 'H-6-even-180' },
  { review: 'V36', pick1: 3, pick2: 8, label: 'V-8-even-90' },
  { review: 'V36', pick1: 3, pick2: 3, label: 'V-3-odd-m90' },
];

const out = [];
for (const p of paths) {
  try {
    out.push(await runPath(p));
    console.log('OK', p.label);
  } catch (e) {
    console.error('FAIL', p.label, e.message);
    out.push({ label: p.label, error: e.message });
  }
}
console.log(JSON.stringify(out, null, 2));
