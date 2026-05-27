const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const puppeteer = require('puppeteer');

const BASE = 'http://127.0.0.1:4173/';
const outDir = path.join(__dirname, 'public', 'live_feed');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const authPath = path.join(__dirname, 'pb_admin_auth.json');
const auth = JSON.parse(fs.readFileSync(authPath, 'utf8').replace(/^\uFEFF/, ''));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: puppeteer.executablePath(),
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu']
  });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate((a) => localStorage.setItem('pocketbase_auth', JSON.stringify(a)), auth);
  await page.reload({ waitUntil: 'networkidle' });

  let idx = 1;
  while (idx <= 300) { // about 10-15 minutes
    const t = new Date();
    const stamp = `${t.getHours().toString().padStart(2,'0')}${t.getMinutes().toString().padStart(2,'0')}${t.getSeconds().toString().padStart(2,'0')}`;
    const file = path.join(outDir, `live_${idx.toString().padStart(4,'0')}_${stamp}.png`);
    await page.screenshot({ path: file });

    // overwrite latest pointer image for easy viewing
    const latest = path.join(outDir, 'live_latest.png');
    fs.copyFileSync(file, latest);

    idx++;
    await sleep(2500);
  }

  await context.close();
  await browser.close();
})();
