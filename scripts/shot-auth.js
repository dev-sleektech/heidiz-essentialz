const { chromium } = require('playwright');
const SCR = 'C:/Users/HP/AppData/Local/Temp/claude/C--Users-HP/4ad0884d-f455-4f76-8956-8a177596a06e/scratchpad';

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 1000 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto('http://localhost:3300/account', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SCR}/account-signed-out.png` });

  await page.goto('http://localhost:3300/sign-up', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SCR}/sign-up-page.png` });

  await page.goto('http://localhost:3300/sign-in', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SCR}/sign-in-page.png` });

  console.log('ERRORS:', JSON.stringify(errors));
  await browser.close();
})();
