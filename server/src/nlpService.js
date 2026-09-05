import { CONFIG } from './config.js';
import { resolveToken } from './tokenWhitelist.js';
import { getWalletBalances } from './chain.js';
import { getLiveExchangeRate } from './simulationService.js';

// In-memory multi-turn session store
const sessionStore = new Map();

export function getOrCreateSession(sessionId) {
  const id = sessionId || 'default-session';
  if (!sessionStore.has(id)) {
    sessionStore.set(id, {
      sessionId: id,
      history: [], // [{ role: 'user' | 'model', text: string }]
      trades: [],  // [{ receiptId, tokenIn, tokenOut, amountIn, amountOut, ... }]
      pendingIntent: null
    });
  }
  return sessionStore.get(id);
}

export function recordSessionTrade(sessionId, receipt) {
  const session = getOrCreateSession(sessionId);
  session.trades.push(receipt);
  // Also record a confirmation message in the session history
  session.history.push({
    role: 'model',
    text: `Completed swap of ${receipt.amountIn} ${receipt.tokenIn} for ${receipt.amountOut} ${receipt.tokenOut}. Receipt ID: ${receipt.receiptId}. TxHash: ${receipt.txHash}`
  });
  session.pendingIntent = null;
}

export function getSessionTrades(sessionId) {
  const session = getOrCreateSession(sessionId);
  return session.trades;
}

export function clearSessionHistory(sessionId) {
  const session = getOrCreateSession(sessionId);
  session.history = [];
  session.pendingIntent = null;
}

export async function parseUserIntent(prompt, sessionId = null) {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return {
      isTrade: false,
      message: 'Please enter a trade instruction (e.g., "swap 0.1 ETH for USDC") or ask a question.'
    };
  }

  const cleanPrompt = prompt.trim();
  const session = getOrCreateSession(sessionId);

  // Handle balance inquiries directly with live on-chain balances
  const lower = cleanPrompt.toLowerCase();
  if (lower.includes('balence') || lower.includes('balance') || lower.includes('my funds') || lower.includes('my holdings') || lower.includes('how much eth do i have') || lower.includes('what do i have')) {
    try {
      const walletInfo = await getWalletBalances();
      const balanceLines = Object.values(walletInfo.balances)
        .map((b) => `• **${b.symbol}**: ${parseFloat(b.balance).toFixed(4)}`)
        .join('\n');
      const responseMsg = `**Your Burner Wallet Balances (Sepolia):**\nAddress: \`${walletInfo.address}\`\n\n${balanceLines}\n\n*Network: Sepolia Testnet*`;
      session.history.push({ role: 'user', text: cleanPrompt });
      session.history.push({ role: 'model', text: responseMsg });
      return {
        isTrade: false,
        message: responseMsg
      };
    } catch {
      // Fall through to LLM
    }
  }

  // Handle direct price inquiries and target amount requests (e.g. "get 1 eth for usdc", "price of eth")
  const priceCheckResult = await handlePriceAndExchangeInquiry(cleanPrompt, session);
  if (priceCheckResult) {
    return priceCheckResult;
  }

  // 1. Primary path: Use Gemini LLM with full multi-turn session memory
  if (CONFIG.geminiApiKey) {
    try {
      const geminiResult = await parseWithGemini(cleanPrompt, session);
      if (geminiResult) {
        // If Gemini erroneously responded with an unhelpful "not enough balance" refusal, provide the live exchange price instead
        if (!geminiResult.isTrade && geminiResult.message && (geminiResult.message.includes('not enough') || geminiResult.message.includes('significantly more') || geminiResult.message.includes('insufficient'))) {
          const livePriceFallback = await handlePriceAndExchangeInquiry(cleanPrompt, session);
          if (livePriceFallback) {
            return livePriceFallback;
          }
        }

        // Record in conversation history
        session.history.push({ role: 'user', text: cleanPrompt });
        if (geminiResult.isTrade) {
          session.history.push({
            role: 'model',
            text: `Trade proposal generated: swap ${geminiResult.intent.amountIn} ${geminiResult.intent.tokenIn} for ${geminiResult.intent.tokenOut}.`
          });
          session.pendingIntent = null;
        } else {
          session.history.push({ role: 'model', text: geminiResult.message });
        }
        return geminiResult;
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error(`NLP error: ${error.message}`);
      }
    }
  }

  // 2. Offline fallback path with basic session memory
  return parseWithRuleEngine(cleanPrompt, session);
}

