import assert from 'assert';
import {
  getDatabase,
  recordTransaction,
  getAllTransactions,
  getTransactionByReceiptId,
  clearDatabaseTransactions
} from '../src/db.js';

async function runDbTests() {
  console.log('Running SQLite transaction logging tests...');

  // 1. Verify DB initialization
  const db = getDatabase();
  assert.ok(db, 'Database should initialize');

  const testSession = 'db-test-session-' + Date.now();
  const testReceiptId1 = 'REC-TEST-' + Date.now() + '-001';
  const testReceiptId2 = 'REC-TEST-' + Date.now() + '-002';

  // 2. Record a confirmed transaction
  const trade1 = {
    receiptId: testReceiptId1,
    proposalId: 'prop-123',
    tokenIn: 'ETH',
    tokenOut: 'USDC',
    amountIn: '0.05',
    amountOut: '142.5000',
    rate: '2850.0000',
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    explorerUrl: 'https://sepolia.etherscan.io/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    estimatedGasEth: '0.00035',
    network: 'Sepolia Testnet',
    status: 'Confirmed',
    timestamp: Date.now()
  };

  const recorded1 = recordTransaction(trade1, testSession);
  assert.strictEqual(recorded1, true, 'Confirmed transaction should record successfully');
  console.log('  PASS: Record confirmed transaction to SQLite');

  // 3. Record a failed transaction
  const trade2 = {
    receiptId: testReceiptId2,
    proposalId: 'prop-456',
    tokenIn: 'LINK',
    tokenOut: 'ETH',
    amountIn: '10',
    amountOut: '0',
    rate: '0',
    txHash: null,
    explorerUrl: null,
    estimatedGasEth: '0.00035',
    network: 'Sepolia Testnet',
    status: 'Failed',
    errorMessage: 'TransferHelper: TRANSFER_FROM_FAILED',
    timestamp: Date.now() + 1000
  };

  const recorded2 = recordTransaction(trade2, testSession);
  assert.strictEqual(recorded2, true, 'Failed transaction should record successfully');
  console.log('  PASS: Record failed transaction to SQLite');

  // 4. Query by receipt ID
  const retrieved1 = getTransactionByReceiptId(testReceiptId1);
  assert.ok(retrieved1, 'Should retrieve transaction by receipt ID');
  assert.strictEqual(retrieved1.receiptId, testReceiptId1);
  assert.strictEqual(retrieved1.tokenIn, 'ETH');
  assert.strictEqual(retrieved1.tokenOut, 'USDC');
  assert.strictEqual(retrieved1.status, 'Confirmed');
  assert.strictEqual(retrieved1.amountIn, '0.05');
  console.log('  PASS: Retrieve transaction by receipt ID');

  const retrieved2 = getTransactionByReceiptId(testReceiptId2);
  assert.ok(retrieved2, 'Should retrieve failed transaction');
  assert.strictEqual(retrieved2.status, 'Failed');
  assert.strictEqual(retrieved2.errorMessage, 'TransferHelper: TRANSFER_FROM_FAILED');
  console.log('  PASS: Retrieve failed transaction with error message');

  // 5. Query all transactions with session filter
  const sessionTxs = getAllTransactions(10, testSession);
  assert.strictEqual(sessionTxs.length, 2, 'Session should have exactly 2 recorded transactions');
  assert.strictEqual(sessionTxs[0].receiptId, testReceiptId2, 'Most recent transaction should be first');
  console.log('  PASS: Query transactions filtered by session ID');

  // 6. Query all transactions global
  const allTxs = getAllTransactions(50);
  assert.ok(allTxs.length >= 2, 'Global query should return all recorded transactions');
  console.log('  PASS: Global transaction query');

  // 7. Clear session transactions
  const cleared = clearDatabaseTransactions(testSession);
  assert.strictEqual(cleared, true, 'Clear should succeed');
  const sessionTxsAfter = getAllTransactions(10, testSession);
  assert.strictEqual(sessionTxsAfter.length, 0, 'Session transactions should be empty after clear');
  console.log('  PASS: Clear session transactions from SQLite');

  console.log('Results: 7/7 SQLite database tests passed.');
}

runDbTests();
