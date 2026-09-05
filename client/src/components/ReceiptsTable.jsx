import React, { useState } from 'react';
import { Search, ExternalLink, ArrowRight, ShieldCheck, Receipt as ReceiptIcon } from 'lucide-react';

export function ReceiptsTable({ receipts = [] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = receipts.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.receiptId?.toLowerCase().includes(term) ||
      r.tokenIn?.toLowerCase().includes(term) ||
      r.tokenOut?.toLowerCase().includes(term) ||
      (r.txHash && r.txHash.toLowerCase().includes(term))
    );
  });

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-sm overflow-hidden text-xs">
      {/* Table Toolbar */}
      <div className="p-3 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-white">
        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search receipts by token, ID, or tx..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <span className="text-xs font-mono text-slate-500">
          {filtered.length} {filtered.length === 1 ? 'receipt' : 'receipts'}
        </span>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-2">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <ReceiptIcon className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-slate-800">No Trade Receipts Yet</h4>
            <p className="text-[11px] text-slate-400 max-w-sm">
              Execute a swap in the Trading Terminal to generate an on-chain receipt with transaction hash, execution rate, and gas metrics.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/70 text-[11px] font-semibold text-slate-500 bg-slate-50/50">
                <th className="py-2.5 px-4 font-medium">Receipt ID</th>
                <th className="py-2.5 px-4 font-medium">Pair</th>
                <th className="py-2.5 px-4 font-medium">Sold</th>
                <th className="py-2.5 px-4 font-medium">Received</th>
                <th className="py-2.5 px-4 font-medium">Effective Rate</th>
                <th className="py-2.5 px-4 font-medium">Gas (ETH)</th>
                <th className="py-2.5 px-4 font-medium">Tx Hash</th>
                <th className="py-2.5 px-4 font-medium">Time</th>
                <th className="py-2.5 px-4 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
              {filtered.map((r) => (
                <tr key={r.receiptId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-indigo-600">
                    {r.receiptId}
                  </td>
                  <td className="py-2.5 px-4 font-sans font-medium flex items-center gap-1 text-slate-900">
                    <span>{r.tokenIn}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span>{r.tokenOut}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    {r.amountIn} {r.tokenIn}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-emerald-600">
                    {r.amountOut} {r.tokenOut}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 font-sans">
                    {r.rate}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500">
                    {r.estimatedGasEth}
                  </td>
                  <td className="py-2.5 px-4">
                    {r.txHash ? (
                      <a
                        href={r.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 font-sans"
                      >
                        <span>{r.txHash.slice(0, 6)}...{r.txHash.slice(-4)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 font-sans">
                    {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-4 text-right font-sans">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Confirmed</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
