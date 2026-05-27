const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const puppeteer = require('puppeteer');

const BASE = 'http://127.0.0.1:4173/';
const API = 'http://127.0.0.1:8090';
const EMAIL = 'chrisklee69@gmail.com';
const PASSWORD = 'aussie1996@@@';
const ACADEMY = 'suprema_main';
const outDir = path.join(__dirname, 'public', 'captures_16x9_realflow');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function adminAuth() {
  const r = await fetch(`${API}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: EMAIL, password: PASSWORD })
  });
  if (!r.ok) throw new Error(`admin auth failed: ${r.status}`);
  return r.json();
}

async function api(token, method, url, body) {
  const r = await fetch(`${API}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`${method} ${url} failed: ${r.status} ${txt}`);
  }
  return r.json();
}

async function seed(token, adminId) {
  // ensure profile for academy linkage
  const f = encodeURIComponent(`admin_id=\"${adminId}\"`);
  const profiles = await api(token, 'GET', `/api/collections/profiles/records?filter=${f}&perPage=1`);
  if (profiles.totalItems > 0) {
    await api(token, 'PATCH', `/api/collections/profiles/records/${profiles.items[0].id}`, {
      name: 'Chris Lee', full_name: 'Chris Lee', role: 'master', academy_id: ACADEMY, admin_id: adminId
    });
  } else {
    await api(token, 'POST', '/api/collections/profiles/records', {
      name: 'Chris Lee', full_name: 'Chris Lee', role: 'master', academy_id: ACADEMY, admin_id: adminId
    });
  }

  const studentName = `실검수_${Date.now().toString().slice(-6)}`;
  const student = await api(token, 'POST', '/api/collections/students/records', {
    name: studentName,
    school: '대치고등학교',
    grade: '2',
    enrollment_status: '미등록',
    academy_id: ACADEMY
  });

  await api(token, 'POST', '/api/collections/pdf_analyses/records', {
    student_id: student.id,
    content: {
      analysis_summary: '실제 입력 기반 결과: 탐구 주제 확장 가능성이 높고 서술형 보완이 필요합니다.',
      grades: [
        { subject: '국어', score: '2', note: '독해 강점' },
        { subject: '수학', score: '3', note: '서술형 보완 필요' },
        { subject: '영어', score: '2', note: '안정적 유지' }
      ],
      notes: '4주 실행 로드맵 추천'
    }
  });

  return { studentName };
}

(async () => {
  const auth = await adminAuth();
  const token = auth.token;
  const adminId = auth.admin.id;
  const { studentName } = await seed(token, adminId);

  const browser = await chromium.launch({
    headless: true,
    executablePath: puppeteer.executablePath(),
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu']
  });

  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.evaluate((a) => localStorage.setItem('pocketbase_auth', JSON.stringify(a)), { token, model: auth.admin });
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(1200);

    // 01 메뉴 식별 + 첫 화면
    await page.screenshot({ path: path.join(outDir, '01_dashboard_menu_16x9.png') });

    // 02 자료 입력 화면(모달 오픈)
    await page.click('.dashboard-header .btn-primary').catch(()=>{});
    await sleep(900);
    await page.screenshot({ path: path.join(outDir, '02_data_input_modal_16x9.png') });

    // 모달 닫기
    await page.keyboard.press('Escape').catch(()=>{});
    await sleep(400);

    // 03 실제 학생 행 선택 후 결과 화면 진입
    const row = page.locator('tr', { hasText: studentName }).first();
    if (await row.count() > 0) {
      await row.locator('.action-btn').first().click().catch(()=>{});
    } else {
      await page.locator('.action-btn').first().click().catch(()=>{});
    }
    await sleep(1700);
    await page.screenshot({ path: path.join(outDir, '03_result_screen_16x9.png') });

    // 04 결과값 확대(보고서 패널)
    const report = page.locator('.report-section').first();
    if (await report.count() > 0) {
      await report.screenshot({ path: path.join(outDir, '04_result_values_zoom.png') });
    }

    // 05 메뉴 식별: 탐구
    const nav = page.locator('.sidebar-nav li');
    if (await nav.count() > 2) {
      await nav.nth(2).click().catch(()=>{});
      await sleep(1000);
      await page.screenshot({ path: path.join(outDir, '05_exploration_menu_16x9.png') });
    }

    // 06 메뉴 식별: 관리자
    if (await nav.count() > 4) {
      await nav.nth(4).click().catch(()=>{});
      await sleep(1000);
      await page.screenshot({ path: path.join(outDir, '06_admin_menu_16x9.png') });
    }

    // 07 메뉴 식별: 설정
    const foot = page.locator('.sidebar-footer li');
    if (await foot.count() > 0) {
      await foot.nth(0).click().catch(()=>{});
      await sleep(1000);
      await page.screenshot({ path: path.join(outDir, '07_settings_menu_16x9.png') });
    }

    // 08 설정 내 라이브러리 화면
    const menus = page.locator('.settings-menu li');
    if (await menus.count() > 2) {
      await menus.nth(2).click().catch(()=>{});
      await sleep(1000);
      await page.screenshot({ path: path.join(outDir, '08_library_screen_16x9.png') });
    }

    fs.writeFileSync(path.join(outDir, 'meta.txt'), `student_name=${studentName}\nviewport=1920x1080\n`, 'utf8');
    const files = fs.readdirSync(outDir).filter(f => f.endsWith('.png'));
    console.log(JSON.stringify({ outDir, count: files.length, files }, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
})();
