import assert from 'assert';
import { parseUserIntent, getSessionTrades } from '../src/nlpService.js';
import { validateTradeIntent } from '../src/validationService.js';
import { simulateTrade } from '../src/simulationService.js';
import { storeProposal, executeTrade } from '../src/executionService.js';
import { getTransactionByReceiptId } from '../src/db.js';

process.env.NODE_ENV = 'test';

async function runSessionTests() {
  console.log('Running session memory & receipts test suite...');
  const sessionId = 'test-session-' + Date.now();

  // Test 1: Turn 1 - Missing amount
  console.log('  Turn 1: User initiates incomplete swap...');
  const turn1 = await parseUserIntent('swap ETH for USDC', sessionId);
  assert.strictEqual(turn1.isTrade, true);
  assert.strictEqual(turn1.intent.amountIn, null);

  // Test 2: Turn 2 - Follow-up with just the amount
  console.log('  Turn 2: User clarifies amount...');
  const turn2 = await parseUserIntent('0.05', sessionId);
  assert.strictEqual(turn2.isTrade, true);
  assert.strictEqual(turn2.intent.tokenIn, 'ETH');
  assert.strictEqual(turn2.intent.tokenOut, 'USDC');
  assert.strictEqual(turn2.intent.amountIn, 0.05);
  console.log('  PASS: Multi-turn intent resolution');

  // Test 3: Simulation & Execution with receipt generation
  console.log('  Executing trade to generate receipt...');
  const validated = await validateTradeIntent(turn2.intent);
  const proposal = await simulateTrade(validated);
  storeProposal(proposal);

  const execution = await executeTrade(proposal.proposalId, sessionId);
  assert.strictEqual(execution.status, 'confirmed');
  assert.ok(execution.receipt);
  assert.ok(execution.receipt.receiptId.startsWith('REC-'));
  assert.strictEqual(execution.receipt.tokenIn, 'ETH');
  assert.strictEqual(execution.receipt.tokenOut, 'USDC');
  assert.strictEqual(execution.receipt.amountIn, '0.05');
  assert.ok(parseFloat(execution.receipt.amountOut) > 0);
  console.log('  PASS: On-chain trade receipt created:', execution.receipt.receiptId);

  // Test 4: Verify session trade memory & SQLite database persistence
  const sessionTrades = getSessionTrades(sessionId);
  assert.strictEqual(sessionTrades.length, 1);
  assert.strictEqual(sessionTrades[0].receiptId, execution.receipt.receiptId);
  
  const dbTx = getTransactionByReceiptId(execution.receipt.receiptId);
  assert.ok(dbTx, 'Transaction should exist in SQLite database');
  assert.strictEqual(dbTx.receiptId, execution.receipt.receiptId);
  assert.strictEqual(dbTx.tokenIn, 'ETH');
  assert.strictEqual(dbTx.tokenOut, 'USDC');
  assert.strictEqual(dbTx.status, 'Confirmed');
  console.log('  PASS: SQLite transaction persistence verified');

  // Test 5: Turn 3 - Inquiry about past trade
  console.log('  Turn 3: User asks about past trade...');
  const turn3 = await parseUserIntent('What was my last trade?', sessionId);
  assert.strictEqual(turn3.isTrade, false);
  assert.ok(turn3.message.includes(execution.receipt.receiptId) || turn3.message.includes('ETH'));
  console.log('  PASS: Session memory answers past trade inquiry');

  // Test 6: Turn 4 - Inquiry about last transaction (exact phrase from user prompt)
  console.log('  Turn 4: User asks "what was my last transaction"...');
  const turn4 = await parseUserIntent('what was my last transaction', sessionId);
  assert.strictEqual(turn4.isTrade, false);
  assert.ok(turn4.message.includes(execution.receipt.receiptId));
  assert.ok(turn4.message.includes('Sold:') || turn4.message.includes('ETH'));
  console.log('  PASS: Session memory answers "what was my last transaction"');

  // Test 7: Turn 5 - Inquiry with trailing question mark
  console.log('  Turn 5: User asks "what was my last transaction ?" ...');
  const turn5 = await parseUserIntent('what was my last transaction ?', sessionId);
  assert.strictEqual(turn5.isTrade, false);
  assert.ok(turn5.message.includes(execution.receipt.receiptId));
  console.log('  PASS: Session memory answers "what was my last transaction ?"');

  // Test 8: Turn 6 - Inquiry about transaction history / all transactions
  console.log('  Turn 6: User asks "transaction history"...');
  const turn6 = await parseUserIntent('transaction history', sessionId);
  assert.strictEqual(turn6.isTrade, false);
  assert.ok(turn6.message.includes(execution.receipt.receiptId));
  console.log('  PASS: Session memory answers "transaction history"');

  console.log('Results: 8/8 session memory tests passed.');
  process.exit(0);
}

runSessionTests();
