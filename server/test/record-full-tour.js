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

async function typeHuman(page, selector, text, delay = 35) {
  await page.click(selector);
  await page.fill(selector, '');
  await page.type(selector, text, { delay });
  await sleep(400);
}

async function sendChat(page, text) {
  const inputSelector = 'input[placeholder*="Swap 0.05 ETH"]';
  await typeHuman(page, inputSelector, text, 40);
  await page.press(inputSelector, 'Enter');
}

async function recordFullTourDemo() {
  console.log('🎥 Starting Comprehensive SwapChat Product Demo (2-4 min showcase)...');

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
  await sleep(4000);

  // ==========================================
  // SECTION 1: Brand & Top Header Controls & Metrics
  // ==========================================
  console.log('=== Section 1: Header, Burner Wallet & Top Metrics ===');
  
  // Refresh on-chain balances button
  const refreshBtn = page.locator('button[title="Refresh On-Chain Balances"]').first();
  if (await refreshBtn.isVisible()) {
    console.log('Interacting with Refresh balances button in Header...');
    await refreshBtn.hover();
    await sleep(1000);
    await refreshBtn.click();
    await sleep(2500);
  }

  // Copy Burner Wallet Address button in Header
  const copyHeaderBtn = page.locator('header button[title="Copy Burner Address"]').first();
  if (await copyHeaderBtn.isVisible()) {
    console.log('Copying burner wallet address from Header...');
    await copyHeaderBtn.hover();
    await sleep(1000);
    await copyHeaderBtn.click();
    await sleep(2000);
  }

  // Header quick search prompt input
  const headerSearchInput = page.locator('header input[placeholder*="Type prompt"]').first();
  if (await headerSearchInput.isVisible()) {
    console.log('Demonstrating Top Header Quick Prompt Bar...');
    await headerSearchInput.click();
    await typeHuman(page, 'header input[placeholder*="Type prompt"]', 'What tokens are supported?', 40);
    await sleep(1200);
    await headerSearchInput.press('Enter');
    await sleep(5000);
  }

  // Hover over top Metric Cards
  console.log('Showcasing Real-Time Metric Cards (Session Trades, Gas Reserves, Router)...');
  const metricCards = page.locator('.grid.grid-cols-1.md\\:grid-cols-3 > div');
  const cardCount = await metricCards.count();
  for (let i = 0; i < cardCount; i++) {
    await metricCards.nth(i).hover();
    await sleep(2000);
  }

  // ==========================================
  // SECTION 2: Conversational Starter Chips & Balance Inquiry
  // ==========================================
  console.log('=== Section 2: Conversational Starter Chips & Balance Check ===');
  
  // Ask wallet balances in main chat
  console.log('Prompt: "What is my current balance?"');
  await sendChat(page, 'What is my current balance?');
  await sleep(5000);

  // Ask live Uniswap V2 exchange rate
  console.log('Prompt: "What is the price of ETH in USDC?"');
  await sendChat(page, 'What is the price of ETH in USDC?');
  await sleep(5000);

  // Ask live exchange rate for LINK
  console.log('Prompt: "How much USDC for 10 LINK?"');
  await sendChat(page, 'How much USDC for 10 LINK?');
  await sleep(5000);

  // ==========================================
  // SECTION 3: Multi-turn Trade Resolution & Slippage Simulation Quote
  // ==========================================
  console.log('=== Section 3: Multi-turn Trade Intent Resolution ===');
  
  // Turn 1: Incomplete trade intent
  console.log('Prompt Turn 1: "swap ETH for USDC"');
  await sendChat(page, 'swap ETH for USDC');
  await sleep(4000);

  // Turn 2: Follow-up amount
  console.log('Prompt Turn 2: "0.005"');
  await sendChat(page, '0.005');
  await sleep(6000);

  // Inspect the generated trade proposal card
  console.log('Inspecting Proposal Card details (Route, Expected, Slippage, Gas, Expiry)...');
  const proposalCard = page.locator('text=Trade Proposal').last();
  if (await proposalCard.isVisible()) {
    await proposalCard.hover();
    await sleep(2500);

    // If price impact checkbox exists, check it
    const impactCheckbox = proposalCard.locator('input[type="checkbox"]');
    if (await impactCheckbox.isVisible()) {
      await impactCheckbox.check();
      await sleep(1000);
    }
  }

  // Click "Confirm & Swap"
  console.log('Clicking "Confirm & Swap" to execute on Sepolia Uniswap V2 router...');
  const confirmSwapBtn = page.locator('button:has-text("Confirm & Swap")').last();
  if (await confirmSwapBtn.isVisible()) {
    await confirmSwapBtn.hover();
    await sleep(1200);
    await confirmSwapBtn.click();
  }
  
  console.log('Executing swap on-chain & awaiting block confirmation receipt...');
  const receiptFound = page.locator('text=Receipt ID:').last();
  try {
    await receiptFound.waitFor({ state: 'visible', timeout: 25000 });
    console.log('Trade confirmed! Trade Receipt Card is rendered.');
  } catch {
    console.log('Proceeding after execution window...');
  }
  await sleep(5000);

  // ==========================================
  // SECTION 4: Session Memory & Transaction History (Fixed Feature Showcase)
  // ==========================================
  console.log('=== Section 4: Natural Language History & Memory Lookup ===');
  
  // Query 1: Last transaction inquiry (exact phrase user tested)
  console.log('Prompt: "what was my last transaction"');
  await sendChat(page, 'what was my last transaction');
  await sleep(6000);

  // Query 2: All transaction history inquiry
  console.log('Prompt: "show my transaction history"');
  await sendChat(page, 'show my transaction history');
  await sleep(6000);

  // ==========================================
  // SECTION 5: Session Trade Receipts Table & Search Filtering
  // ==========================================
  console.log('=== Section 5: Session Trade Receipts Table & Search ===');
  
  // Smooth scroll down to table
  await page.evaluate(() => {
    window.scrollBy({ top: 450, behavior: 'smooth' });
  });
  await sleep(4000);

  // Search filter in receipts table
  const tableSearchInput = page.locator('input[placeholder*="Search receipts"]').first();
  if (await tableSearchInput.isVisible()) {
    console.log('Testing live receipts table search filter: "ETH"...');
    await tableSearchInput.click();
    await typeHuman(page, 'input[placeholder*="Search receipts"]', 'ETH', 60);
    await sleep(3500);

    console.log('Testing live receipts table search filter: "USDC"...');
    await typeHuman(page, 'input[placeholder*="Search receipts"]', 'USDC', 60);
    await sleep(3500);

    // Clear search filter
    await tableSearchInput.fill('');
    await sleep(2500);
  }

  // ==========================================
  // SECTION 6: Sidebar & Tab Views (Trade Receipts & Token Balances)
  // ==========================================
  console.log('=== Section 6: Tab Navigation & Modals ===');
  
  // Scroll back to top
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  await sleep(3000);

  // Tab 2: Trade Receipts Full Tab View
  console.log('Switching to "Trade Receipts" Workspace View...');
  const receiptsTabBtn = page.locator('aside button:has-text("Trade Receipts")').first();
  if (await receiptsTabBtn.isVisible()) {
    await receiptsTabBtn.hover();
    await sleep(1500);
    await receiptsTabBtn.click();
    await sleep(5000);
  }

  // Tab 3: Token Balances Tab View
  console.log('Switching to "Token Balances" Workspace View...');
  const tokensTabBtn = page.locator('aside button:has-text("Token Balances")').first();
  if (await tokensTabBtn.isVisible()) {
    await tokensTabBtn.hover();
    await sleep(1500);
    await tokensTabBtn.click();
    await sleep(5000);
  }

  // Click Refresh Balances on Token Reserves view
  const refreshTokensBtn = page.locator('button:has-text("Refresh Balances")').first();
  if (await refreshTokensBtn.isVisible()) {
    console.log('Clicking Refresh Balances in Token Reserves View...');
    await refreshTokensBtn.hover();
    await sleep(1200);
    await refreshTokensBtn.click();
    await sleep(3500);
  }

  // Hover token reserve cards
  const tokenCards = page.locator('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3 > div');
  const tokenCount = await tokenCards.count();
  for (let i = 0; i < Math.min(tokenCount, 4); i++) {
    await tokenCards.nth(i).hover();
    await sleep(1800);
  }

  // ==========================================
  // SECTION 7: Sidebar Burner Wallet Controls & External Links
  // ==========================================
  console.log('=== Section 7: Sidebar Burner Wallet & Faucet Features ===');
  
  // Switch back to Trading Terminal
  console.log('Switching back to Trading Terminal via Sidebar...');
  const sidebarTerminalBtn = page.locator('aside button:has-text("Trading Terminal")').first();
  if (await sidebarTerminalBtn.isVisible()) {
    await sidebarTerminalBtn.hover();
    await sleep(1200);
    await sidebarTerminalBtn.click();
    await sleep(4000);
  }

  // Copy address in sidebar
  const sidebarCopyBtn = page.locator('aside button[title="Copy Address"]').first();
  if (await sidebarCopyBtn.isVisible()) {
    console.log('Testing Sidebar Burner Wallet Address Copy...');
    await sidebarCopyBtn.hover();
    await sleep(1200);
    await sidebarCopyBtn.click();
    await sleep(2500);
  }

  // Hover View on Etherscan and Get Sepolia ETH in sidebar
  const etherscanLink = page.locator('aside a:has-text("View on Etherscan")').first();
  if (await etherscanLink.isVisible()) {
    await etherscanLink.hover();
    await sleep(2000);
  }

  const faucetLink = page.locator('aside a:has-text("Get Sepolia ETH")').first();
  if (await faucetLink.isVisible()) {
    await faucetLink.hover();
    await sleep(2000);
  }

  // ==========================================
  // SECTION 8: Clear Chat & Final Smooth Wrap-up
  // ==========================================
  console.log('=== Section 8: Clear Chat & Final Showcase ===');
  const clearChatBtn = page.locator('button[title="Clear Chat History"]').first();
  if (await clearChatBtn.isVisible()) {
    console.log('Hovering Clear Chat button in Terminal...');
    await clearChatBtn.hover();
    await sleep(2000);
  }

  // Final smooth overview scroll
  console.log('Final smooth showcase overview...');
  await page.evaluate(() => {
    window.scrollTo({ top: 150, behavior: 'smooth' });
  });
  await sleep(4000);

  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  await sleep(5000);

  console.log('Closing browser and finalizing full recording...');
  const videoPath = await page.video().path();
  await page.close();
  await context.close();
  await browser.close();

  console.log('Raw webm video recorded at:', videoPath);

  // Convert to high-definition MP4 using ffmpeg
  const outputMp4 = path.resolve('../swapchat_product_demo.mp4');
  const artifactDir = '/Users/anushka/.gemini/antigravity-ide/brain/f62c7e17-5685-4089-a82b-1dccaad2ab15';
  const artifactMp4 = path.join(artifactDir, 'swapchat_product_demo.mp4');
  
  console.log('Encoding high-quality MP4 with ffmpeg (1080p profile)...');
  execSync(`ffmpeg -y -i "${videoPath}" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p "${outputMp4}"`);
  fs.copyFileSync(outputMp4, artifactMp4);

  // Generate updated GIF preview
  const gifOutput = path.resolve('../swapchat_demo_preview.gif');
  console.log('Generating GIF preview...');
  execSync(`ffmpeg -y -i "${outputMp4}" -ss 00:00:20 -t 25 -vf "fps=10,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" "${gifOutput}"`);

  console.log('✅ Full Comprehensive Demo Video Successfully Generated at:');
  console.log('1.', outputMp4);
  console.log('2.', artifactMp4);
  console.log('3.', gifOutput);
}

recordFullTourDemo().catch((err) => {
  console.error('Error recording full tour demo:', err);
  process.exit(1);
});
