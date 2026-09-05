import { ethers } from 'ethers';
import { CONFIG } from './config.js';
import { ApiError, ErrorCode } from './errors.js';
import { resolveToken } from './tokenWhitelist.js';
import { getWallet, getTokenBalance, getTokenAllowance, estimateGasPrice } from './chain.js';

export async function validateTradeIntent(intent) {
  if (!intent) {
    throw new ApiError(ErrorCode.UNKNOWN_ERROR, 'Trade intent is required for validation.');
  }

  // 1. Network validation
  validateNetwork(intent.network);

  // 2. Token recognition and pair validation
  const tokenInMeta = resolveToken(intent.tokenIn);
  if (!tokenInMeta) {
    throw new ApiError(
      ErrorCode.UNKNOWN_TOKEN,
      `I don't recognize '${intent.tokenIn}'. Supported tokens: ${Object.keys(CONFIG.tokens).join(', ')}.`
    );
  }

  const tokenOutMeta = resolveToken(intent.tokenOut);
  if (!tokenOutMeta) {
    throw new ApiError(
      ErrorCode.UNKNOWN_TOKEN,
      `I don't recognize '${intent.tokenOut}'. Supported tokens: ${Object.keys(CONFIG.tokens).join(', ')}.`
    );
  }

  if (tokenInMeta.symbol === tokenOutMeta.symbol) {
    throw new ApiError(ErrorCode.INVALID_PAIR, 'Input and output token cannot be the same.');
  }

  // 3. Amount validation
  validateAmount(intent.amountIn, tokenInMeta);

  // Parse exact amount in token base units
  const amountInUnits = parseAmountUnits(intent.amountIn, tokenInMeta.decimals);

  // 4. Wallet balance & gas validation
  const wallet = getWallet();
  const balanceCheck = await checkWalletBalancesAndAllowance(wallet.address, tokenInMeta, amountInUnits, intent.amountIn);

  return {
    tokenInMeta,
    tokenOutMeta,
    amountInUnits,
    numericAmountIn: intent.amountIn,
    network: 'sepolia',
    requiresApproval: balanceCheck.requiresApproval,
    walletAddress: wallet.address
  };
}

function validateNetwork(network) {
  const normalized = (network || 'sepolia').trim().toLowerCase();
  if (!CONFIG.supportedNetworks.includes(normalized)) {
    throw new ApiError(
      ErrorCode.UNSUPPORTED_NETWORK,
      `This bot currently only supports Sepolia testnet. '${network}' isn't available yet.`
    );
  }
}

function validateAmount(amount, tokenMeta) {
  if (amount === null || amount === undefined || amount === '') {
    throw new ApiError(ErrorCode.MISSING_AMOUNT, `How much ${tokenMeta.symbol} would you like to swap?`);
  }

  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    throw new ApiError(ErrorCode.INVALID_AMOUNT, 'Please enter a valid amount greater than zero.');
  }

  // Enforce demo trade size safety cap to protect burner wallet liquidity
  const maxLimit = tokenMeta.symbol === 'ETH' || tokenMeta.symbol === 'WETH' ? CONFIG.maxTradeSizeEth : 1000;
  if (numericAmount > maxLimit) {
    throw new ApiError(
      ErrorCode.AMOUNT_EXCEEDS_LIMIT,
      `This exceeds the maximum trade size limit of ${maxLimit} ${tokenMeta.symbol} for this demo.`
    );
  }
}

function parseAmountUnits(amount, decimals) {
  try {
    const stringAmount = typeof amount === 'number' ? amount.toFixed(decimals) : String(amount);
    return ethers.parseUnits(stringAmount, decimals);
  } catch (error) {
    throw new ApiError(ErrorCode.INVALID_AMOUNT, 'Invalid decimal precision for this token.', true, error.message);
  }
}

async function checkWalletBalancesAndAllowance(walletAddress, tokenInMeta, amountInUnits, numericAmount) {
  const balanceInfo = await getTokenBalance(tokenInMeta, walletAddress);
  const userBalanceUnits = BigInt(balanceInfo.raw);

  // In live mode with funds, check real balance; in demo fallback mode, allow simulation to proceed
  if (userBalanceUnits < amountInUnits && !CONFIG.enableDemoMockFallback) {
    throw new ApiError(
      ErrorCode.INSUFFICIENT_BALANCE,
      `Burner wallet only holds ${balanceInfo.formatted} ${tokenInMeta.symbol}, which isn't enough for this trade.`
    );
  }

  let requiresApproval = false;
  if (!tokenInMeta.isNative) {
    const allowanceInfo = await getTokenAllowance(tokenInMeta, walletAddress, CONFIG.uniswapV2RouterAddress);
    const allowanceUnits = BigInt(allowanceInfo.raw);
    if (allowanceUnits < amountInUnits) {
      requiresApproval = true;
    }
  }

  // Native ETH balance must cover gas even when swapping an ERC-20
  const ethBalanceInfo = await getTokenBalance(CONFIG.tokens.ETH, walletAddress);
  const ethBalanceUnits = BigInt(ethBalanceInfo.raw);
  const gasPrice = await estimateGasPrice();
  const estimatedGasUnits = requiresApproval ? 250000n : 150000n;
  const estimatedGasCostWei = gasPrice * estimatedGasUnits;

  if (ethBalanceUnits < estimatedGasCostWei && !CONFIG.enableDemoMockFallback) {
    throw new ApiError(
      ErrorCode.INSUFFICIENT_GAS,
      'Not enough Sepolia ETH to cover gas for this transaction. Try a Sepolia faucet: https://sepoliafaucet.com'
    );
  }

  return {
    requiresApproval,
    balanceFormatted: balanceInfo.formatted
  };
}
