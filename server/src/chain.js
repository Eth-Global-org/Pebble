import { ethers } from 'ethers';
import { CONFIG, UNISWAP_V2_ROUTER_ABI, ERC20_ABI } from './config.js';
import { ApiError, ErrorCode } from './errors.js';
import { getAllWhitelistedTokens } from './tokenWhitelist.js';

let providerInstance = null;
let walletInstance = null;

export function getProvider() {
  if (!providerInstance) {
    try {
      const sepoliaNetwork = ethers.Network.from('sepolia');
      providerInstance = new ethers.JsonRpcProvider(CONFIG.sepoliaRpcUrl, sepoliaNetwork, {
        staticNetwork: sepoliaNetwork
      });
    } catch (error) {
      throw new ApiError(
        ErrorCode.RPC_UNAVAILABLE,
        'Could not connect to the Sepolia RPC provider.',
        true,
        error.message
      );
    }
  }
  return providerInstance;
}

export function getWallet() {
  if (!walletInstance) {
    const provider = getProvider();
    try {
      walletInstance = new ethers.Wallet(CONFIG.privateKey, provider);
    } catch (error) {
      throw new ApiError(
        ErrorCode.UNKNOWN_ERROR,
        'Invalid burner wallet configuration. Please check your PRIVATE_KEY in .env',
        false,
        error.message
      );
    }
  }
  return walletInstance;
}

export function getRouterContract(signerOrProvider) {
  const target = signerOrProvider || getWallet();
  return new ethers.Contract(CONFIG.uniswapV2RouterAddress, UNISWAP_V2_ROUTER_ABI, target);
}

export function getErc20Contract(tokenAddress, signerOrProvider) {
  const target = signerOrProvider || getWallet();
  return new ethers.Contract(tokenAddress, ERC20_ABI, target);
}

export async function getTokenBalance(tokenMeta, walletAddress) {
  const provider = getProvider();
  const addressToCheck = walletAddress || getWallet().address;

  try {
    if (tokenMeta.isNative) {
      const balanceWei = await provider.getBalance(addressToCheck);
      return {
        raw: balanceWei.toString(),
        formatted: ethers.formatEther(balanceWei),
        decimals: 18
      };
    }

    const contract = getErc20Contract(tokenMeta.address, provider);
    const balanceRaw = await contract.balanceOf(addressToCheck);
    return {
      raw: balanceRaw.toString(),
      formatted: ethers.formatUnits(balanceRaw, tokenMeta.decimals),
      decimals: tokenMeta.decimals
    };
  } catch (error) {
    // If provider is unreachable or testnet contract fails, return 0 for safe fallback
    return {
      raw: '0',
      formatted: '0.0',
      decimals: tokenMeta.decimals
    };
  }
}

export async function getTokenAllowance(tokenMeta, ownerAddress, spenderAddress) {
  if (tokenMeta.isNative) {
    // Native ETH does not require ERC-20 approval
    return {
      raw: ethers.MaxUint256.toString(),
      formatted: 'Unlimited',
      isSufficient: true
    };
  }

  const provider = getProvider();
  const spender = spenderAddress || CONFIG.uniswapV2RouterAddress;

  try {
    const contract = getErc20Contract(tokenMeta.address, provider);
    const allowanceRaw = await contract.allowance(ownerAddress, spender);
    return {
      raw: allowanceRaw.toString(),
      formatted: ethers.formatUnits(allowanceRaw, tokenMeta.decimals),
      decimals: tokenMeta.decimals
    };
  } catch (error) {
    return {
      raw: '0',
      formatted: '0.0',
      decimals: tokenMeta.decimals
    };
  }
}

export async function getWalletBalances() {
  const wallet = getWallet();
  const tokens = getAllWhitelistedTokens();
  const balances = {};

  for (const token of tokens) {
    const balanceInfo = await getTokenBalance(token, wallet.address);
    balances[token.symbol] = {
      ...token,
      balance: balanceInfo.formatted,
      rawBalance: balanceInfo.raw
    };
  }

  return {
    address: wallet.address,
    network: 'sepolia',
    balances
  };
}

export async function estimateGasPrice() {
  try {
    const provider = getProvider();
    const feeData = await provider.getFeeData();
    return feeData.gasPrice || ethers.parseUnits('1.5', 'gwei');
  } catch {
    return ethers.parseUnits('2.0', 'gwei');
  }
}
