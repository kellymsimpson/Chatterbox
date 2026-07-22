import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const DEMO = '408c846b-8fad-46e1-a5fb-d54021cb38b7';
const BASE = 'http://127.0.0.1:8877/screens/play.html';
const OUT = '/Users/kellysimpson/Downloads/chatterbox-handoff/sandbox/stage6-demo';

mkdirSync(OUT, { recursive: true });

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

const url = `${BASE}?id=${DEMO}&review=V34&v=s35`;
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('.fortune-flap:not([disabled])', { timeout: 15000 });

await page.click('.fortune-flap[data-number="1"]');
await page.waitForFunction(() => window.__play?.stage === 5, null, { timeout: 30000 });
await page.waitForSelector('.fortune-flap:not([disabled])', { timeout: 10000 });

await page.click('.fortune-flap[data-number="1"]');
await page.waitForFunction(() => window.__play?.stage === 6, null, { timeout: 10000 });
await page.waitForSelector('#play-fortune.is-visible', { timeout: 20000 });
await page.waitForSelector('.play-actions.is-visible', { timeout: 5000 });
await page.waitForSelector('.reveal-fake-text', { timeout: 5000 });

const result = await page.evaluate(() => {
  const play = window.__play;
  const fortune = document.getElementById('play-fortune');
  const fake = document.querySelector('.reveal-fake-text');
  const copy = document.querySelector('.reveal-fake-text-copy');
  const stage = document.getElementById('play-stage');
  const fills = [...stage.querySelectorAll('[data-flap]')].map((el) => ({
    flap: el.getAttribute('data-flap'),
    face: el.getAttribute('data-face'),
    fill: el.querySelector('path')?.getAttribute('fill'),
  }));
  const boxW = fake ? parseFloat(fake.style.width) : null;
  const boxH = fake ? parseFloat(fake.style.height) : null;
  const scrollH = copy ? copy.scrollHeight : null;
  return {
    stage: play.stage,
    selectedNumber2: play.selectedNumber2,
    frame: stage.dataset.frame || play.cb?.currentFrame,
    deskFortune: fortune?.textContent || '',
    deskVisible: fortune?.classList.contains('is-visible'),
    fakeText: copy?.textContent || '',
    fakeFontSize: copy ? getComputedStyle(copy).fontSize : null,
    boxW,
    boxH,
    scrollH,
    fillRatio: boxH && scrollH ? scrollH / boxH : null,
    fakeTransform: fake?.style.transform || '',
    hasMatrix3d: Boolean(fake?.style.transform?.startsWith('matrix3d')),
    fills,
    stickers: stage.querySelectorAll('.reveal-frame-stickers img[src]').length,
    unionInPaper: false,
  };
});

const fullShot = `${OUT}/fake-text-reveal.png`;
await page.screenshot({ path: fullShot, fullPage: false });

const stage = page.locator('#play-stage');
const box = await stage.boundingBox();
const closeup = `${OUT}/fake-text-flap-closeup.png`;
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

await browser.close();
console.log(JSON.stringify({ url, result, logs, fullShot, closeup }, null, 2));
