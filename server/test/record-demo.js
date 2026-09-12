import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const VIDEOS_DIR = path.resolve('./videos_recordings');
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function sendChat(page, text) {
  const inputSelector = 'input[type="text"]';
  await page.click(inputSelector);
  await page.fill(inputSelector, '');
  await page.type(inputSelector, text, { delay: 40 });
  await sleep(300);
  await page.press(inputSelector, 'Enter');
}

async function recordDemo() {
  console.log('🎥 Starting SwapChat Product Demo Recording with Google Chrome...');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: VIDEOS_DIR,
      size: { width: 1440, height: 900 }
    }
  });

  const page = await context.newPage();
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await sleep(2500);

  // 1. Scene 1: Balance inquiry
  console.log('Scene 1: Checking wallet balances via NLP...');
  await sendChat(page, 'What is my current balance?');
  await sleep(3500);

  // 2. Scene 2: Live Uniswap V2 Market Price Inquiry
  console.log('Scene 2: Checking live Uniswap V2 exchange rate...');
  await sendChat(page, 'What is the price of ETH in USDC?');
  await sleep(3500);

  // 3. Scene 3: Multi-turn intent resolution (missing amount -> follow up)
  console.log('Scene 3: Multi-turn intent resolution...');
  await sendChat(page, 'swap ETH for USDC');
  await sleep(2500);

  // Follow-up with amount
  console.log('Follow-up amount: 0.005 ETH...');
  await sendChat(page, '0.005');
  await sleep(4000);

  // 4. Scene 4: One-click On-Chain Swap Execution
  console.log('Scene 4: Executing confirmed swap on Sepolia...');
  const confirmButton = page.locator('button:has-text("Confirm & Swap")').first();
  await confirmButton.waitFor({ state: 'visible', timeout: 10000 });
  await sleep(1000);
  await confirmButton.click();
  
  console.log('Waiting for on-chain trade confirmation...');
  // Wait until either confirmed receipt or execution status appears
  const receiptCard = page.locator('text=Receipt ID:').first();
  try {
    await receiptCard.waitFor({ state: 'visible', timeout: 25000 });
    console.log('Receipt received on UI!');
  } catch {
    console.log('Proceeding after execution wait...');
  }
  await sleep(3000);

  // 5. Scene 5: Session Memory & Transaction History (The feature we just fixed!)
  console.log('Scene 5: Inquiring about last executed transaction...');
  await sendChat(page, 'what was my last transaction');
  await sleep(4000);

  // 6. Scene 6: Inspecting Session Receipts Table
  console.log('Scene 6: Inspecting Session Receipts table...');
  await page.evaluate(() => {
    window.scrollBy({ top: 350, behavior: 'smooth' });
  });
  await sleep(3000);

  // Scroll back to top
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  await sleep(2500);

  console.log('Finalizing recording...');
  const videoPath = await page.video().path();
  await page.close();
  await context.close();
  await browser.close();

  console.log('Raw video recorded at:', videoPath);

  // Convert with ffmpeg for pristine MP4 output
  const outputMp4 = path.resolve('../swapchat_product_demo.mp4');
  const artifactDir = '/Users/anushka/.gemini/antigravity-ide/brain/f62c7e17-5685-4089-a82b-1dccaad2ab15';
  const artifactMp4 = path.join(artifactDir, 'swapchat_product_demo.mp4');
  
  console.log('Encoding with ffmpeg to high-quality MP4...');
  execSync(`ffmpeg -y -i "${videoPath}" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p "${outputMp4}"`);
  fs.copyFileSync(outputMp4, artifactMp4);

  console.log('✅ Demo video successfully generated at:');
  console.log('1.', outputMp4);
  console.log('2.', artifactMp4);
}

recordDemo().catch((err) => {
  console.error('Error recording demo:', err);
  process.exit(1);
});