async function handlePriceAndExchangeInquiry(cleanPrompt, session) {
  const lower = cleanPrompt.toLowerCase();

  // Pattern 1: Target amount queries like:
  // - "get 1 eth for usdc", "buy 1 eth with usdc"
  // - "swap usdc for 1 eth", "trade usdc for 1 eth"
  // - "how much usdc for 1 eth", "how much usdc to buy 1 eth"
  // - "buy 1 eth", "get 1 eth"
  let targetAmountOut = null;
  let tokenOut = null;
  let tokenIn = null;

  // 1a. "get 1 eth for usdc", "buy 1 eth with usdc"
  const targetMatchA = lower.match(/(?:get|buy|receive|purchase)\s+([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z]+)\s*(?:for|with|using|from)\s*([a-zA-Z]+)/i);
  // 1b. "swap usdc for 1 eth", "trade usdc for 1 eth", "exchange usdc for 1 eth"
  const targetMatchB = lower.match(/(?:swap|trade|exchange)\s+([a-zA-Z]+)\s+(?:for|to|into)\s+([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z]+)/i);
  // 1c. "how much usdc for 1 eth", "how much usdc to get 1 eth"
  const targetMatchC = lower.match(/how\s+much\s+([a-zA-Z]+)\s+(?:for|to get|to buy|needed for)\s+([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z]+)/i);
  // 1d. "buy 1 eth", "get 1 eth", "purchase 0.5 link"
  const targetMatchD = lower.match(/^(?:i\s+want\s+to\s+)?(?:buy|get|purchase|want)\s+([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z]+)$/i);

  if (targetMatchA) {
    targetAmountOut = parseFloat(targetMatchA[1]);
    tokenOut = resolveToken(targetMatchA[2]);
    tokenIn = resolveToken(targetMatchA[3]);
  } else if (targetMatchB) {
    tokenIn = resolveToken(targetMatchB[1]);
    targetAmountOut = parseFloat(targetMatchB[2]);
    tokenOut = resolveToken(targetMatchB[3]);
  } else if (targetMatchC) {
    tokenIn = resolveToken(targetMatchC[1]);
    targetAmountOut = parseFloat(targetMatchC[2]);
    tokenOut = resolveToken(targetMatchC[3]);
  } else if (targetMatchD) {
    targetAmountOut = parseFloat(targetMatchD[1]);
    tokenOut = resolveToken(targetMatchD[2]);
    if (tokenOut) {
      tokenIn = resolveToken(tokenOut.symbol === 'ETH' ? 'USDC' : 'ETH');
    }
  }

  if (tokenIn && tokenOut && tokenIn.symbol !== tokenOut.symbol && targetAmountOut > 0) {
    try {
      const rateInfo = await getLiveExchangeRate(tokenIn.symbol, tokenOut.symbol);
      if (rateInfo) {
        const rateBtoA = parseFloat(rateInfo.rateBtoA); // 1 tokenOut = X tokenIn
        const rateAtoB = parseFloat(rateInfo.rateAtoB); // 1 tokenIn = Y tokenOut
        const requiredIn = targetAmountOut * rateBtoA;

        const walletInfo = await getWalletBalances();
        const userBalanceObj = walletInfo.balances[tokenIn.symbol];
        const userBalance = userBalanceObj ? parseFloat(userBalanceObj.balance).toFixed(4) : '0.0000';
        const numericBalance = parseFloat(userBalance);

        if (numericBalance < requiredIn) {
          const userCanBuy = (numericBalance * rateAtoB).toFixed(4);
          const message = `**Uniswap V2 Live Exchange Price:**\n• **1 ${tokenOut.symbol} ≈ ${rateInfo.rateBtoA} ${tokenIn.symbol}** (1 ${tokenIn.symbol} ≈ ${rateInfo.rateAtoB} ${tokenOut.symbol})\n\n• To purchase **${targetAmountOut} ${tokenOut.symbol}**, you would need approximately **${requiredIn.toFixed(2)} ${tokenIn.symbol}**.\n• Your burner wallet currently holds **${userBalance} ${tokenIn.symbol}**, which can purchase approximately **${userCanBuy} ${tokenOut.symbol}**.\n\nWould you like to swap your **${userBalance} ${tokenIn.symbol}** for **~${userCanBuy} ${tokenOut.symbol}**? (Or enter an amount you'd like to trade)`;
          session.history.push({ role: 'user', text: cleanPrompt });
          session.history.push({ role: 'model', text: message });
          return { isTrade: false, message };
        } else {
          return {
            isTrade: true,
            intent: {
              action: 'swap',
              tokenIn: tokenIn.symbol,
              tokenOut: tokenOut.symbol,
              amountIn: parseFloat(requiredIn.toFixed(4)),
              network: 'sepolia',
              confidence: 'high'
            }
          };
        }
      }
    } catch {
      // Fall through
    }
  }

  // Pattern 2: General price and exchange rate inquiries
  // e.g. "price of eth in usdc", "how much is 1 eth in usdc", "exchange rate", "eth price"
  const isPriceQuery = lower.includes('price') || lower.includes('exchange rate') || lower.includes('rate of') || lower.includes('how much is') || lower.includes('how much does') || lower.includes('exchange price') || lower.includes('what is the rate');
  if (isPriceQuery) {
    const foundTokens = [];
    for (const token of Object.values(CONFIG.tokens)) {
      if (lower.includes(token.symbol.toLowerCase()) || lower.includes(token.name.toLowerCase())) {
        if (!foundTokens.includes(token.symbol)) {
          foundTokens.push(token.symbol);
        }
      }
    }

    if (foundTokens.length > 0) {
      let tokenA = foundTokens[0];
      let tokenB = foundTokens[1] || (tokenA === 'USDC' ? 'ETH' : 'USDC');
      if (tokenA === tokenB) {
        tokenB = tokenA === 'USDC' ? 'ETH' : 'USDC';
      }

      try {
        const rateInfo = await getLiveExchangeRate(tokenA, tokenB);
        if (rateInfo) {
          const message = `**Uniswap V2 Live Exchange Price:**\n• **1 ${tokenA} ≈ ${rateInfo.rateAtoB} ${tokenB}**\n• **1 ${tokenB} ≈ ${rateInfo.rateBtoA} ${tokenA}**\n\n*Network: Sepolia Testnet (Uniswap V2 Router)*`;
          session.history.push({ role: 'user', text: cleanPrompt });
          session.history.push({ role: 'model', text: message });
          return { isTrade: false, message };
        }
      } catch {
        // Fall through
      }
    }
  }

  return null;
}

