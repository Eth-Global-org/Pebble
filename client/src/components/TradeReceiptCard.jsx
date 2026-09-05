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
    minute: '2-digit'
  });

  return (
    <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm my-3 text-slate-800 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-xs text-slate-900">Settled Trade Receipt</h4>
            <span className="font-mono text-[10px] text-slate-400">{receipt.receiptId}</span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3 h-3" />
          <span>Settled</span>
        </span>
      </div>

      {/* Main Trade Details */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-medium text-slate-400 block">Sold</span>
            <div className="text-sm font-bold text-slate-900 font-mono">
              {receipt.amountIn} {receipt.tokenIn}
            </div>
          </div>

          <div className="p-1 bg-white rounded-full text-slate-400 border border-slate-200 shadow-xs">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-medium text-slate-400 block">Received</span>
            <div className="text-sm font-bold text-emerald-600 font-mono">
              {receipt.amountOut} {receipt.tokenOut}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-slate-400 block text-[10px]">Execution Rate</span>
            <span className="font-mono font-medium text-slate-700">
              1 {receipt.tokenIn} = {receipt.rate} {receipt.tokenOut}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px]">Estimated Gas</span>
            <span className="font-mono text-slate-700">~{receipt.estimatedGasEth} ETH</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
          <span>Tx:</span>
          <span>{receipt.txHash ? `${receipt.txHash.slice(0, 6)}...${receipt.txHash.slice(-4)}` : 'N/A'}</span>
          {receipt.txHash && (
            <button
              onClick={copyTx}
              className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">{formattedDate}</span>
          {receipt.explorerUrl && (
            <a
              href={receipt.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:text-indigo-800 text-[11px] font-medium inline-flex items-center gap-0.5 hover:underline"
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
