import assert from 'assert';
import { parseUserIntent } from '../src/nlpService.js';
import { validateTradeIntent } from '../src/validationService.js';
import { simulateTrade } from '../src/simulationService.js';
import { storeProposal, executeTrade } from '../src/executionService.js';
import { ErrorCode } from '../src/errors.js';

process.env.NODE_ENV = 'test';

async function runTests() {
  console.log('Running validation tests...');
  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  FAIL: ${name}`);
      console.error(`    Error: ${err.message}`);
      if (err.code) console.error(`    Code: ${err.code}`);
    }
  }

  // 1. NLP Conversational detection
  await test('Conversational query: "What tokens do you support?"', async () => {
    const res = await parseUserIntent('What tokens do you support?');
    assert.strictEqual(res.isTrade, false);
    assert.ok(res.message.includes('Supported tokens'));
  });

  await test('Conversational query: "Hello there"', async () => {
    const res = await parseUserIntent('Hello there');
    assert.strictEqual(res.isTrade, false);
    assert.ok(res.message.includes('Sepolia DEX'));
  });

  // 2. Valid trade parsing
  await test('Parse trade: "swap 0.05 ETH for USDC"', async () => {
    const res = await parseUserIntent('swap 0.05 ETH for USDC');
    assert.strictEqual(res.isTrade, true);
    assert.strictEqual(res.intent.tokenIn.toUpperCase(), 'ETH');
    assert.strictEqual(res.intent.tokenOut.toUpperCase(), 'USDC');
    assert.strictEqual(res.intent.amountIn, 0.05);
    assert.strictEqual(res.intent.network, 'sepolia');
  });

  // 3. Validation: Missing amount
  await test('Validation: Missing amount throws MISSING_AMOUNT', async () => {
    const parsed = await parseUserIntent('swap ETH for USDC');
    assert.strictEqual(parsed.isTrade, true);
    try {
      await validateTradeIntent(parsed.intent);
      assert.fail('Should have thrown MISSING_AMOUNT');
    } catch (err) {
      assert.strictEqual(err.code, ErrorCode.MISSING_AMOUNT);
    }
  });

  // 4. Validation: Unknown token
  await test('Validation: Unknown token throws UNKNOWN_TOKEN', async () => {
    const parsed = await parseUserIntent('swap 10 DOGE for ETH');
    assert.strictEqual(parsed.isTrade, true);
    try {
      await validateTradeIntent(parsed.intent);
      assert.fail('Should have thrown UNKNOWN_TOKEN');
    } catch (err) {
      assert.strictEqual(err.code, ErrorCode.UNKNOWN_TOKEN);
    }
  });

  // 5. Validation: Same token pair
  await test('Validation: Same token pair throws INVALID_PAIR', async () => {
    const parsed = await parseUserIntent('swap 0.1 ETH for ETH');
    assert.strictEqual(parsed.isTrade, true);
    try {
      await validateTradeIntent(parsed.intent);
      assert.fail('Should have thrown INVALID_PAIR');
    } catch (err) {
      assert.strictEqual(err.code, ErrorCode.INVALID_PAIR);
    }
  });

  // 6. Validation: Unsupported network
  await test('Validation: Unsupported network throws UNSUPPORTED_NETWORK', async () => {
    const parsed = await parseUserIntent('swap 0.1 ETH for USDC on Polygon');
    assert.strictEqual(parsed.isTrade, true);
    try {
      await validateTradeIntent(parsed.intent);
      assert.fail('Should have thrown UNSUPPORTED_NETWORK');
    } catch (err) {
      assert.strictEqual(err.code, ErrorCode.UNSUPPORTED_NETWORK);
    }
  });

  // 7. Validation: Exceeds max trade size
  await test('Validation: Exceeds max limit throws AMOUNT_EXCEEDS_LIMIT', async () => {
    const parsed = await parseUserIntent('swap 50 ETH for USDC');
    assert.strictEqual(parsed.isTrade, true);
    try {
      await validateTradeIntent(parsed.intent);
      assert.fail('Should have thrown AMOUNT_EXCEEDS_LIMIT');
    } catch (err) {
      assert.strictEqual(err.code, ErrorCode.AMOUNT_EXCEEDS_LIMIT);
    }
  });

  // 8. Simulation & Proposal lifecycle
  await test('Simulation: Valid trade proposal generates quote & TTL', async () => {
    const parsed = await parseUserIntent('swap 0.05 ETH for USDC');
    const validated = await validateTradeIntent(parsed.intent);
    const proposal = await simulateTrade(validated);

    assert.ok(proposal.proposalId);
    assert.strictEqual(proposal.tokenIn.symbol, 'ETH');
    assert.strictEqual(proposal.tokenOut.symbol, 'USDC');
    assert.ok(parseFloat(proposal.estimatedAmountOutFormatted) > 0);
    assert.ok(proposal.expiresAt > Date.now());

    storeProposal(proposal);
    const execution = await executeTrade(proposal.proposalId);
    assert.ok(execution.txHash);
    assert.strictEqual(execution.status, 'confirmed');
  });

  // 9. Replay prevention / expired proposal
  await test('Execution: Non-existent or replayed proposal throws PROPOSAL_EXPIRED', async () => {
    try {
      await executeTrade('fake-or-already-used-proposal-id');
      assert.fail('Should have thrown PROPOSAL_EXPIRED');
    } catch (err) {
      assert.strictEqual(err.code, ErrorCode.PROPOSAL_EXPIRED);
    }
  });

  console.log(`Results: ${passed}/${total} tests passed.`);
  if (passed !== total) {
    process.exit(1);
  }
  process.exit(0);
}

runTests();
