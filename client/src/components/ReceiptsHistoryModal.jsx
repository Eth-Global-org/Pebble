import React from 'react';
import { X, Receipt, ExternalLink, ArrowRight } from 'lucide-react';

export function ReceiptsHistoryModal({ isOpen, onClose, receipts }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#151A23] border border-[#232B3B] rounded-2xl w-full max-w-lg p-5 shadow-2xl relative text-slate-100 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#232B3B] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Trade Receipts History</h3>
              <p className="text-xs text-slate-400">Current Session Records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#232B3B] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {(!receipts || receipts.length === 0) ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No trades executed yet in this session.
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {receipts.map((receipt) => (
              <div
                key={receipt.receiptId}
                className="bg-[#0B0E14] border border-[#232B3B] rounded-xl p-3.5 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400">{receipt.receiptId}</span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(receipt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center justify-between font-mono font-semibold text-sm">
                  <span>{receipt.amountIn} {receipt.tokenIn}</span>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <span className="text-emerald-400">{receipt.amountOut} {receipt.tokenOut}</span>
                </div>

                <div className="pt-2 border-t border-[#232B3B]/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Rate: 1 {receipt.tokenIn} = {receipt.rate} {receipt.tokenOut}</span>
                  {receipt.explorerUrl && (
                    <a
                      href={receipt.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                    >
                      <span>Etherscan</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
