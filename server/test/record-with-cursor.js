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

// Inject high-visibility glowing Mac cursor overlay into DOM
async function injectVirtualCursor(page) {
  await page.evaluate(() => {
    if (document.getElementById('virtual-cursor-overlay')) return;

    const cursorContainer = document.createElement('div');
    cursorContainer.id = 'virtual-cursor-overlay';
    cursorContainer.style.position = 'fixed';
    cursorContainer.style.top = '0px';
    cursorContainer.style.left = '0px';
    cursorContainer.style.width = '24px';
    cursorContainer.style.height = '24px';
    cursorContainer.style.pointerEvents = 'none';
    cursorContainer.style.zIndex = '999999';
    cursorContainer.style.transition = 'transform 0.08s ease-out';
    cursorContainer.style.transform = 'translate(100px, 100px)';

    // Modern macOS dark cursor SVG with drop shadow & click ripple
    cursorContainer.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.5));">
        <path d="M5.5 3.5L18.5 13.5L12.5 14.5L15.5 21L12.5 22.5L9.5 16L5.5 19.5V3.5Z" fill="#1E293B" stroke="#FFFFFF" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>
      <div id="cursor-click-ripple" style="position:absolute; top: -10px; left: -10px; width: 44px; height: 44px; border-radius: 50%; border: 3px solid #6366F1; opacity: 0; transform: scale(0.3); transition: all 0.35s cubic-bezier(0.1, 0.8, 0.2, 1); pointer-events: none;"></div>
    `;

    document.body.appendChild(cursorContainer);

    window.__moveCursor = (x, y) => {
      cursorContainer.style.transform = `translate(${x}px, ${y}px)`;
    };

    window.__clickCursor = () => {
      const ripple = document.getElementById('cursor-click-ripple');
      if (ripple) {
        ripple.style.transition = 'none';
        ripple.style.transform = 'scale(0.3)';
        ripple.style.opacity = '1';
        setTimeout(() => {
          ripple.style.transition = 'all 0.35s cubic-bezier(0.1, 0.8, 0.2, 1)';
          ripple.style.transform = 'scale(1.3)';
          ripple.style.opacity = '0';
        }, 20);
      }
    };
  });
}

// Smoothly interpolate cursor movement from current position to target element or coordinate
async function moveCursorSmooth(page, targetX, targetY, steps = 25) {
  const currentPos = await page.evaluate(() => {
    const el = document.getElementById('virtual-cursor-overlay');
    if (!el) return { x: 100, y: 100 };
    const transform = el.style.transform || '';
    const match = transform.match(/translate\(([\d.-]+)px,\s*([\d.-]+)px\)/);
    return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : { x: 100, y: 100 };
  });

  const startX = currentPos.x;
  const startY = currentPos.y;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    // Ease-in-out curve
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const x = startX + (targetX - startX) * ease;
    const y = startY + (targetY - startY) * ease;
    await page.evaluate(({ x, y }) => window.__moveCursor && window.__moveCursor(x, y), { x, y });
    await sleep(15);
  }
}

async function moveCursorToElement(page, locator) {
  const box = await locator.boundingBox();
  if (box) {
    const targetX = box.x + box.width / 2;
    const targetY = box.y + box.height / 2;
    await moveCursorSmooth(page, targetX, targetY);
  }
}

async function clickWithCursor(page, locator) {
  await moveCursorToElement(page, locator);
  await sleep(200);
  await page.evaluate(() => window.__clickCursor && window.__clickCursor());
  await locator.click();
  await sleep(400);
}

async function typeHumanWithCursor(page, selector, text, delay = 40) {
  const locator = page.locator(selector).first();
  await clickWithCursor(page, locator);
  await locator.fill('');
  for (const char of text) {
    await page.keyboard.type(char, { delay: delay + Math.random() * 20 });
  }
  await sleep(400);
}

async function sendChat(page, text) {
  const inputSelector = 'input[placeholder*="Swap 0.05 ETH"]';
  await typeHumanWithCursor(page, inputSelector, text, 40);
  await page.press(inputSelector, 'Enter');
  await page.evaluate(() => window.__clickCursor && window.__clickCursor());
}

async function recordFullTourDemoWithVisibleCursor() {
  console.log('🎥 Starting 3-Minute Product Demo Recording WITH Visible Mouse Cursor Overlay...');

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
  await sleep(1500);

  // Inject visible cursor overlay into the page
  await injectVirtualCursor(page);
  await moveCursorSmooth(page, 400, 300, 15);
  await sleep(3000);

  // ==========================================
  // SECTION 1: Brand & Top Header Controls & Metrics
  // ==========================================
  console.log('=== Section 1: Header, Burner Wallet & Top Metrics ===');
  
  // Refresh on-chain balances button
  const refreshBtn = page.locator('button[title="Refresh On-Chain Balances"]').first();
  if (await refreshBtn.isVisible()) {
    console.log('Moving cursor to Refresh button...');
    await clickWithCursor(page, refreshBtn);
    await sleep(2500);
  }

  // Copy Burner Wallet Address button in Header
  const copyHeaderBtn = page.locator('header button[title="Copy Burner Address"]').first();
  if (await copyHeaderBtn.isVisible()) {
    console.log('Moving cursor to Copy Burner Address button...');
    await clickWithCursor(page, copyHeaderBtn);
    await sleep(2000);
  }

  // Header quick search prompt input
  const headerSearchInput = page.locator('header input[placeholder*="Type prompt"]').first();
  if (await headerSearchInput.isVisible()) {
    console.log('Demonstrating Top Header Quick Prompt Bar...');
    await typeHumanWithCursor(page, 'header input[placeholder*="Type prompt"]', 'What tokens are supported?', 40);
    await sleep(1000);
    await headerSearchInput.press('Enter');
    await page.evaluate(() => window.__clickCursor && window.__clickCursor());
    await sleep(5000);
  }

  // Hover over top Metric Cards with visible cursor
  console.log('Moving cursor across Real-Time Metric Cards (Session Trades, Gas Reserves, Router)...');
  const metricCards = page.locator('.grid.grid-cols-1.md\\:grid-cols-3 > div');
  const cardCount = await metricCards.count();
  for (let i = 0; i < cardCount; i++) {
    await moveCursorToElement(page, metricCards.nth(i));
    await sleep(2000);
  }

  // ==========================================
  // SECTION 2: Conversational Balance Inquiry & Live Pricing
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

  // Inspect the generated trade proposal card with cursor
  console.log('Moving cursor over Trade Proposal Card details...');
  const proposalCard = page.locator('text=Trade Proposal').last();
  if (await proposalCard.isVisible()) {
    await moveCursorToElement(page, proposalCard);
    await sleep(2500);

    // If price impact checkbox exists, check it
    const impactCheckbox = proposalCard.locator('input[type="checkbox"]');
    if (await impactCheckbox.isVisible()) {
      await clickWithCursor(page, impactCheckbox);
      await sleep(1000);
    }
  }

  // Click "Confirm & Swap" with visible cursor
  console.log('Moving cursor to "Confirm & Swap" button and clicking...');
  const confirmSwapBtn = page.locator('button:has-text("Confirm & Swap")').last();
  if (await confirmSwapBtn.isVisible()) {
    await clickWithCursor(page, confirmSwapBtn);
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

  // Move cursor over the newly generated Trade Receipt Card
  const receiptCard = page.locator('text=Receipt ID:').last();
  if (await receiptCard.isVisible()) {
    await moveCursorToElement(page, receiptCard);
    await sleep(2500);
  }

  // ==========================================
  // SECTION 4: Session Memory & Transaction History (Fixed Feature Showcase)
  // ==========================================
  console.log('=== Section 4: Natural Language History & Memory Lookup ===');
  
  // Query 1: Last transaction inquiry
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
  await sleep(3500);

  // Search filter in receipts table with visible cursor
  const tableSearchInput = page.locator('input[placeholder*="Search receipts"]').first();
  if (await tableSearchInput.isVisible()) {
    console.log('Testing live receipts table search filter: "ETH"...');
    await typeHumanWithCursor(page, 'input[placeholder*="Search receipts"]', 'ETH', 60);
    await sleep(3500);

    console.log('Testing live receipts table search filter: "USDC"...');
    await typeHumanWithCursor(page, 'input[placeholder*="Search receipts"]', 'USDC', 60);
    await sleep(3500);

    // Clear search filter
    await tableSearchInput.fill('');
    await sleep(2000);
  }

  // ==========================================
  // SECTION 6: Sidebar & Tab Views (Trade Receipts & Token Balances)
  // ==========================================
  console.log('=== Section 6: Tab Navigation & Modals ===');
  
  // Scroll back to top
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  await sleep(2500);

  // Tab 2: Trade Receipts Full Tab View
  console.log('Switching to "Trade Receipts" Workspace View with cursor...');
  const receiptsTabBtn = page.locator('aside button:has-text("Trade Receipts")').first();
  if (await receiptsTabBtn.isVisible()) {
    await clickWithCursor(page, receiptsTabBtn);
    await sleep(5000);
  }

  // Tab 3: Token Balances Tab View
  console.log('Switching to "Token Balances" Workspace View with cursor...');
  const tokensTabBtn = page.locator('aside button:has-text("Token Balances")').first();
  if (await tokensTabBtn.isVisible()) {
    await clickWithCursor(page, tokensTabBtn);
    await sleep(5000);
  }

  // Click Refresh Balances on Token Reserves view
  const refreshTokensBtn = page.locator('button:has-text("Refresh Balances")').first();
  if (await refreshTokensBtn.isVisible()) {
    console.log('Clicking Refresh Balances in Token Reserves View...');
    await clickWithCursor(page, refreshTokensBtn);
    await sleep(3500);
  }

  // Hover token reserve cards with visible cursor
  const tokenCards = page.locator('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3 > div');
  const tokenCount = await tokenCards.count();
  for (let i = 0; i < Math.min(tokenCount, 4); i++) {
    await moveCursorToElement(page, tokenCards.nth(i));
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
    await clickWithCursor(page, sidebarTerminalBtn);
    await sleep(4000);
  }

  // Copy address in sidebar with visible cursor
  const sidebarCopyBtn = page.locator('aside button[title="Copy Address"]').first();
  if (await sidebarCopyBtn.isVisible()) {
    console.log('Testing Sidebar Burner Wallet Address Copy with cursor...');
    await clickWithCursor(page, sidebarCopyBtn);
    await sleep(2500);
  }

  // Hover View on Etherscan and Get Sepolia ETH in sidebar
  const etherscanLink = page.locator('aside a:has-text("View on Etherscan")').first();
  if (await etherscanLink.isVisible()) {
    await moveCursorToElement(page, etherscanLink);
    await sleep(2000);
  }

  const faucetLink = page.locator('aside a:has-text("Get Sepolia ETH")').first();
  if (await faucetLink.isVisible()) {
    await moveCursorToElement(page, faucetLink);
    await sleep(2000);
  }

  // ==========================================
  // SECTION 8: Clear Chat & Final Smooth Wrap-up
  // ==========================================
  console.log('=== Section 8: Clear Chat & Final Showcase ===');
  const clearChatBtn = page.locator('button[title="Clear Chat History"]').first();
  if (await clearChatBtn.isVisible()) {
    console.log('Moving cursor to Clear Chat button...');
    await moveCursorToElement(page, clearChatBtn);
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
  const outputMp4 = path.resolve('../swapchat_demo_with_cursor.mp4');
  const artifactDir = '/Users/anushka/.gemini/antigravity-ide/brain/f62c7e17-5685-4089-a82b-1dccaad2ab15';
  const artifactMp4 = path.join(artifactDir, 'swapchat_demo_with_cursor.mp4');
  
  console.log('Encoding high-quality MP4 with ffmpeg (1080p profile)...');
  execSync(`ffmpeg -y -i "${videoPath}" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p "${outputMp4}"`);
  fs.copyFileSync(outputMp4, artifactMp4);

  // Generate updated GIF preview
  const gifOutput = path.resolve('../swapchat_demo_preview.gif');
  console.log('Generating GIF preview...');
  execSync(`ffmpeg -y -i "${outputMp4}" -ss 00:00:20 -t 25 -vf "fps=10,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" "${gifOutput}"`);

  console.log('✅ Full Comprehensive Demo Video WITH CURSOR Successfully Generated at:');
  console.log('1.', outputMp4);
  console.log('2.', artifactMp4);
  console.log('3.', gifOutput);
}

recordFullTourDemoWithVisibleCursor().catch((err) => {
  console.error('Error recording full tour demo with cursor:', err);
  process.exit(1);
});
