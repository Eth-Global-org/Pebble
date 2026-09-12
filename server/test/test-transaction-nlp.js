import assert from 'assert';
import { parseUserIntent, getOrCreateSession, recordSessionTrade } from '../src/nlpService.js';

process.env.NODE_ENV = 'test';

async function runNLPTransactionTests() {
  console.log('Testing Natural Language Transaction & Trade History queries...');
  const sessionId = 'test-nlp-session-' + Date.now();
  const session = getOrCreateSession(sessionId);

  // 1. When no trades executed yet
  const emptyQuery = await parseUserIntent('what was my last transaction', sessionId);
  assert.strictEqual(emptyQuery.isTrade, false);
  assert.ok(emptyQuery.message.includes('not executed any trades'));
  console.log('  PASS: Handles empty history gracefully');

  // Add mock trade receipt
  const mockReceipt = {
    receiptId: 'REC-TEST-NLP-999',
    tokenIn: 'ETH',
    tokenOut: 'USDC',
    amountIn: '0.05',
    amountOut: '499.6777',
    rate: '9993.5533',
    txHash: '0xe6eb1234567890abcdef',
    explorerUrl: 'https://sepolia.etherscan.io/tx/0xe6eb1234567890abcdef',
    status: 'Confirmed',
    timestamp: Date.now()
  };
  recordSessionTrade(sessionId, mockReceipt);

  const testPhrases = [
    'what was my last transaction',
    'what was my last transaction ?',
    'what was my last transaction?',
    'What was my last transaction',
    'last transaction',
    'previous transaction',
    'what was my last trade',
    'what was my last swap',
    'show my last transaction',
    'transaction history',
    'trade history',
    'my transactions',
    'what did i trade',
    'what did i swap',
    'what did i just trade',
    'what did i just swap',
    'what have i traded',
    'receipts',
    'show receipts',
    'view my transactions'
  ];

  for (const phrase of testPhrases) {
    const res = await parseUserIntent(phrase, sessionId);
    assert.strictEqual(res.isTrade, false, `Failed on "${phrase}": isTrade should be false`);
    assert.ok(
      res.message.includes('REC-TEST-NLP-999') || res.message.includes('0.05 ETH'),
      `Failed on "${phrase}": response does not contain receipt details. Got: ${res.message}`
    );
    console.log(`  PASS: "${phrase}" -> correctly answered`);
  }

  console.log(`All ${testPhrases.length + 1} NLP transaction history tests passed!`);
  process.exit(0);
}

runNLPTransactionTests();
