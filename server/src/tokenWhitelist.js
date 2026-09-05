import { CONFIG } from './config.js';

const ALIAS_MAP = {
  eth: 'ETH',
  ether: 'ETH',
  ethereum: 'ETH',
  weth: 'WETH',
  'wrapped eth': 'WETH',
  'wrapped ether': 'WETH',
  usdc: 'USDC',
  'usd coin': 'USDC',
  link: 'LINK',
  chainlink: 'LINK',
  dai: 'DAI',
  'dai stablecoin': 'DAI'
};

export function resolveToken(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return null;

  const normalized = rawInput.trim().toLowerCase();
  const canonicalSymbol = ALIAS_MAP[normalized] || normalized.toUpperCase();

  if (CONFIG.tokens[canonicalSymbol]) {
    return CONFIG.tokens[canonicalSymbol];
  }

  return null;
}

export function isTradableToken(symbol) {
  return Boolean(resolveToken(symbol));
}

export function getTokenMeta(symbol) {
  return resolveToken(symbol);
}

export function getAllWhitelistedTokens() {
  return Object.values(CONFIG.tokens);
}

export function getRouterPath(tokenInSymbol, tokenOutSymbol) {
  const tokenInMeta = resolveToken(tokenInSymbol);
  const tokenOutMeta = resolveToken(tokenOutSymbol);

  if (!tokenInMeta || !tokenOutMeta) {
    return null;
  }

  // Native ETH swaps on Uniswap V2 must route through the WETH contract address in the path
  const addressIn = tokenInMeta.isNative ? tokenInMeta.wrappedAddress : tokenInMeta.address;
  const addressOut = tokenOutMeta.isNative ? tokenOutMeta.wrappedAddress : tokenOutMeta.address;

  // Direct pair path: [tokenIn, tokenOut]
  if (addressIn === addressOut) {
    return [addressIn];
  }

  // For ERC-20 to ERC-20 swaps where no direct pair may exist, Uniswap V2 routes via WETH if neither is WETH/ETH
  const wethAddress = CONFIG.tokens.WETH.address;
  if (addressIn !== wethAddress && addressOut !== wethAddress) {
    return [addressIn, wethAddress, addressOut];
  }

  return [addressIn, addressOut];
}
