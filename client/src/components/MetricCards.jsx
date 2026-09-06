import React from 'react';
import { TrendingUp, Fuel, Layers, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export function MetricCards({ receipts = [], walletBalances }) {
  const totalTrades = receipts.length;
  const ethBalance = walletBalances?.ETH?.balance
    ? parseFloat(walletBalances.ETH.balance).toFixed(4)
    : '0.0000';

  const lastReceipt = receipts[0] || null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Card 1: Dark Slate / Charcoal (New Accounts style) */}
      <div className="bg-[#181d2d] rounded-2xl p-5 shadow-sm text-white flex flex-col justify-between relative overflow-hidden transition-transform hover:-translate-y-0.5 duration-200">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Session Trades
            </span>
            <div className="text-3xl font-extrabold font-mono tracking-tight text-white mb-2">
              {totalTrades}
            </div>
          </div>
          {/* Circular Badge */}
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
            <TrendingUp className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span>↑</span>
            <span>
              {totalTrades > 0 ? `${totalTrades} settled on-chain` : 'Ready for trade prompt'}
            </span>
          </div>
          {lastReceipt && (
            <span className="text-[11px] font-mono text-slate-400 truncate max-w-[120px]">
              Last: {lastReceipt.tokenIn}→{lastReceipt.tokenOut}
            </span>
          )}
        </div>
      </div>

      {/* Card 2: Deep Indigo / Navy (Sales style) */}
      <div className="bg-[#242b58] rounded-2xl p-5 shadow-sm text-white flex flex-col justify-between relative overflow-hidden transition-transform hover:-translate-y-0.5 duration-200">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-300/80 uppercase tracking-wider block mb-2">
              Burner Gas Reserves
            </span>
            <div className="text-3xl font-extrabold font-mono tracking-tight text-white mb-2 flex items-baseline gap-1.5">
              <span>{ethBalance}</span>
              <span className="text-xs font-mono text-slate-300 font-normal">ETH</span>
            </div>
          </div>
          {/* Circular Badge */}
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
            <Fuel className="w-5 h-5 text-amber-500 stroke-[2.5]" />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-amber-300 font-medium">
            <span>↑</span>
            <span>Est. ~0.00035 ETH / swap</span>
          </div>
          <span className="text-[11px] font-mono text-slate-300/80">
            Cap: 0.50 ETH
          </span>
        </div>
      </div>

      {/* Card 3: Royal Blue / Purple (Orders style) */}
      <div className="bg-[#545be8] rounded-2xl p-5 shadow-sm text-white flex flex-col justify-between relative overflow-hidden transition-transform hover:-translate-y-0.5 duration-200">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider block mb-2">
              DEX Protocol
            </span>
            <div className="text-3xl font-extrabold tracking-tight text-white mb-2 font-sans">
              Uniswap V2
            </div>
          </div>
          {/* Circular Badge */}
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
            <Layers className="w-5 h-5 text-[#545be8] stroke-[2.5]" />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-white/90">
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>Sepolia Testnet Router</span>
          </div>
          <a
            href="https://sepolia.etherscan.io/address/0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-mono text-white hover:underline flex items-center gap-0.5"
          >
            <span>0xC532...4008</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
