// Unified frontend API client for SwapChat backend

export async function parseIntent(message, sessionId = null) {
  const response = await fetch('/api/parse-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId })
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw data.error || { code: 'UNKNOWN_ERROR', message: 'Failed to process request.' };
  }
  return data;
}

export async function executeTrade(proposalId, sessionId = null) {
  const response = await fetch('/api/execute-trade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proposalId, sessionId })
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw data.error || { code: 'UNKNOWN_ERROR', message: 'Failed to execute trade.' };
  }
  return data;
}

export async function getSessionReceipts(sessionId) {
  const response = await fetch(`/api/session/${encodeURIComponent(sessionId)}/receipts`);
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw data.error || { code: 'UNKNOWN_ERROR', message: 'Failed to fetch receipts.' };
  }
  return data.receipts || [];
}

export async function clearSession(sessionId) {
  const response = await fetch(`/api/session/${encodeURIComponent(sessionId)}/clear`, {
    method: 'POST'
  });
  return response.json();
}

export async function getTxStatus(proposalId) {
  const response = await fetch(`/api/tx-status/${encodeURIComponent(proposalId)}`);
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw data.error || { code: 'UNKNOWN_ERROR', message: 'Failed to fetch transaction status.' };
  }
  return data.status;
}

export async function getWalletInfo() {
  const response = await fetch('/api/wallet-info');
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw data.error || { code: 'UNKNOWN_ERROR', message: 'Failed to fetch wallet info.' };
  }
  return data.wallet;
}

export async function getSupportedTokens() {
  const response = await fetch('/api/tokens');
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw data.error || { code: 'UNKNOWN_ERROR', message: 'Failed to fetch tokens.' };
  }
  return data;
}
