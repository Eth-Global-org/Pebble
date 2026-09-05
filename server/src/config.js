import dotenv from 'dotenv';

dotenv.config();

export const UNISWAP_V2_ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
];

export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

export const CONFIG = Object.freeze({
  port: parseInt(process.env.PORT || '5001', 10),
  sepoliaRpcUrl: process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
  privateKey: process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  uniswapV2RouterAddress: process.env.UNISWAP_V2_ROUTER_ADDRESS || '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008',
  
  // Safety rails
  maxTradeSizeEth: parseFloat(process.env.MAX_TRADE_SIZE_ETH || '0.5'),
  defaultSlippagePercent: parseFloat(process.env.DEFAULT_SLIPPAGE_PERCENT || '1.0'),
  deadlineMinutes: parseInt(process.env.DEADLINE_MINUTES || '10', 10),
  proposalTtlSeconds: parseInt(process.env.PROPOSAL_TTL_SECONDS || '120', 10),
  priceImpactThresholdPercent: parseFloat(process.env.PRICE_IMPACT_THRESHOLD_PERCENT || '5.0'),

  // Gemini AI Configuration
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: (process.env.GEMINI_MODEL || 'gemini-3-flash-preview')
    .replace('gemini-3.0-flash', 'gemini-3-flash-preview')
    .replace('gemini-3-flash$', 'gemini-3-flash-preview'),
  enableDemoMockFallback: process.env.ENABLE_DEMO_MOCK_FALLBACK !== 'false',

  // Supported Networks
  supportedNetworks: ['sepolia'],

  // Supported Token Whitelist (Sepolia EVM)
  tokens: {
    ETH: {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      isNative: true,
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      wrappedAddress: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9'
    },
    WETH: {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      isNative: false,
      address: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9'
    },
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      isNative: false,
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
    },
    LINK: {
      symbol: 'LINK',
      name: 'Chainlink',
      decimals: 18,
      isNative: false,
      address: '0x779877A7B0D9E8603169DdbD7836e478b4624789'
    },
    DAI: {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      isNative: false,
      address: '0x3e622317f8C93f7328350cF0B563184A681e04e9'
    }
  }
});
