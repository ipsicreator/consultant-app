const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const BASE = 'http://127.0.0.1:4173/';
const outDir = path.join(__dirname, 'public', 'qa_captures_v3');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const auth = JSON.parse(fs.readFileSync(path.join(__dirname, 'pb_admin_auth.json'), 'utf8'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const errors = [];

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  page.on('pageerror', e => errors.push(`[pageerror] ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`[console] ${m.text()}`); });

  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Inject PocketBase auth and reload
    await page.evaluate((authObj) => {
      localStorage.setItem('pocketbase_auth', JSON.stringify(authObj));
    }, auth);
    await page.reload({ waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1800);

    const sidebar = await page.$('.sidebar');
    if (!sidebar) throw new Error('로그인 후 사이드바 미검출(인증 주입 실패)');

    await page.screenshot({ path: path.join(outDir, '01_dashboard.png'), fullPage: true });

    // 02 input modal
    await page.click('.dashboard-header .btn-primary').catch(()=>{});
    await sleep(1200);
    await page.screenshot({ path: path.join(outDir, '02_student_modal.png'), fullPage: true });

    // 03 input save
    const inputs = await page.$$('.modal-content input[type="text"]');
    if (inputs.length >= 2) {
      await inputs[0].type('촬영학생_' + Date.now().toString().slice(-4));
      await inputs[1].type('대치고등학교');
      await page.select('.modal-content select', '2').catch(()=>{});
      await page.click('.modal-content .btn-primary').catch(()=>{});
      await sleep(1600);
    }
    await page.screenshot({ path: path.join(outDir, '03_student_saved.png'), fullPage: true });

    // 04 result detail
    await page.click('.action-btn').catch(()=>{});
    await sleep(1800);
    await page.screenshot({ path: path.join(outDir, '04_student_detail_result.png'), fullPage: true });

    // 05 result history
    const btns = await page.$$('button');
    for (const b of btns) {
      const t = await page.evaluate(el => (el.textContent || '').trim(), b);
      if (t.includes('이력')) { await b.click().catch(()=>{}); break; }
    }
    await sleep(1200);
    await page.screenshot({ path: path.join(outDir, '05_result_history.png'), fullPage: true });

    // Back dashboard via sidebar first item
    const nav = await page.$$('.sidebar-nav li');
    if (nav[0]) { await nav[0].click(); await sleep(1200); }

    // 06 exploration
    const nav2 = await page.$$('.sidebar-nav li');
    if (nav2[2]) { await nav2[2].click(); await sleep(1400); }
    await page.screenshot({ path: path.join(outDir, '06_exploration.png'), fullPage: true });

    // 07 admin
    const nav3 = await page.$$('.sidebar-nav li');
    if (nav3[4]) { await nav3[4].click(); await sleep(1400); }
    await page.screenshot({ path: path.join(outDir, '07_admin.png'), fullPage: true });

    // 08 settings+library
    const foot = await page.$$('.sidebar-footer li');
    if (foot[0]) { await foot[0].click(); await sleep(1200); }
    const menus = await page.$$('.settings-menu li');
    if (menus[2]) { await menus[2].click(); await sleep(1200); }
    await page.screenshot({ path: path.join(outDir, '08_settings_library.png'), fullPage: true });

  } catch (e) {
    errors.push(`[fatal] ${e.message}`);
  } finally {
    await page.close().catch(()=>{});
    await browser.close().catch(()=>{});
  }

  fs.writeFileSync(path.join(outDir, 'qa_errors.txt'), errors.join('\n'), 'utf8');
  const files = fs.readdirSync(outDir).filter(f => f.endsWith('.png')).length;
  console.log(JSON.stringify({ outDir, files, errors: errors.length }, null, 2));
})();
