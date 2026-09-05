import express from 'express';
import cors from 'cors';
import { CONFIG } from './config.js';
import { formatApiError } from './errors.js';
import { parseUserIntent, getSessionTrades, clearSessionHistory } from './nlpService.js';
import { validateTradeIntent } from './validationService.js';
import { simulateTrade } from './simulationService.js';
import { storeProposal, executeTrade, getExecutionStatus } from './executionService.js';
import { getWalletBalances } from './chain.js';
import { getAllWhitelistedTokens } from './tokenWhitelist.js';

const app = express();

app.use(cors());
app.use(express.json());

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', network: 'sepolia', timestamp: Date.now() });
});

// API: Supported tokens
app.get('/api/tokens', (req, res) => {
  res.json({
    success: true,
    tokens: getAllWhitelistedTokens(),
    routerAddress: CONFIG.uniswapV2RouterAddress,
    maxTradeSizeEth: CONFIG.maxTradeSizeEth
  });
});

// API: Burner wallet info and balances
app.get('/api/wallet-info', async (req, res) => {
  try {
    const info = await getWalletBalances();
    res.json({ success: true, wallet: info });
  } catch (error) {
    res.status(500).json(formatApiError(error));
  }
});

// API: Parse natural language intent, validate and simulate trade proposal
app.post('/api/parse-intent', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const parsed = await parseUserIntent(message, sessionId);

    if (!parsed.isTrade) {
      return res.json({
        success: true,
        isTrade: false,
        message: parsed.message
      });
    }

    // Run validation pipeline
    const validatedData = await validateTradeIntent(parsed.intent);

    // Run Uniswap V2 simulation & quote generation
    const proposal = await simulateTrade(validatedData);

    // Store proposal in memory with TTL for re-validation on confirm
    storeProposal(proposal);

    return res.json({
      success: true,
      isTrade: true,
      intent: parsed.intent,
      proposal
    });
  } catch (error) {
    return res.status(400).json(formatApiError(error));
  }
});

// API: Execute confirmed trade proposal
app.post('/api/execute-trade', async (req, res) => {
  try {
    const { proposalId, sessionId } = req.body;
    if (!proposalId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PROPOSAL_ID',
          message: 'Proposal ID is required to execute a trade.',
          recoverable: true
        }
      });
    }

    const executionResult = await executeTrade(proposalId, sessionId);
    return res.json({
      success: true,
      execution: executionResult,
      receipt: executionResult.receipt || null
    });
  } catch (error) {
    return res.status(400).json(formatApiError(error));
  }
});

// API: Get session trade receipts
app.get('/api/session/:sessionId/receipts', (req, res) => {
  const { sessionId } = req.params;
  const receipts = getSessionTrades(sessionId);
  return res.json({ success: true, receipts });
});

// API: Clear session history
app.post('/api/session/:sessionId/clear', (req, res) => {
  const { sessionId } = req.params;
  clearSessionHistory(sessionId);
  return res.json({ success: true, message: 'Session history cleared.' });
});

// API: Poll transaction execution status
app.get('/api/tx-status/:proposalId', (req, res) => {
  const { proposalId } = req.params;
  const status = getExecutionStatus(proposalId);

  if (!status) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'STATUS_NOT_FOUND',
        message: 'No active transaction found for this proposal ID.',
        recoverable: true
      }
    });
  }

  return res.json({ success: true, status });
});

export function startServer() {
  return app.listen(CONFIG.port, () => {
    console.log(`Server listening on port ${CONFIG.port}`);
  });
}

// Auto-start when executed directly
const isDirectRun = Boolean(process.argv[1] && (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('server.js')));
if (process.env.NODE_ENV !== 'test' && isDirectRun) {
  startServer();
}
