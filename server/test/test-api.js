process.env.NODE_ENV = 'test';

import assert from 'assert';
import http from 'http';
import { startServer } from '../src/server.js';
import { CONFIG } from '../src/config.js';

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: CONFIG.port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, data: raw });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runApiTests() {
  console.log('Running API tests...');
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
    }
  }

  // 1. Health check endpoint
  await test('GET /api/health returns ok', async () => {
    const res = await makeRequest('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'ok');
    assert.strictEqual(res.data.network, 'sepolia');
  });

  // 2. Tokens endpoint
  await test('GET /api/tokens returns whitelist', async () => {
    const res = await makeRequest('/api/tokens');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.tokens));
    assert.strictEqual(res.data.tokens.length, 5);
  });

  // 3. Wallet info endpoint
  await test('GET /api/wallet-info returns address and balances', async () => {
    const res = await makeRequest('/api/wallet-info');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.wallet.address.startsWith('0x'));
  });

  // 4. Conversational parse intent
  await test('POST /api/parse-intent with conversational prompt', async () => {
    const res = await makeRequest('/api/parse-intent', 'POST', {
      message: 'What tokens are supported?'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.isTrade, false);
    assert.ok(res.data.message.includes('Supported tokens') || res.data.message.includes('Sepolia'));
  });

  // 5. Valid trade parse intent
  let createdProposalId = null;
  const testSessionId = 'api-session-' + Date.now();

  await test('POST /api/parse-intent generates proposal and TTL', async () => {
    const res = await makeRequest('/api/parse-intent', 'POST', {
      message: 'Swap 0.05 ETH for USDC',
      sessionId: testSessionId
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.isTrade, true);
    assert.ok(res.data.proposal.proposalId);
    assert.strictEqual(res.data.proposal.tokenIn.symbol, 'ETH');
    assert.strictEqual(res.data.proposal.tokenOut.symbol, 'USDC');
    createdProposalId = res.data.proposal.proposalId;
  });

  // 6. Execute trade endpoint with receipt
  await test('POST /api/execute-trade executes proposal and returns txHash & receipt', async () => {
    assert.ok(createdProposalId);
    const res = await makeRequest('/api/execute-trade', 'POST', {
      proposalId: createdProposalId,
      sessionId: testSessionId
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.execution.txHash);
    assert.strictEqual(res.data.execution.status, 'confirmed');
    assert.ok(res.data.receipt);
    assert.ok(res.data.receipt.receiptId.startsWith('REC-'));
  });

  // 7. Get session receipts endpoint
  await test('GET /api/session/:sessionId/receipts retrieves trade receipts', async () => {
    const res = await makeRequest(`/api/session/${testSessionId}/receipts`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.receipts));
    assert.strictEqual(res.data.receipts.length, 1);
  });

  // 8. Poll status endpoint
  await test('GET /api/tx-status/:proposalId retrieves execution status', async () => {
    const res = await makeRequest(`/api/tx-status/${createdProposalId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.status.status, 'confirmed');
  });

  // 9. Replay execution fails
  await test('POST /api/execute-trade with replayed proposal fails', async () => {
    const res = await makeRequest('/api/execute-trade', 'POST', {
      proposalId: createdProposalId,
      sessionId: testSessionId
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
    assert.strictEqual(res.data.error.code, 'PROPOSAL_EXPIRED');
  });

  console.log(`Results: ${passed}/${total} tests passed.`);
  if (passed !== total) {
    process.exit(1);
  }
  process.exit(0);
}

function ensureServer() {
  return new Promise((resolve) => {
    const req = http.get({ hostname: '127.0.0.1', port: CONFIG.port, path: '/api/health' }, () => {
      resolve();
    });
    req.on('error', () => {
      startServer();
      setTimeout(resolve, 500);
    });
  });
}

ensureServer().then(runApiTests);
