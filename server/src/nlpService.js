import { CONFIG } from './config.js';
import { resolveToken } from './tokenWhitelist.js';

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

  // 1. Primary path: Use Gemini LLM with full multi-turn session memory
  if (CONFIG.geminiApiKey) {
    try {
      const geminiResult = await parseWithGemini(cleanPrompt, session);
      if (geminiResult) {
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
3. If the user's trade instruction is incomplete (missing amount or tokens), ask a helpful clarifying question with {"isTrade": false, "message": "question"}.
4. If the user wants to execute a trade, output:
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
5. For greetings, token inquiries, or market questions, respond with:
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
