export const ErrorCode = Object.freeze({
  UNSUPPORTED_NETWORK: 'UNSUPPORTED_NETWORK',
  UNKNOWN_TOKEN: 'UNKNOWN_TOKEN',
  INVALID_PAIR: 'INVALID_PAIR',
  MISSING_AMOUNT: 'MISSING_AMOUNT',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  AMOUNT_EXCEEDS_LIMIT: 'AMOUNT_EXCEEDS_LIMIT',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INSUFFICIENT_GAS: 'INSUFFICIENT_GAS',
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  NO_LIQUIDITY: 'NO_LIQUIDITY',
  PAIR_NOT_FOUND: 'PAIR_NOT_FOUND',
  SIMULATION_FAILED: 'SIMULATION_FAILED',
  PROPOSAL_EXPIRED: 'PROPOSAL_EXPIRED',
  RPC_UNAVAILABLE: 'RPC_UNAVAILABLE',
  TRANSACTION_REVERTED: 'TRANSACTION_REVERTED',
  TRANSACTION_TIMEOUT: 'TRANSACTION_TIMEOUT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
});

export class ApiError extends Error {
  constructor(code, message, recoverable = true, detail = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.recoverable = recoverable;
    this.detail = detail;
  }
}

export function formatApiError(error) {
  if (error instanceof ApiError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        recoverable: error.recoverable,
        detail: process.env.NODE_ENV === 'development' ? error.detail : undefined
      }
    };
  }

  // Sanitize unexpected internal errors so internal stack traces or RPC secrets do not leak
  return {
    success: false,
    error: {
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'An unexpected error occurred. Please try again.',
      recoverable: true,
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
  };
}
