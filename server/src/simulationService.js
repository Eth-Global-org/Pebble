import crypto from 'crypto';
import { ethers } from 'ethers';
import { CONFIG } from './config.js';
import { ApiError, ErrorCode } from './errors.js';
import { getRouterPath, resolveToken } from './tokenWhitelist.js';
import { getRouterContract, getProvider, estimateGasPrice } from './chain.js';

// Base testnet price references for fallback estimation (ETH ≈ $2600, LINK ≈ $12, DAI/USDC ≈ $1)
const PRICE_REFERENCES_USD = {
  ETH: 2600,
  WETH: 2600,
  USDC: 1.0,
  DAI: 1.0,
  LINK: 12.0
};

export async function getLiveExchangeRate(tokenASymbol, tokenBSymbol, customAmountA = null) {
  const tokenA = resolveToken(tokenASymbol);
  const tokenB = resolveToken(tokenBSymbol);
  if (!tokenA || !tokenB) return null;

  const pathAB = getRouterPath(tokenA.symbol, tokenB.symbol);
  const pathBA = getRouterPath(tokenB.symbol, tokenA.symbol);
  if (!pathAB || !pathBA) return null;

  let rateAtoB = 0;
  let rateBtoA = 0;
  const router = getRouterContract(getProvider());

  // 1 unit of tokenA -> tokenB
  try {
    const oneUnitA = ethers.parseUnits('1', tokenA.decimals);
    const amountsOutAB = await router.getAmountsOut(oneUnitA, pathAB);
    rateAtoB = parseFloat(ethers.formatUnits(amountsOutAB[amountsOutAB.length - 1], tokenB.decimals));
  } catch {
    const fallbackUnits = calculateFallbackQuote(tokenA, tokenB, 1);
    rateAtoB = parseFloat(ethers.formatUnits(fallbackUnits, tokenB.decimals));
  }

  // 1 unit of tokenB -> tokenA
  try {
    const oneUnitB = ethers.parseUnits('1', tokenB.decimals);
    const amountsOutBA = await router.getAmountsOut(oneUnitB, pathBA);
    rateBtoA = parseFloat(ethers.formatUnits(amountsOutBA[amountsOutBA.length - 1], tokenA.decimals));
  } catch {
    const fallbackUnits = calculateFallbackQuote(tokenB, tokenA, 1);
    rateBtoA = parseFloat(ethers.formatUnits(fallbackUnits, tokenA.decimals));
  }

  let customOutput = null;
  if (customAmountA && customAmountA > 0) {
    customOutput = (customAmountA * rateAtoB).toFixed(4);
  }

  return {
    tokenA: tokenA.symbol,
    tokenB: tokenB.symbol,
    rateAtoB: rateAtoB > 10 ? rateAtoB.toFixed(2) : rateAtoB.toFixed(4),
    rateBtoA: rateBtoA > 10 ? rateBtoA.toFixed(2) : rateBtoA.toFixed(6),
    customAmountA,
    customOutput
  };
}

