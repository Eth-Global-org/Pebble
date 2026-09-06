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
import { logger, LogCategory, getLogs, clearLogs } from './logger.js';
import { getAllTransactions, getTransactionByReceiptId, clearDatabaseTransactions } from './db.js';

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
    logger.info(LogCategory.API, `POST /api/parse-intent: "${(message || '').slice(0, 50)}" (${sessionId || 'no-session'})`);
    
    const parsed = await parseUserIntent(message, sessionId);

    if (!parsed.isTrade) {
      logger.info(LogCategory.NLP, `Conversational response generated for: "${(message || '').slice(0, 40)}"`);
      return res.json({
        success: true,
        isTrade: false,
        message: parsed.message
      });
    }

    logger.info(LogCategory.NLP, `Trade intent parsed: ${parsed.intent.action} ${parsed.intent.amountIn} ${parsed.intent.tokenIn} for ${parsed.intent.tokenOut}`);

    // Run validation pipeline
    const validatedData = await validateTradeIntent(parsed.intent);

    // Run Uniswap V2 simulation & quote generation
    const proposal = await simulateTrade(validatedData);

    // Store proposal in memory with TTL for re-validation on confirm
    storeProposal(proposal);

    logger.info(LogCategory.SIMULATION, `Proposal created: ${proposal.proposalId.slice(0, 8)} | Expected: ~${proposal.estimatedAmountOutFormatted} ${proposal.tokenOut.symbol}`);

    return res.json({
      success: true,
      isTrade: true,
      intent: parsed.intent,
      proposal
    });
  } catch (error) {
    logger.warn(LogCategory.API, `Parse-intent failed: ${error.message}`);
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

    logger.info(LogCategory.EXECUTION, `POST /api/execute-trade: proposal ${proposalId.slice(0, 8)}... (${sessionId || 'no-session'})`);
    const executionResult = await executeTrade(proposalId, sessionId);
    logger.info(LogCategory.EXECUTION, `Trade executed: status=${executionResult.status}, txHash=${executionResult.txHash?.slice(0, 10)}...`);

    return res.json({
      success: true,
      execution: executionResult,
      receipt: executionResult.receipt || null
    });
  } catch (error) {
    logger.error(LogCategory.EXECUTION, `Trade execution error: ${error.message}`);
    return res.status(400).json(formatApiError(error));
  }
});

// API: Get session trade receipts (synced with SQLite)
app.get('/api/session/:sessionId/receipts', (req, res) => {
  const { sessionId } = req.params;
  const dbReceipts = getAllTransactions(100, sessionId);
  if (dbReceipts && dbReceipts.length > 0) {
    return res.json({ success: true, receipts: dbReceipts });
  }
  const receipts = getSessionTrades(sessionId);
  return res.json({ success: true, receipts });
});

// API: Get all recorded transactions from SQLite
app.get('/api/transactions', (req, res) => {
  const { limit, sessionId } = req.query;
  const parsedLimit = limit ? parseInt(limit, 10) : 100;
  const transactions = getAllTransactions(parsedLimit, sessionId || null);
  return res.json({ success: true, count: transactions.length, transactions });
});

// API: Get single transaction by receipt ID from SQLite
app.get('/api/transactions/:receiptId', (req, res) => {
  const { receiptId } = req.params;
  const transaction = getTransactionByReceiptId(receiptId);
  if (!transaction) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'TRANSACTION_NOT_FOUND',
        message: `Transaction with receipt ID ${receiptId} not found in database.`
      }
    });
  }
  return res.json({ success: true, transaction });
});

// API: Clear session history and recorded transactions
app.post('/api/session/:sessionId/clear', (req, res) => {
  const { sessionId } = req.params;
  clearSessionHistory(sessionId);
  clearDatabaseTransactions(sessionId);
  logger.info(LogCategory.API, `Session history reset: ${sessionId}`);
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

// API: System execution logs
app.get('/api/logs', (req, res) => {
  const { category, level, limit } = req.query;
  const parsedLimit = limit ? parseInt(limit, 10) : 100;
  const logs = getLogs({ category, level, limit: parsedLimit });
  return res.json({ success: true, count: logs.length, logs });
});

// API: Clear logs
app.delete('/api/logs', (req, res) => {
  clearLogs();
  return res.json({ success: true, message: 'System logs cleared.' });
});

export function startServer(port = CONFIG.port) {
  return app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

// Auto-start when executed directly
const isDirectRun = Boolean(process.argv[1] && (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('server.js')));
if (process.env.NODE_ENV !== 'test' && isDirectRun) {
  startServer();
}
