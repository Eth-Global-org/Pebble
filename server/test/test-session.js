import assert from 'assert';
import { parseUserIntent, getSessionTrades } from '../src/nlpService.js';
import { validateTradeIntent } from '../src/validationService.js';
import { simulateTrade } from '../src/simulationService.js';
import { storeProposal, executeTrade } from '../src/executionService.js';

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

  // Test 4: Verify session trade memory
  const sessionTrades = getSessionTrades(sessionId);
  assert.strictEqual(sessionTrades.length, 1);
  assert.strictEqual(sessionTrades[0].receiptId, execution.receipt.receiptId);
  console.log('  PASS: Session trade history records match');

  // Test 5: Turn 3 - Inquiry about past trade
  console.log('  Turn 3: User asks about past trade...');
  const turn3 = await parseUserIntent('What was my last trade?', sessionId);
  assert.strictEqual(turn3.isTrade, false);
  assert.ok(turn3.message.includes(execution.receipt.receiptId) || turn3.message.includes('ETH'));
  console.log('  PASS: Session memory answers past trade inquiry');

  console.log('Results: 4/4 session memory tests passed.');
  process.exit(0);
}

runSessionTests();
