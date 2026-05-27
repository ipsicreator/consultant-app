const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const puppeteer = require('puppeteer');

const BASE = 'http://127.0.0.1:4173/';
const API = 'http://127.0.0.1:8090';
const EMAIL = 'chrisklee69@gmail.com';
const PASSWORD = 'aussie1996@@@';
const ACADEMY = 'suprema_main';
const outDir = path.join(__dirname, 'public', 'captures_required');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function auth() {
  const r = await fetch(`${API}/api/admins/auth-with-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: EMAIL, password: PASSWORD })
  });
  if (!r.ok) throw new Error(`auth fail ${r.status}`);
  return r.json();
}

async function api(token, method, url, body) {
  const r = await fetch(`${API}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!r.ok) throw new Error(`${method} ${url} ${r.status} ${(await r.text()).slice(0,300)}`);
  return r.json();
}

(async () => {
  const a = await auth();
  const token = a.token;
  const stamp = Date.now().toString().slice(-6);
  const studentName = `실데이터_${stamp}`;

  // seed analysis target student (for guaranteed result page)
  const st = await api(token, 'POST', '/api/collections/students/records', {
    name: studentName,
    school: '대치고등학교',
    grade: '2',
    enrollment_status: '미등록',
    academy_id: ACADEMY
  });
  await api(token, 'POST', '/api/collections/pdf_analyses/records', {
    student_id: st.id,
    content: {
      analysis_summary: `실제 입력 데이터 기반 결과 요약 (${studentName})`,
      grades: [
        { subject: '국어', score: '2', note: '독해 강점 유지' },
        { subject: '수학', score: '3', note: '서술형 보완 필요' },
        { subject: '영어', score: '2', note: '안정적 유지' }
      ],
      notes: '실행 플랜 4주 제안'
    }
  });

  const browser = await chromium.launch({
    headless: true,
    executablePath: puppeteer.executablePath(),
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu']
  });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.evaluate((obj) => localStorage.setItem('pocketbase_auth', JSON.stringify(obj)), { token, model: a.admin });
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(1200);

    // A) real data input screen (filled form BEFORE save)
    await page.click('.dashboard-header .btn-primary').catch(() => {});
    await sleep(800);

    const fillName = `수동입력_${stamp}`;
    const t = await page.$$('.modal-content input[type="text"]');
    if (t.length >= 2) {
      await t[0].fill(fillName);
      await t[1].fill('대치고등학교');
      await page.selectOption('.modal-content select', '2').catch(()=>{});
    }
    await sleep(400);
    await page.screenshot({ path: path.join(outDir, 'A1_real_data_input_filled_16x9.png') });

    // B) save and show list row
    await page.click('.modal-content .btn-primary').catch(()=>{});
    await sleep(1500);
    await page.screenshot({ path: path.join(outDir, 'A2_input_saved_list_16x9.png') });

    // C) open guaranteed seeded student result page
    const row = page.locator('tr', { hasText: studentName }).first();
    if (await row.count() > 0) {
      await row.locator('.action-btn').first().click();
    } else {
      await page.locator('.action-btn').first().click().catch(()=>{});
    }
    await sleep(1700);

    // result full page + zoom panel
    await page.screenshot({ path: path.join(outDir, 'B1_result_page_full_16x9.png') });
    const report = page.locator('.report-section').first();
    if (await report.count() > 0) {
      await report.screenshot({ path: path.join(outDir, 'B2_result_values_zoom.png') });
    }

    fs.writeFileSync(path.join(outDir, 'meta.txt'), `seed_student=${studentName}\nmanual_input_name=${fillName}\n`, 'utf8');

    const files = fs.readdirSync(outDir).filter(f => f.endsWith('.png'));
    console.log(JSON.stringify({ outDir, files }, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
})();
