import React, { useState } from 'react';
import {
  MessageSquare,
  Receipt,
  Coins,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Sparkles,
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
    <aside className="hidden md:flex shrink-0 h-screen sticky top-0 border-r border-slate-200 bg-white select-none">
      {/* 1. Far-left Icon Rail */}
      <div className="w-14 border-r border-slate-200 flex flex-col items-center justify-between py-4 bg-slate-50/50">
        <div className="flex flex-col items-center gap-4">
          {/* App Logo */}
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <Zap className="w-5 h-5 fill-current text-amber-400" />
          </div>

          {/* Real Functional Navigation Icons */}
          <nav className="flex flex-col gap-2 mt-2">
            <button
              onClick={() => setActiveTab('terminal')}
              title="Trading Terminal"
              className={`p-2.5 rounded-lg transition-colors ${
                activeTab === 'terminal'
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('receipts')}
              title="Trade Receipts"
              className={`p-2.5 rounded-lg transition-colors relative ${
                activeTab === 'receipts'
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-4 h-4" />
              {receiptsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2 ring-2 ring-white" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('tokens')}
              title="Token Balances"
              className={`p-2.5 rounded-lg transition-colors ${
                activeTab === 'tokens'
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Coins className="w-4 h-4" />
            </button>
          </nav>
        </div>

        {/* Bottom Rail: Gemini Indicator */}
        <div className="flex flex-col items-center gap-2">
          <div
            title="Google Gemini 3 Flash NLP"
            className="p-2 rounded-lg text-indigo-600 bg-indigo-50"
          >
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2. Secondary Sidebar Panel: Clean, Real, 100% Functional */}
      <div className="w-56 flex flex-col justify-between p-4 bg-white text-xs">
        <div className="space-y-6">
          {/* Brand & Network */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>SwapChat</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                DEX
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Ethereum Sepolia Testnet</p>
          </div>

          {/* Main Navigation */}
          <div>
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Workspace
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('terminal')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'terminal'
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Trading Terminal</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>

              <button
                onClick={() => setActiveTab('receipts')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'receipts'
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Trade Receipts</span>
                </div>
                {receiptsCount > 0 && (
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                    {receiptsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('tokens')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'tokens'
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>Token Balances</span>
                </div>
              </button>
            </div>
          </div>

          {/* Real Burner Wallet Details */}
          {walletInfo && (
            <div>
              <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Burner Wallet
              </h3>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Address</span>
                  <div className="flex items-center justify-between font-mono text-[11px] text-slate-800">
                    <span>
                      {walletInfo.address.slice(0, 6)}...{walletInfo.address.slice(-4)}
                    </span>
                    <button
                      onClick={copyAddress}
                      title="Copy Address"
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-900 transition-colors"
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
                  className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <span>View on Etherscan</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Real Router Info */}
          <div>
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              DEX Protocol
            </h3>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70 text-[11px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Router</span>
                <span className="font-semibold text-slate-800">Uniswap V2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">AI Engine</span>
                <span className="font-semibold text-indigo-700 font-mono text-[10px]">Gemini 3 Flash</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom External Link: Real Sepolia Faucet */}
        <div className="pt-3 border-t border-slate-100">
          <a
            href="https://sepoliafaucet.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-2.5 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50/70 rounded-lg font-medium transition-colors"
          >
            <span>Get Sepolia ETH</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </aside>
  );
}
