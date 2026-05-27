const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  const outDir = path.join(__dirname, 'public', 'qa_captures');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const errors = [];
  const notes = [];
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  page.on('console', (msg) => {
    const t = msg.type();
    const txt = msg.text();
    if (t === 'error' || t === 'warning') errors.push(`[console:${t}] ${txt}`);
  });
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));

  try {
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: path.join(outDir, '01_login.png'), fullPage: true });

    // login
    const emailSel = 'input[type="text"], input[type="email"]';
    const passSel = 'input[type="password"]';
    await page.waitForSelector(emailSel, { timeout: 10000 });
    await page.click(emailSel, { clickCount: 3 });
    await page.type(emailSel, 'chrisklee69@gmail.com');
    await page.click(passSel, { clickCount: 3 });
    await page.type(passSel, 'aussie1996@@@');

    const submitBtn = 'button[type="submit"], .login-btn';
    await Promise.all([
      page.click(submitBtn),
      page.waitForTimeout(2500),
    ]);

    await page.screenshot({ path: path.join(outDir, '02_after_login_dashboard.png'), fullPage: true });

    // Try creating student in dashboard modal
    const openModalBtn = '.btn-primary';
    const modalName = 'input[placeholder*="이름"], .modal-content input[type="text"]';
    const allTextInputs = await page.$$('.modal-content input[type="text"]');
    if (allTextInputs.length === 0) {
      await page.click(openModalBtn).catch(() => {});
      await page.waitForTimeout(1000);
    }

    const modalInputs = await page.$$('.modal-content input[type="text"]');
    if (modalInputs.length >= 2) {
      await modalInputs[0].type('박서준');
      await modalInputs[1].type('대치고등학교');
      const gradeSel = await page.$('.modal-content select');
      if (gradeSel) await page.select('.modal-content select', '2').catch(() => {});
      const saveBtn = await page.$('.modal-content .btn-primary');
      if (saveBtn) {
        await saveBtn.click();
        await page.waitForTimeout(1500);
      }
      notes.push('학생 입력 액션 수행 시도 완료');
    } else {
      notes.push('학생 입력 모달 필드 탐지 실패');
    }

    await page.screenshot({ path: path.join(outDir, '03_dashboard_after_student_action.png'), fullPage: true });

    // Move sidebar tabs
    const navItems = await page.$$('.sidebar-nav li');
    for (let i = 0; i < navItems.length; i++) {
      const list = await page.$$('.sidebar-nav li');
      if (!list[i]) continue;
      await list[i].click().catch(() => {});
      await page.waitForTimeout(1200);
      const fname = `0${4 + i}_view_${i + 1}.png`;
      await page.screenshot({ path: path.join(outDir, fname), fullPage: true });
    }

    // Settings/library specific capture
    const settingsLi = await page.$$('.sidebar-footer li');
    if (settingsLi[0]) {
      await settingsLi[0].click();
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(outDir, '10_settings_main.png'), fullPage: true });

      const menuItems = await page.$$('.settings-menu li');
      if (menuItems[2]) {
        await menuItems[2].click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(outDir, '11_library_view.png'), fullPage: true });
      }
    }

  } catch (e) {
    errors.push(`[fatal] ${e.message}`);
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(outDir, 'qa_console_errors.txt'), errors.join('\n'), 'utf8');
  fs.writeFileSync(path.join(outDir, 'qa_notes.txt'), notes.join('\n'), 'utf8');

  console.log(JSON.stringify({ outDir, errorCount: errors.length, noteCount: notes.length }, null, 2));
})();