export async function simulateTrade(validatedData) {
  const { tokenInMeta, tokenOutMeta, amountInUnits, numericAmountIn, requiresApproval } = validatedData;
  const path = getRouterPath(tokenInMeta.symbol, tokenOutMeta.symbol);

  if (!path || path.length < 2) {
    throw new ApiError(ErrorCode.PAIR_NOT_FOUND, `No swap route found for ${tokenInMeta.symbol} -> ${tokenOutMeta.symbol}.`);
  }

  let estimatedOutUnits;
  let isSimulatedOnChain = false;

  try {
    const router = getRouterContract(getProvider());
    const amountsOut = await router.getAmountsOut(amountInUnits, path);
    estimatedOutUnits = amountsOut[amountsOut.length - 1];
    isSimulatedOnChain = true;
  } catch (error) {
    // If pool has insufficient liquidity on Sepolia testnet, use deterministic AMM reference quote for demo
    if (CONFIG.enableDemoMockFallback) {
      estimatedOutUnits = calculateFallbackQuote(tokenInMeta, tokenOutMeta, numericAmountIn);
    } else {
      const errorMessage = error?.message || '';
      if (errorMessage.includes('INSUFFICIENT_LIQUIDITY') || errorMessage.includes('overflow')) {
        throw new ApiError(ErrorCode.NO_LIQUIDITY, `Insufficient liquidity on Sepolia for ${tokenInMeta.symbol}/${tokenOutMeta.symbol} pool.`);
      }
      throw new ApiError(ErrorCode.SIMULATION_FAILED, 'Simulation failed on testnet router.', true, errorMessage);
    }
  }

  const estimatedOutFormatted = ethers.formatUnits(estimatedOutUnits, tokenOutMeta.decimals);
  const slippageFactor = (100 - CONFIG.defaultSlippagePercent) / 100;
  
  // Calculate minimum amount out after slippage tolerance
  const minOutUnits = (BigInt(estimatedOutUnits.toString()) * BigInt(Math.floor(slippageFactor * 10000))) / 10000n;
  const minOutFormatted = ethers.formatUnits(minOutUnits, tokenOutMeta.decimals);

  // Gas estimation
  const gasPrice = await estimateGasPrice();
  const estimatedGasUnits = requiresApproval ? 250000n : 150000n;
  const estimatedGasEthWei = gasPrice * estimatedGasUnits;
  const estimatedGasEth = ethers.formatEther(estimatedGasEthWei);

  // Price impact calculation
  const priceImpactPercent = calculatePriceImpact(tokenInMeta.symbol, tokenOutMeta.symbol, numericAmountIn, parseFloat(estimatedOutFormatted));
  const warnings = [];

  if (priceImpactPercent > CONFIG.priceImpactThresholdPercent) {
    warnings.push(`High price impact (${priceImpactPercent.toFixed(2)}%). You may receive a less favorable rate.`);
  }

  if (requiresApproval) {
    warnings.push(`One-time approval transaction for ${tokenInMeta.symbol} is required before swap.`);
  }

  const proposalId = crypto.randomUUID();
  const expiresAt = Date.now() + CONFIG.proposalTtlSeconds * 1000;

  return {
    proposalId,
    tokenIn: tokenInMeta,
    tokenOut: tokenOutMeta,
    amountIn: amountInUnits.toString(),
    amountInFormatted: numericAmountIn.toString(),
    estimatedAmountOut: estimatedOutUnits.toString(),
    estimatedAmountOutFormatted: estimatedOutFormatted,
    minAmountOut: minOutUnits.toString(),
    minAmountOutFormatted: minOutFormatted,
    estimatedGasEth,
    network: 'sepolia',
    slippagePercent: CONFIG.defaultSlippagePercent,
    priceImpactPercent: Number(priceImpactPercent.toFixed(2)),
    requiresApproval,
    requiresAcknowledgment: priceImpactPercent > CONFIG.priceImpactThresholdPercent,
    warnings,
    expiresAt,
    path,
    isSimulatedOnChain
  };
}

function calculateFallbackQuote(tokenIn, tokenOut, numericAmountIn) {
  const priceInUsd = PRICE_REFERENCES_USD[tokenIn.symbol] || 1;
  const priceOutUsd = PRICE_REFERENCES_USD[tokenOut.symbol] || 1;
  const totalValueUsd = numericAmountIn * priceInUsd;
  
  // Apply a standard 0.3% Uniswap fee
  const receivedValueUsd = totalValueUsd * 0.997;
  const estimatedOutputAmount = receivedValueUsd / priceOutUsd;

  return ethers.parseUnits(estimatedOutputAmount.toFixed(tokenOut.decimals), tokenOut.decimals);
}

function calculatePriceImpact(symbolIn, symbolOut, amountIn, amountOut) {
  const priceInUsd = PRICE_REFERENCES_USD[symbolIn] || 1;
  const priceOutUsd = PRICE_REFERENCES_USD[symbolOut] || 1;
  const expectedValueUsd = amountIn * priceInUsd;
  const actualValueUsd = amountOut * priceOutUsd;

  if (expectedValueUsd <= 0) return 0;
  const diffPercent = ((expectedValueUsd - actualValueUsd) / expectedValueUsd) * 100;
  return Math.max(0, Math.min(diffPercent, 99.9));
}
