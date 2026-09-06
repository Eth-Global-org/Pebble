import React, { useState } from 'react';
import {
  MessageSquare,
  Receipt,
  Coins,
  ExternalLink,
  Copy,
  Check,
  Zap,
  ArrowUpRight
} from 'lucide-react';

export function Sidebar({ activeTab, setActiveTab, walletInfo, receiptsCount = 0 }) {
  const [copied, setCopied] = useState(false);

  const ethBalance = walletInfo?.balances?.ETH?.balance
    ? parseFloat(walletInfo.balances.ETH.balance).toFixed(4)
    : '0.0000';

  const copyAddress = () => {
    if (walletInfo?.address) {
      navigator.clipboard.writeText(walletInfo.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <aside className="hidden md:flex shrink-0 w-64 h-screen sticky top-0 flex-col justify-between bg-white text-slate-800 select-none border-r border-slate-200">
      {/* Top Brand & Menu Section */}
      <div className="p-4 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <Zap className="w-5 h-5 fill-current text-amber-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>SwapChat</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                DEX
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Sepolia Testnet Assistant</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Workspace
          </h2>

          <nav className="space-y-1">
            {/* 1. Terminal */}
            <button
              type="button"
              onClick={() => setActiveTab('terminal')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeTab === 'terminal'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-slate-700" />
                <span>Trading Terminal</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {/* 2. Receipts */}
            <button
              type="button"
              onClick={() => setActiveTab('receipts')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeTab === 'receipts'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Receipt className="w-4 h-4 text-slate-700" />
                <span>Trade Receipts</span>
              </div>
              {receiptsCount > 0 && (
                <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-200 px-1.5 py-0.2 rounded-full">
                  {receiptsCount}
                </span>
              )}
            </button>

            {/* 3. Token Balances */}
            <button
              type="button"
              onClick={() => setActiveTab('tokens')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeTab === 'tokens'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Coins className="w-4 h-4 text-slate-700" />
                <span>Token Balances</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Burner Wallet Box */}
        {walletInfo && (
          <div className="pt-2">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Burner Wallet
            </h2>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Address (Sepolia)</span>
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-800">
                  <span>
                    {walletInfo.address.slice(0, 6)}...{walletInfo.address.slice(-4)}
                  </span>
                  <button
                    type="button"
                    onClick={copyAddress}
                    title="Copy Address"
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Gas Balance</span>
                <span className="font-mono font-semibold text-slate-900 text-xs">
                  {ethBalance} ETH
                </span>
              </div>

              <a
                href={`https://sepolia.etherscan.io/address/${walletInfo.address}`}
                target="_blank"
                rel="noreferrer"
                className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                <span>View on Etherscan</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Info */}
      <div className="p-4 border-t border-slate-100 space-y-2 text-xs">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Engine</span>
          <span className="text-slate-700 font-mono">Gemini 3 Flash</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Router</span>
          <span className="text-slate-700 font-mono">Uniswap V2</span>
        </div>

        <a
          href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
          target="_blank"
          rel="noreferrer"
          className="mt-2 w-full py-1.5 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-600 hover:text-slate-900 flex items-center justify-between transition-colors text-[11px] font-medium"
        >
          <span>Get Sepolia ETH</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>
      </div>
    </aside>
  );
}
