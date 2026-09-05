# SwapChat — NLP-Powered Crypto Trading Chatbot

> **A chat interface that turns plain-English trade instructions into confirmed, on-chain swaps on Ethereum Sepolia.**

SwapChat allows non-technical users and DeFi learners to execute decentralized token swaps without needing to understand router contract ABIs, token addresses, slippage math, or manual approval transactions.

---

## 🌟 Key Features

1. **Natural Language Intent Parsing**:
   - Parses instructions like `"Swap 0.05 ETH for USDC"`, `"Trade 10 USDC for LINK"`, or `"Buy 25 DAI with ETH"`.
   - Distinguishes conversational queries (e.g. *"What tokens are supported?"*) from real trade instructions.
   - Detects missing amounts, unsupported networks, and out-of-whitelist tokens.

2. **Full Pre-Execution Safety Pipeline**:
   - **Network Check**: Operates strictly on Sepolia testnet.
   - **Whitelist Enforcement**: Only approved tokens with verified liquidity (`ETH`, `WETH`, `USDC`, `LINK`, `DAI`).
   - **Max Trade Limit Rail**: Hardcoded maximum swap size independent of LLM parsing.
   - **Balance & Gas Verification**: Verifies both token balance and native ETH for gas.
   - **Uniswap V2 Simulation**: Runs static quote simulation before any on-chain call.
   - **High Price Impact Warning**: Flagged and requires explicit user acknowledgement if price impact > 5%.

3. **Mandatory Human Confirmation & Execution**:
   - Interactive confirmation card with live 120s TTL quote countdown.
   - Automatic ERC-20 `approve()` handling prior to swap.
   - Real-time transaction tracker with direct Sepolia Etherscan link.

---

## 🏗️ Architecture

```
User (Chat UI)
     │
     ▼
React Frontend (Vite + Tailwind CSS)
     │
     ▼  POST /api/parse-intent
Backend API (Node.js + Express)
  ├── 1. NLP Intent Extraction (LLM + Rule Engine)
  ├── 2. Validation Service (Whitelist, Bounds, Balance & Gas)
  ├── 3. Simulation Service (Uniswap V2 getAmountsOut, Price Impact)
  └── 4. Proposal Store (UUID + 120s TTL)
     │
     ▼  Confirmation Card returned to User
User clicks "Confirm & Swap"
     │
     ▼  POST /api/execute-trade
Execution Service
  ├── Strict Re-Validation (TTL, Balances, Liquidity)
  ├── Step 1: ERC-20 approve() (if required)
  └── Step 2: Uniswap V2 Router swapExact...()
     │
     ▼
EVM Testnet (Ethereum Sepolia)
```

---

## ⚙️ Environment Configuration

All configurable values and keys are stored in `server/.env`:

```env
# Server Port
PORT=5001

# Sepolia RPC URL
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Burner Wallet Private Key (TESTNET ONLY)
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Uniswap V2 Router on Sepolia
UNISWAP_V2_ROUTER_ADDRESS=0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008

# Safety Rails
MAX_TRADE_SIZE_ETH=0.5
DEFAULT_SLIPPAGE_PERCENT=1.0
DEADLINE_MINUTES=10
PROPOSAL_TTL_SECONDS=120
PRICE_IMPACT_THRESHOLD_PERCENT=5.0

# Optional Google Gemini AI API Key
GEMINI_API_KEY=

# Demo fallback
ENABLE_DEMO_MOCK_FALLBACK=true
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 2. Run the Test Suite

```bash
cd server
npm test
```

### 3. Start Server & Client

In terminal 1 (Backend API):
```bash
cd server
npm run dev
```

In terminal 2 (Frontend UI):
```bash
cd client
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## 🛡️ Coding Standards Compliance

- **Imports**: Grouped external packages first, then internal modules at top of file.
- **Comments**: Explain *why* safety decisions exist (e.g. gas checks for ERC-20s).
- **Naming**: Verb-first functions (`validateTradeIntent`, `simulateTrade`, `resolveToken`), booleans as yes/no questions (`isExpired`, `requiresApproval`).
- **Errors**: Shared `ApiError` / `ErrorCode` enum contract across backend and frontend.
- **File Structure**: Flatter directory structure grouped by responsibility without artificial fragmentation.
