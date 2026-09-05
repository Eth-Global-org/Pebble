// Unified frontend API client for SwapChat backend

async function safeJsonFetch(url, options = {}) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw {
      code: 'NETWORK_ERROR',
      message: 'Could not connect to backend server. Make sure the server is running on port 5001.',
      recoverable: true
    };
  }

  const rawText = await response.text();
  let data;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw {
      code: 'SERVER_ERROR',
      message: `The server returned an unparseable response (${response.status}). Please try again.`,
      recoverable: true
    };
  }

  if (!response.ok || !data.success) {
    throw data.error || {
      code: 'UNKNOWN_ERROR',
      message: data.message || `Request failed with status ${response.status}.`,
      recoverable: true
    };
  }

  return data;
}

export async function parseIntent(message, sessionId = null) {
  return safeJsonFetch('/api/parse-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId })
  });
}

export async function executeTrade(proposalId, sessionId = null) {
  return safeJsonFetch('/api/execute-trade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proposalId, sessionId })
  });
}

export async function getSessionReceipts(sessionId) {
  try {
    const data = await safeJsonFetch(`/api/session/${encodeURIComponent(sessionId)}/receipts`);
    return data.receipts || [];
  } catch {
    return [];
  }
}

export async function clearSession(sessionId) {
  try {
    return await safeJsonFetch(`/api/session/${encodeURIComponent(sessionId)}/clear`, {
      method: 'POST'
    });
  } catch {
    return { success: false };
  }
}

export async function getTxStatus(proposalId) {
  const data = await safeJsonFetch(`/api/tx-status/${encodeURIComponent(proposalId)}`);
  return data.status;
}

export async function getWalletInfo() {
  const data = await safeJsonFetch('/api/wallet-info');
  return data.wallet;
}

export async function getSupportedTokens() {
  const data = await safeJsonFetch('/api/tokens');
  return data;
}
