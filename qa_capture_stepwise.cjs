const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const BASE = 'http://127.0.0.1:5173/';
const EMAIL = 'chrisklee69@gmail.com';
const PASSWORD = 'aussie1996@@@';
const outDir = path.join(__dirname, 'public', 'qa_captures');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const errors = [];

async function launch() {
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
}

async function login(page) {
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('input[type="text"], input[type="email"]', { timeout: 15000 });
  const emailSel = 'input[type="text"], input[type="email"]';
  const passSel = 'input[type="password"]';

  await page.click(emailSel, { clickCount: 3 });
  await page.type(emailSel, EMAIL);
  await page.click(passSel, { clickCount: 3 });
  await page.type(passSel, PASSWORD);
  await page.click('button[type="submit"], .login-btn');
  await page.waitForNetworkIdle({ idleTime: 500, timeout: 20000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2000));
}

async function runStep(fileName, action) {
  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  page.on('pageerror', (e) => errors.push(`[${fileName}] ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[${fileName}] console: ${m.text()}`);
  });

  try {
    await login(page);
    if (action) await action(page);
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(outDir, fileName), fullPage: false });
  } catch (e) {
    errors.push(`[${fileName}] ${e.message}`);
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

(async () => {
  const stamp = Date.now().toString().slice(-6);

  await runStep('01_dashboard_menu_16x9.png', null);

  await runStep('02_data_input_modal_16x9.png', async (page) => {
    await page.click('.dashboard-header .btn-primary').catch(() => {});
    await new Promise((r) => setTimeout(r, 1200));
  });

  await runStep('03_data_input_saved_16x9.png', async (page) => {
    await page.click('.dashboard-header .btn-primary').catch(() => {});
    await new Promise((r) => setTimeout(r, 800));
    const inputs = await page.$$('.modal-content input[type="text"]');
    if (inputs.length >= 2) {
      await inputs[0].type(`실데이터학생_${stamp}`);
      await inputs[1].type('대치고등학교');
      await page.select('.modal-content select', '2').catch(() => {});
      await page.click('.modal-content .btn-primary').catch(() => {});
      await new Promise((r) => setTimeout(r, 1500));
    }
  });

  await runStep('04_result_screen_16x9.png', async (page) => {
    await page.click('.action-btn').catch(() => {});
    await new Promise((r) => setTimeout(r, 1500));
  });

  await runStep('05_exploration_menu_16x9.png', async (page) => {
    const items = await page.$$('.sidebar-nav li');
    if (items[2]) await items[2].click();
    await new Promise((r) => setTimeout(r, 1200));
  });

  await runStep('06_planner_menu_16x9.png', async (page) => {
    const items = await page.$$('.sidebar-nav li');
    if (items[3]) await items[3].click();
    await new Promise((r) => setTimeout(r, 1200));
  });

  await runStep('07_admin_menu_16x9.png', async (page) => {
    const items = await page.$$('.sidebar-nav li');
    if (items[4]) await items[4].click();
    await new Promise((r) => setTimeout(r, 1200));
  });

  await runStep('08_settings_menu_16x9.png', async (page) => {
    const items = await page.$$('.sidebar-footer li');
    if (items[0]) await items[0].click();
    await new Promise((r) => setTimeout(r, 1200));
  });

  fs.writeFileSync(path.join(outDir, 'meta.txt'), `generated_at=${new Date().toISOString()}\nbase=${BASE}\n`, 'utf8');
  fs.writeFileSync(path.join(outDir, 'qa_capture_errors.txt'), errors.join('\n'), 'utf8');
  console.log(JSON.stringify({ outDir, files: fs.readdirSync(outDir).filter((f) => f.endsWith('.png')).length, errors: errors.length }, null, 2));
})();

