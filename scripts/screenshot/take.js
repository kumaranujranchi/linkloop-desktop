const puppeteer = require('puppeteer');

const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 800 }
  });
  const page = await browser.newPage();
  
  console.log('Navigating to login...');
  await page.goto('http://localhost:8000/index.html?auth=login');
  
  // Wait for login modal
  await page.waitForSelector('#loginEmail');
  
  console.log('Entering credentials...');
  await page.type('#loginEmail', 'anuj.esprit@gmail.com');
  await page.type('#loginPassword', 'Password123!');
  
  console.log('Submitting login...');
  await page.evaluate(() => {
    document.querySelector('#loginForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  });
  
  console.log('Waiting for dashboard...');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  
  await page.waitForSelector('#dashboardSubtitle', { timeout: 10000 });
  await delay(2000); // let data load

  console.log('Taking Dashboard screenshot...');
  await page.screenshot({ path: '../../assets/screenshot_dashboard.png' });
  
  console.log('Switching to Marketplace...');
  await page.click('a[data-page="marketplace"]');
  await delay(1000);
  await page.screenshot({ path: '../../assets/screenshot_marketplace.png' });
  
  console.log('Switching to Messages...');
  await page.click('a[data-page="messages"]');
  await delay(1000);
  await page.screenshot({ path: '../../assets/screenshot_messages.png' });
  
  console.log('Switching to Requests (Kanban)...');
  await page.click('a[data-page="exchange-requests"]');
  await delay(1000);
  await page.screenshot({ path: '../../assets/screenshot_requests.png' });
  
  console.log('Switching to Websites...');
  await page.click('a[data-page="websites"]');
  await delay(1000);
  await page.screenshot({ path: '../../assets/screenshot_websites.png' });

  console.log('Switching back to Dashboard and scrolling for Analytics...');
  await page.click('a[data-page="dashboard"]');
  await delay(500);
  await page.evaluate(() => {
    document.querySelector('.page-content').scrollBy(0, 500);
  });
  await delay(1000);
  await page.screenshot({ path: '../../assets/screenshot_analytics.png' });
  
  await browser.close();
  console.log('Done!');
})();
