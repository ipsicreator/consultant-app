const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const puppeteer = require('puppeteer');
const ffmpegPath = require('ffmpeg-static');
const { spawnSync } = require('child_process');

const BASE = 'http://localhost:5173/';
const EMAIL = 'chrisklee69@gmail.com';
const PASSWORD = 'aussie1996@@@';

const outDir = path.join(__dirname, 'public', 'qa_realflow');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: outDir, size: { width: 1920, height: 1080 } },
  });

  const page = await context.newPage();
  const studentName = `실사용검수_${Date.now().toString().slice(-6)}`;

  try {
    // 1) 로그인
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
    await page.fill('input[type="text"], input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"], .login-btn');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, '01_login_dashboard.png') });

    // 2) 실제 학생 입력(모달)
    await page.click('.dashboard-header .btn-primary');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, '02_input_modal_open.png') });

    const modalInputs = await page.$$('.modal-content input[type="text"]');
    if (modalInputs.length >= 2) {
      await modalInputs[0].fill(studentName);
      await modalInputs[1].fill('대치고등학교');
      await page.selectOption('.modal-content select', '2').catch(() => {});
      await page.click('.modal-content .btn-primary');
      await page.waitForTimeout(1800);
    }
    await page.screenshot({ path: path.join(outDir, '03_input_saved_list.png') });

    // 3) 결과 화면 진입
    const rowBtn = page.locator('tr', { hasText: studentName }).locator('.action-btn').first();
    if (await rowBtn.count()) {
      await rowBtn.click().catch(() => {});
    } else {
      await page.locator('.action-btn').first().click().catch(() => {});
    }
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(outDir, '04_result_screen.png') });

    // 4) 메뉴별 핵심 화면
    const nav = page.locator('.sidebar-nav li');
    if (await nav.count() > 2) {
      await nav.nth(2).click().catch(() => {});
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(outDir, '05_exploration.png') });
    }
    if (await nav.count() > 3) {
      await nav.nth(3).click().catch(() => {});
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(outDir, '06_planner.png') });
    }
    if (await nav.count() > 4) {
      await nav.nth(4).click().catch(() => {});
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(outDir, '07_admin.png') });
    }

    const foot = page.locator('.sidebar-footer li');
    if (await foot.count() > 0) {
      await foot.nth(0).click().catch(() => {});
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(outDir, '08_settings.png') });
    }

    fs.writeFileSync(
      path.join(outDir, 'meta.txt'),
      `student_name=${studentName}\nbase=${BASE}\ncreated_at=${new Date().toISOString()}\n`,
      'utf8'
    );
  } finally {
    const video = page.video();
    await context.close();
    await browser.close();

    if (video) {
      const webmPath = await video.path();
      const mp4Path = path.join(outDir, 'full_flow_1920x1080.mp4');
      if (ffmpegPath && fs.existsSync(webmPath)) {
        spawnSync(
          ffmpegPath,
          ['-y', '-i', webmPath, '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4Path],
          { stdio: 'ignore' }
        );
      }
    }
  }
}

run()
  .then(() => {
    const files = fs.readdirSync(outDir).sort();
    console.log(JSON.stringify({ outDir, files }, null, 2));
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

