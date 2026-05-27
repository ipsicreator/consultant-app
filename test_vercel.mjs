import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    // Navigate to Vercel app
    await page.goto('https://consultantapp.vercel.app/', { waitUntil: 'networkidle0' });
    
    // Type credentials
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'chrisklee69@gmail.com');
    await page.type('input[type="password"]', 'aussie1996@@@');
    
    // Monitor the network requests
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('auth-with-password') || url.includes('pocketbase') || url.includes('fly.dev')) {
        console.log(`Response from ${url}: Status ${response.status()}`);
        if (response.status() >= 400) {
           console.log(`Failed response text: ${await response.text()}`);
        }
      }
    });
    
    page.on('console', msg => {
      console.log('BROWSER LOG:', msg.text());
    });

    // Click login
    console.log('Clicking login...');
    await page.click('button[type="submit"]');
    
    // Wait for the UI error message or navigation
    await new Promise(r => setTimeout(r, 4000));
    
    const errorMsg = await page.$('.error-message');
    if (errorMsg) {
      const text = await page.evaluate(el => el.textContent, errorMsg);
      console.log('UI Error Message:', text);
    } else {
      console.log('No UI error message found. Login might have succeeded.');
      const currentUrl = page.url();
      console.log('Current URL after login:', currentUrl);
    }

  } catch (err) {
    console.error('Puppeteer script error:', err);
  } finally {
    await browser.close();
  }
})();
