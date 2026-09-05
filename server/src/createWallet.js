import { ethers } from 'ethers';

// Script to generate a fresh, dedicated testnet burner wallet
function generateSepoliaWallet() {
  const wallet = ethers.Wallet.createRandom();

  console.log(`Address: ${wallet.address}`);
  console.log(`Private Key: ${wallet.privateKey}`);
}

generateSepoliaWallet();
