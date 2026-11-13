/* global process */
import puppeteer from 'puppeteer';

const loginEmail = process.env.TEST_LOGIN_EMAIL;
const loginPassword = process.env.TEST_LOGIN_PASSWORD;
if (!loginEmail || !loginPassword) {
  console.log('TEST_LOGIN_EMAIL과 TEST_LOGIN_PASSWORD를 별도로 설정한 경우에만 로그인 검사를 실행합니다.');
  process.exit(0);
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://consultantapp.vercel.app/');
    
    // Wait for the login form
    await page.waitForSelector('input[type="email"]');
    
    // Type credentials
    await page.type('input[type="email"]', loginEmail);
    await page.type('input[type="password"]', loginPassword);
    
    // Monitor network requests to see if PB returns 400
    page.on('response', async (response) => {
      if (response.url().includes('auth-with-password')) {
        console.log('Auth response status:', response.status());
        // Authentication response bodies may contain session tokens; never log them.
      }
    });

    // Click login
    await page.click('button[type="submit"]');
    
    // Wait a bit
    await new Promise(r => setTimeout(r, 3000));
    
    // Check if error message is displayed
    const errorMsg = await page.$('.error-message');
    if (errorMsg) {
      const text = await page.evaluate(el => el.textContent, errorMsg);
      console.log('UI Error Message:', text);
    } else {
      console.log('No error message, login might have succeeded or is still loading.');
    }
  } catch (err) {
    console.error('Script error:', err);
  } finally {
    await browser.close();
  }
})();
