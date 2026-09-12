import { chromium } from 'playwright';

async function testLaunch() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  const title = await page.title();
  console.log('Successfully launched Chrome with title:', title);
  await browser.close();
}

testLaunch().catch(console.error);
