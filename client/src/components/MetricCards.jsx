import React from 'react';
import { TrendingUp, ShieldCheck, Fuel, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export function MetricCards({ receipts = [], walletBalances }) {
  const totalTrades = receipts.length;
  const ethBalance = walletBalances?.ETH?.balance
    ? parseFloat(walletBalances.ETH.balance).toFixed(4)
    : '0.0000';

  const lastReceipt = receipts[0] || null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
      {/* Card 1: Real Session Trades */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Session Trades
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {totalTrades}
            </span>
            <span className="text-xs text-slate-500">
              {totalTrades === 1 ? 'swap executed' : 'swaps executed'}
            </span>
          </div>

          <p className="text-xs text-slate-600 truncate mt-1">
            {lastReceipt ? (
              <span className="font-mono">
                Last: <strong className="text-slate-900">{lastReceipt.amountIn} {lastReceipt.tokenIn}</strong> → <strong className="text-emerald-600">{lastReceipt.amountOut} {lastReceipt.tokenOut}</strong>
              </span>
            ) : (
              <span className="text-slate-400">Ready for first trade instruction</span>
            )}
          </p>
        </div>

        {/* Real Activity Bars representing actual trades in this session */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Executed Receipts</span>
          <div className="flex items-center gap-1">
            {totalTrades === 0 ? (
              <span className="text-[10px] text-slate-400 font-mono">0 / 0 confirmed</span>
            ) : (
              Array.from({ length: Math.min(totalTrades, 8) }).map((_, i) => (
                <span
                  key={i}
                  className="w-2 h-4 bg-indigo-600 rounded-sm inline-block"
                  title={`Trade #${i + 1} confirmed`}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Card 2: Real Burner Wallet Gas & Liquidity */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Burner Gas Reserves
            </span>
            <Fuel className="w-3.5 h-3.5 text-amber-500" />
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {ethBalance}
            </span>
            <span className="text-xs text-slate-500 font-mono">ETH</span>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            Est. Gas: <span className="font-mono text-slate-700">~0.00035 ETH</span> / swap
          </p>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Safety Rail Cap</span>
          <span className="font-mono font-semibold text-slate-800">0.5000 ETH</span>
        </div>
      </div>

      {/* Card 3: Real DEX Protocol & AI Engine */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              DEX Protocol
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
              Uniswap V2
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mb-1">
            <a
              href="https://sepolia.etherscan.io/address/0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
            >
              <span>0xC532...4008</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            Engine: <span className="font-semibold text-slate-700">Gemini 3 Flash</span> (120s TTL)
          </p>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Pre-flight Checks</span>
          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Simulation Active
          </span>
        </div>
      </div>
    </div>
  );
}
