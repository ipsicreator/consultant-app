const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const puppeteer = require('puppeteer');
const PocketBase = require('pocketbase/cjs');

const BASE = 'http://127.0.0.1:4173/';
const API = 'http://127.0.0.1:8090';
const EMAIL = 'chrisklee69@gmail.com';
const PASSWORD = 'aussie1996@@@';
const ACADEMY = 'suprema_main';
const outDir = path.join(__dirname, 'public', 'qa_zoom_captures');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function seedData() {
  const pb = new PocketBase(API);
  await pb.admins.authWithPassword(EMAIL, PASSWORD);

  const student = await pb.collection('students').create({
    name: `검수학생_${Date.now().toString().slice(-6)}`,
    school: '대치고등학교',
    grade: '2',
    enrollment_status: '미등록',
    academy_id: ACADEMY
  });

  const content = {
    analysis_summary: '실제 입력 데이터 기반 분석: 탐구 주제 확장 가능성이 높고 서술형 보완이 필요합니다.',
    grades: [
      { subject: '국어', score: '2', note: '독해 강점 유지' },
      { subject: '수학', score: '3', note: '서술형 정확도 보완' },
      { subject: '영어', score: '2', note: '안정적 관리 가능' }
    ],
    notes: '4주 실행 계획 추천'
  };

  await pb.collection('pdf_analyses').create({
    student_id: student.id,
    content
  });

  return { studentName: student.name };
}

(async () => {
  const { studentName } = await seedData();

  const auth = JSON.parse(fs.readFileSync(path.join(__dirname, 'pb_admin_auth.json'), 'utf8').replace(/^\uFEFF/, ''));
  const browser = await chromium.launch({
    headless: true,
    executablePath: puppeteer.executablePath(),
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu']
  });

  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.evaluate((a) => localStorage.setItem('pocketbase_auth', JSON.stringify(a)), auth);
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(1400);

    // Zoom up for readability
    await page.evaluate(() => {
      document.body.style.zoom = '1.2';
    });
    await sleep(700);

    // 1) Dashboard with identifiable menu
    await page.screenshot({ path: path.join(outDir, '01_dashboard_menu_identified.png'), fullPage: true });

    // 2) Open student modal and capture
    await page.click('.dashboard-header .btn-primary').catch(()=>{});
    await sleep(900);
    await page.screenshot({ path: path.join(outDir, '02_input_modal_zoom.png'), fullPage: true });

    // close modal if open
    await page.keyboard.press('Escape').catch(()=>{});
    await sleep(500);

    // 3) Find seeded student row and open detail
    const row = page.locator('tr', { hasText: studentName }).first();
    if (await row.count() > 0) {
      const actionBtn = row.locator('.action-btn').first();
      await actionBtn.click().catch(()=>{});
      await sleep(1800);
    } else {
      // fallback first row
      await page.locator('.action-btn').first().click().catch(()=>{});
      await sleep(1800);
    }

    // 4) Detail result visible (actual values)
    await page.screenshot({ path: path.join(outDir, '03_result_detail_actual_values.png'), fullPage: true });

    // 5) Focused crop main result panel for readability
    const report = page.locator('.report-section').first();
    if (await report.count() > 0) {
      await report.screenshot({ path: path.join(outDir, '04_result_panel_zoom.png') });
    }

    // 6) History tab capture
    const histBtn = page.getByRole('button', { name: /이력/ }).first();
    if (await histBtn.count() > 0) {
      await histBtn.click().catch(()=>{});
      await sleep(900);
    }
    await page.screenshot({ path: path.join(outDir, '05_result_history_zoom.png'), fullPage: true });

    // Back dashboard via sidebar first menu
    const nav = page.locator('.sidebar-nav li');
    if (await nav.count() > 0) {
      await nav.nth(0).click().catch(()=>{});
      await sleep(1000);
    }

    // 7) Exploration menu identified
    if (await nav.count() > 2) {
      await nav.nth(2).click().catch(()=>{});
      await sleep(1100);
      await page.screenshot({ path: path.join(outDir, '06_exploration_menu_identified.png'), fullPage: true });
    }

    // 8) Admin menu identified
    if (await nav.count() > 4) {
      await nav.nth(4).click().catch(()=>{});
      await sleep(1100);
      await page.screenshot({ path: path.join(outDir, '07_admin_menu_identified.png'), fullPage: true });
    }

    // 9) Settings/library menu identified
    const footer = page.locator('.sidebar-footer li');
    if (await footer.count() > 0) {
      await footer.nth(0).click().catch(()=>{});
      await sleep(1100);
      const settingsMenu = page.locator('.settings-menu li');
      if (await settingsMenu.count() > 2) {
        await settingsMenu.nth(2).click().catch(()=>{});
        await sleep(900);
      }
      await page.screenshot({ path: path.join(outDir, '08_settings_library_identified.png'), fullPage: true });
    }

    fs.writeFileSync(path.join(outDir, 'capture_meta.txt'), `student_name=${studentName}\nzoom=1.2\n`, 'utf8');
    const files = fs.readdirSync(outDir).filter(f => f.endsWith('.png')).length;
    console.log(JSON.stringify({ outDir, files, studentName }, null, 2));
  } catch (e) {
    fs.writeFileSync(path.join(outDir, 'capture_error.txt'), String(e.stack || e), 'utf8');
    console.error(e);
    process.exit(1);
  } finally {
    await context.close();
    await browser.close();
  }
})();
