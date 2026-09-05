import React, { useState } from 'react';
import { Search, ChevronRight, Copy, Check, RotateCw } from 'lucide-react';

export function Header({ walletInfo, onSearchSelect, onRefreshWallet, activeTab }) {
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const copyAddress = () => {
    if (walletInfo?.address) {
      navigator.clipboard.writeText(walletInfo.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefresh = async () => {
    if (onRefreshWallet) {
      setIsRefreshing(true);
      await onRefreshWallet();
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const tabLabels = {
    terminal: 'Trading Terminal',
    receipts: 'Trade Receipts',
    tokens: 'Token Balances'
  };

  return (
    <header className="h-12 border-b border-slate-200/80 bg-white px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
      {/* Real Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs font-medium">
        <span className="text-slate-400 font-semibold">SwapChat</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-slate-500">Sepolia</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-slate-900 font-semibold">{tabLabels[activeTab] || 'Terminal'}</span>
      </div>

      {/* Right Controls: Functional Prompt Input, Network Pill, Refresh & Burner Wallet */}
      <div className="flex items-center gap-2.5">
        {/* Real Functional Input */}
        <div className="relative hidden md:block w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Type prompt & hit Enter..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim() && onSearchSelect) {
                onSearchSelect(e.target.value.trim());
                e.target.value = '';
              }
            }}
            className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Refresh On-Chain Balances Button */}
        <button
          onClick={handleRefresh}
          title="Refresh On-Chain Balances"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
        </button>

        {/* Sepolia Network Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sepolia</span>
        </div>

        {/* Burner Wallet Pill */}
        {walletInfo && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 font-mono">
            <span>{walletInfo.address.slice(0, 6)}...{walletInfo.address.slice(-4)}</span>
            <button
              onClick={copyAddress}
              title="Copy Burner Address"
              className="p-0.5 text-slate-400 hover:text-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