function buildTradeHistoryContext(session) {
  if (!session?.trades?.length) {
    return 'No past trades executed yet in this session.';
  }

  return session.trades
    .slice(-5)
    .map(
      (t) =>
        `- Receipt ${t.receiptId}: Swapped ${t.amountIn} ${t.tokenIn} for ${t.amountOut} ${t.tokenOut} (tx: ${t.txHash.slice(0, 10)}..., time: ${new Date(t.timestamp).toLocaleTimeString()})`
    )
    .join('\n');
}

async function parseWithGemini(prompt, session) {
  if (!CONFIG.geminiApiKey) return null;

  try {
    const model = CONFIG.geminiModel || 'gemini-3-flash-preview';
    const tradeHistoryContext = buildTradeHistoryContext(session);

    const systemInstruction = `You are a DeFi trade assistant with session memory for a Sepolia testnet DEX bot.
Supported tokens: ETH, WETH, USDC, LINK, DAI.
Default network: sepolia.

Session Trade History:
${tradeHistoryContext}

Instructions:
1. Maintain context across conversation turns. If the user previously specified tokens and now provides an amount (or changes a parameter), combine previous turns into a complete trade intent.
2. If the user asks about their previous trades, past receipts, or what they traded, answer conversationally using the Session Trade History.
3. NEVER say 'not enough balance' or refuse a trade based on user balances. You are an intent parser, not an execution engine. Output the intent accurately.
4. When the user says "get 1 ETH for USDC" or "buy 1 ETH with USDC", this is a swap intent where tokenIn is "USDC" and tokenOut is "ETH".
5. If the user wants to execute a trade, output:
{
  "isTrade": true,
  "intent": {
    "action": "swap",
    "tokenIn": "token symbol sold/swapped from (e.g. ETH, USDC, LINK, DAI)",
    "tokenOut": "token symbol bought/swapped to (e.g. ETH, USDC, LINK, DAI)",
    "amountIn": numeric amount (e.g. 0.1) or null if unknown,
    "network": "sepolia",
    "confidence": "high" or "low"
  }
}
6. For greetings or general market questions, respond with:
{
  "isTrade": false,
  "message": "helpful response"
}
Return ONLY valid raw JSON matching one of the formats above.`;

    // Build multi-turn contents array with recent session history (last 6 turns)
    const contents = [];
    const recentHistory = (session?.history || []).slice(-6);

    for (const item of recentHistory) {
      contents.push({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.text }]
      });
    }

    // Append current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${CONFIG.geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (process.env.NODE_ENV !== 'test') {
        console.error(`Gemini API error (${response.status}): ${errData.error?.message || response.statusText}`);
      }
      return null;
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText) {
      const cleanJson = rawText.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error(`Gemini network error: ${err.message}`);
    }
    return null;
  }

  return null;
}

