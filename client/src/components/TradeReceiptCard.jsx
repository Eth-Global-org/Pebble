import React, { useState } from 'react';
import { Receipt, Check, Copy, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';

export function TradeReceiptCard({ receipt }) {
  const [copied, setCopied] = useState(false);

  if (!receipt) return null;

  const copyTx = () => {
    if (receipt.txHash) {
      navigator.clipboard.writeText(receipt.txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedDate = new Date(receipt.timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="bg-[#111620] border border-emerald-500/30 rounded-2xl p-5 shadow-2xl my-3 text-slate-100 animate-in fade-in duration-200">
      {/* Receipt Top Banner */}
      <div className="flex items-center justify-between border-b border-[#232B3B] pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">On-Chain Swap Receipt</h3>
            <p className="font-mono text-[11px] text-slate-400">{receipt.receiptId}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Settled</span>
        </div>
      </div>

      {/* Main Trade Details */}
      <div className="bg-[#0B0E14] border border-[#232B3B] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-400">Sold</span>
            <div className="text-base font-bold text-slate-100 font-mono">
              {receipt.amountIn} {receipt.tokenIn}
            </div>
          </div>

          <div className="p-1.5 bg-[#151A23] rounded-full text-slate-500 border border-[#232B3B]">
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="space-y-0.5 text-right">
            <span className="text-[11px] uppercase tracking-wider text-slate-400">Received</span>
            <div className="text-base font-bold text-emerald-400 font-mono">
              {receipt.amountOut} {receipt.tokenOut}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#232B3B]/80 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Execution Rate</span>
            <span className="font-mono text-slate-200">
              1 {receipt.tokenIn} = {receipt.rate} {receipt.tokenOut}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">Gas Cost</span>
            <span className="font-mono text-slate-200">~{receipt.estimatedGasEth} ETH</span>
          </div>
        </div>
      </div>

      {/* Footer Info: Hash & Explorer */}
      <div className="mt-3 pt-3 border-t border-[#232B3B]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <span>Tx:</span>
          <span className="font-mono text-slate-300">
            {receipt.txHash ? `${receipt.txHash.slice(0, 8)}...${receipt.txHash.slice(-6)}` : 'N/A'}
          </span>
          {receipt.txHash && (
            <button
              type="button"
              onClick={copyTx}
              title="Copy Tx Hash"
              className="p-1 hover:bg-[#232B3B] rounded text-slate-400 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500">{formattedDate}</span>
          {receipt.explorerUrl && (
            <a
              href={receipt.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium hover:underline"
            >
              <span>Etherscan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
