const PocketBase = require('pocketbase');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function run() {
    const pb = new PocketBase('http://127.0.0.1:8090');
    const demoDir = path.join(__dirname, 'public', 'demo');
    if (!fs.existsSync(demoDir)) fs.mkdirSync(demoDir, { recursive: true });

    try {
        console.log("1. Setting up DB...");
        await pb.admins.authWithPassword('admin@admin.com', 'admin1234567890');
        
        // Ensure collections
        const collections = ['students', 'profiles', 'analysis_results', 'exploration_proposals'];
        for (const name of collections) {
            try { await pb.collections.create({ name, type: 'base' }); } catch(e) {}
        }

        // Seed data
        const user = await pb.collection('users').getFirstListItem('email="chrisklee69@gmail.com"').catch(async () => {
            return await pb.collection('users').create({ email: 'chrisklee69@gmail.com', password: 'aussie1996@@@', passwordConfirm: 'aussie1996@@@', emailVisibility: true });
        });

        await pb.collection('profiles').create({ user: user.id, academy_id: 'demo_123' }).catch(() => {});
        const student = await pb.collection('students').create({ name: '최우수', school: '대치고', grade: '2', enrollment_status: '미등록', academy_id: 'demo_123' });

        console.log("2. Capturing Screens...");
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // Login
        await page.goto('http://localhost:5173/');
        await page.type('input[type="email"], input[placeholder*="이메일"]', 'chrisklee69@gmail.com');
        await page.type('input[type="password"]', 'aussie1996@@@');
        await page.click('button[type="submit"], button:has-text("로그인")');
        await page.waitForNavigation();

        // Shots
        await page.screenshot({ path: path.join(demoDir, '01_Dashboard.png') });
        console.log("Dashboard captured.");

        await page.click('button:has-text("진입")');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(demoDir, '02_AI_Scan.png') });
        
        await page.click('button:has-text("탐구")');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(demoDir, '03_Exploration_Theme.png') });

        await browser.close();
        console.log("SUCCESS");
    } catch (e) {
        console.error("FAILED:", e.message);
    }
}

run();