function parseWithRuleEngine(prompt, session) {
  const lower = prompt.toLowerCase();

  // Check for trade history inquiries in fallback mode
  if (lower.includes('last trade') || lower.includes('receipt') || lower.includes('trade history') || lower.includes('past trades')) {
    if (!session?.trades?.length) {
      return {
        isTrade: false,
        message: 'You have not executed any trades in this session yet.'
      };
    }
    const lastTrade = session.trades[session.trades.length - 1];
    return {
      isTrade: false,
      message: `Your last executed trade was **${lastTrade.amountIn} ${lastTrade.tokenIn}** for **${lastTrade.amountOut} ${lastTrade.tokenOut}**.\nReceipt ID: \`${lastTrade.receiptId}\`\nTx: [View on Etherscan](${lastTrade.explorerUrl})`
    };
  }

  // Network detection
  let network = 'sepolia';
  const networkMatch = lower.match(/on\s+(sepolia|mainnet|ethereum|polygon|arbitrum|optimism|base|bsc)/i);
  if (networkMatch) {
    network = networkMatch[1].toLowerCase();
    if (network === 'ethereum') network = 'mainnet';
  }

  // Check if prompt is a standalone number providing a missing amount for a pending intent
  const standaloneNumberMatch = lower.match(/^([0-9]+(?:\.[0-9]+)?)$/);
  if (standaloneNumberMatch && session?.pendingIntent) {
    const amountIn = parseFloat(standaloneNumberMatch[1]);
    const intent = {
      ...session.pendingIntent,
      amountIn,
      confidence: 'high'
    };
    session.pendingIntent = null;
    return { isTrade: true, intent };
  }

  // Conversational patterns
  if (lower.includes('token') || lower.includes('support') || lower.includes('whitelist')) {
    return {
      isTrade: false,
      message: `Supported tokens on Sepolia: **${Object.keys(CONFIG.tokens).join(', ')}**.\n\nTry instructions like:\n• "Swap 0.05 ETH for USDC"\n• "Trade 10 USDC for LINK"`
    };
  }

  if (lower.includes('how') || lower.includes('help')) {
    return {
      isTrade: false,
      message: `I turn natural language trade instructions into simulated and confirmed Sepolia DEX swaps with session memory and on-chain receipts.`
    };
  }

  if (lower.startsWith('hello') || lower.startsWith('hi') || lower.startsWith('hey')) {
    return {
      isTrade: false,
      message: 'Hello! I am your Sepolia DEX trading assistant. Enter a trade like **"swap 0.1 ETH for USDC"** or ask me about supported tokens.'
    };
  }

  const swapPattern = /(?:swap|trade|convert|exchange)\s+([0-9]*\.?[0-9]+)?\s*([a-zA-Z\s]+?)\s+(?:for|to|into|with)\s+([a-zA-Z\s]+)/i;
  const buyPattern = /buy\s+([0-9]*\.?[0-9]+)?\s*([a-zA-Z\s]+?)\s+(?:with|using|for)\s+([0-9]*\.?[0-9]+)?\s*([a-zA-Z\s]+)/i;
  const sellPattern = /sell\s+([0-9]*\.?[0-9]+)?\s*([a-zA-Z\s]+?)\s+(?:for|to|into)\s+([a-zA-Z\s]+)/i;

  let tokenIn = null;
  let tokenOut = null;
  let amountIn = null;

  const buyMatch = lower.match(buyPattern);
  if (buyMatch) {
    const firstAmount = buyMatch[1] ? parseFloat(buyMatch[1]) : null;
    const firstToken = buyMatch[2].trim();
    const secondAmount = buyMatch[3] ? parseFloat(buyMatch[3]) : null;
    const secondToken = buyMatch[4].trim();

    tokenOut = firstToken;
    tokenIn = secondToken;
    amountIn = secondAmount || firstAmount;
  } else {
    const swapMatch = lower.match(swapPattern);
    const sellMatch = lower.match(sellPattern);
    const targetMatch = swapMatch || sellMatch;

    if (targetMatch) {
      amountIn = targetMatch[1] ? parseFloat(targetMatch[1]) : null;
      tokenIn = targetMatch[2].trim();
      tokenOut = targetMatch[3].trim();
    }
  }

  if (tokenOut) {
    tokenOut = tokenOut.replace(/\s+on\s+[a-zA-Z]+$/i, '').trim();
  }

  if (tokenIn && tokenOut) {
    const resolvedIn = resolveToken(tokenIn)?.symbol || tokenIn.toUpperCase();
    const resolvedOut = resolveToken(tokenOut)?.symbol || tokenOut.toUpperCase();
    const intent = {
      action: 'swap',
      tokenIn: resolvedIn,
      tokenOut: resolvedOut,
      amountIn,
      network,
      confidence: amountIn !== null ? 'high' : 'low'
    };

    if (amountIn === null) {
      // Save pending intent so user can follow up with just the amount
      session.pendingIntent = intent;
    } else {
      session.pendingIntent = null;
    }

    return { isTrade: true, intent };
  }

  return {
    isTrade: false,
    message: `I could not understand that instruction. Try: **"swap 0.05 ETH for USDC"** or ask **"what tokens are supported?"**.`
  };
}
