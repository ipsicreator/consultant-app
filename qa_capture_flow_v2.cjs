const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const BASE = 'http://127.0.0.1:4173/';
const EMAIL = 'chrisklee69@gmail.com';
const PASSWORD = 'aussie1996@@@';
const outDir = path.join(__dirname, 'public', 'qa_captures_v2');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const errors = [];

async function startPage() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  page.on('pageerror', e => errors.push(`[pageerror] ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`[console] ${m.text()}`); });
  return { browser, page };
}

async function login(page) {
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('input[type="text"], input[type="email"]', { timeout: 10000 });
  const emailSel = 'input[type="text"], input[type="email"]';
  const passSel = 'input[type="password"]';
  await page.click(emailSel, { clickCount: 3 });
  await page.type(emailSel, EMAIL);
  await page.click(passSel, { clickCount: 3 });
  await page.type(passSel, PASSWORD);
  await page.click('button[type="submit"], .login-btn');
  await sleep(2500);
}

async function capture(name, action) {
  const { browser, page } = await startPage();
  try {
    await login(page);
    if (action) await action(page);
    await sleep(900);
    await page.screenshot({ path: path.join(outDir, name), fullPage: true });
  } catch (e) {
    errors.push(`[${name}] ${e.message}`);
  } finally {
    await page.close().catch(()=>{});
    await browser.close().catch(()=>{});
  }
}

(async () => {
  await capture('01_input_dashboard.png', null);

  await capture('02_input_modal.png', async (page) => {
    await page.click('.dashboard-header .btn-primary').catch(()=>{});
  });

  await capture('03_input_saved_list.png', async (page) => {
    await page.click('.dashboard-header .btn-primary').catch(()=>{});
    await sleep(700);
    const inputs = await page.$$('.modal-content input[type="text"]');
    if (inputs.length >= 2) {
      await inputs[0].type('촬영학생_' + Date.now().toString().slice(-4));
      await inputs[1].type('대치고등학교');
      await page.select('.modal-content select', '2').catch(()=>{});
      await page.click('.modal-content .btn-primary').catch(()=>{});
      await sleep(1600);
    }
  });

  await capture('04_result_student_detail.png', async (page) => {
    await page.click('.action-btn').catch(()=>{});
    await sleep(1800);
  });

  await capture('05_result_history.png', async (page) => {
    await page.click('.action-btn').catch(()=>{});
    await sleep(1500);
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const t = await page.evaluate(el => el.textContent || '', b);
      if (t.includes('이력')) { await b.click().catch(()=>{}); break; }
    }
    await sleep(1200);
  });

  await capture('06_analysis_exploration.png', async (page) => {
    const nav = await page.$$('.sidebar-nav li');
    if (nav[2]) await nav[2].click();
    await sleep(1400);
  });

  await capture('07_analysis_admin.png', async (page) => {
    const nav = await page.$$('.sidebar-nav li');
    if (nav[4]) await nav[4].click();
    await sleep(1400);
  });

  await capture('08_analysis_settings_library.png', async (page) => {
    const foot = await page.$$('.sidebar-footer li');
    if (foot[0]) await foot[0].click();
    await sleep(1200);
    const menus = await page.$$('.settings-menu li');
    if (menus[2]) await menus[2].click();
    await sleep(1200);
  });

  fs.writeFileSync(path.join(outDir, 'qa_errors.txt'), errors.join('\n'), 'utf8');
  const pngCount = fs.readdirSync(outDir).filter(f => f.endsWith('.png')).length;
  console.log(JSON.stringify({ outDir, pngCount, errors: errors.length }, null, 2));
})();
