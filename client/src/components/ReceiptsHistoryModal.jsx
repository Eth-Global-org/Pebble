import React from 'react';
import { X, Receipt, ExternalLink, ArrowRight } from 'lucide-react';

export function ReceiptsHistoryModal({ isOpen, onClose, receipts }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-5 shadow-xl relative text-slate-900 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900">Trade Receipts History</h3>
              <p className="text-[11px] text-slate-400">Current Session Records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {(!receipts || receipts.length === 0) ? (
          <div className="py-10 text-center text-slate-400 text-xs font-sans">
            No trades executed yet in this session.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 font-mono">
            {receipts.map((receipt) => (
              <div
                key={receipt.receiptId}
                className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5 hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-600">{receipt.receiptId}</span>
                  <span className="text-[10px] text-slate-400 font-sans">
                    {new Date(receipt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center justify-between font-semibold text-xs">
                  <span className="text-slate-900">{receipt.amountIn} {receipt.tokenIn}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="text-emerald-600">{receipt.amountOut} {receipt.tokenOut}</span>
                </div>

                <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Rate: {receipt.rate}</span>
                  {receipt.explorerUrl && (
                    <a
                      href={receipt.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-0.5 text-indigo-600 hover:underline font-sans"
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
