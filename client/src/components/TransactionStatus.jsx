import React, { useState } from 'react';
import { CheckCircle2, XCircle, ExternalLink, Copy, Check, Loader2, ArrowRight } from 'lucide-react';

export function TransactionStatus({ execution, onNewTrade }) {
  const [copied, setCopied] = useState(false);

  if (!execution) return null;

  const isPending = execution.status === 'pending' || execution.status === 'approving' || execution.status === 'swapping';
  const isConfirmed = execution.status === 'confirmed';
  const isFailed = execution.status === 'failed';

  const copyTxHash = () => {
    if (execution.txHash) {
      navigator.clipboard.writeText(execution.txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`rounded-xl border p-4 my-3 text-slate-800 shadow-sm animate-in fade-in duration-150 ${
      isConfirmed 
        ? 'bg-emerald-50/40 border-emerald-200' 
        : isFailed 
          ? 'bg-rose-50/40 border-rose-200' 
          : 'bg-white border-slate-200'
    }`}>
      {/* Title & Status Indicator */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          {isPending && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />}
          {isConfirmed && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          {isFailed && <XCircle className="w-4 h-4 text-rose-600" />}
          
          <h3 className="font-semibold text-xs text-slate-900">
            {isPending && 'Submitting On-Chain Swap...'}
            {isConfirmed && 'Transaction Confirmed'}
            {isFailed && 'Transaction Failed'}
          </h3>
        </div>

        <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-full uppercase border ${
          isConfirmed 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
            : isFailed 
              ? 'bg-rose-50 border-rose-200 text-rose-700' 
              : 'bg-indigo-50 border-indigo-200 text-indigo-700 animate-pulse'
        }`}>
          {execution.status}
        </span>
      </div>

      {/* Execution Pipeline Steps */}
      <div className="grid grid-cols-3 gap-2 my-3 text-[11px]">
        {/* Step 1 */}
        <div className={`p-2 rounded-lg border text-center ${
          execution.approvalTxHash || isConfirmed || execution.status === 'swapping'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
            : execution.status === 'approving'
              ? 'bg-indigo-50 border-indigo-200 text-indigo-800 font-medium'
              : 'bg-slate-50 border-slate-200 text-slate-400'
        }`}>
          <div>1. Approval</div>
          <span className="text-[10px] opacity-75">
            {execution.approvalTxHash ? 'Approved' : 'Done / Not Needed'}
          </span>
        </div>

        {/* Step 2 */}
        <div className={`p-2 rounded-lg border text-center ${
          isConfirmed
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
            : execution.status === 'swapping'
              ? 'bg-indigo-50 border-indigo-200 text-indigo-800 font-medium'
              : 'bg-slate-50 border-slate-200 text-slate-400'
        }`}>
          <div>2. Router Swap</div>
          <span className="text-[10px] opacity-75">
            {isConfirmed ? 'Executed' : execution.status === 'swapping' ? 'Broadcasting' : 'Pending'}
          </span>
        </div>

        {/* Step 3 */}
        <div className={`p-2 rounded-lg border text-center ${
          isConfirmed
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
            : isFailed
              ? 'bg-rose-50 border-rose-200 text-rose-800 font-medium'
              : 'bg-slate-50 border-slate-200 text-slate-400'
        }`}>
          <div>3. Sepolia Block</div>
          <span className="text-[10px] opacity-75">
            {isConfirmed ? '1 Block Confirmed' : isFailed ? 'Reverted' : 'Awaiting'}
          </span>
        </div>
      </div>

      {/* Transaction Details & Etherscan Link */}
      {execution.txHash && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Transaction:</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-slate-700">
                {execution.txHash.slice(0, 8)}...{execution.txHash.slice(-6)}
              </span>
              <button
                type="button"
                onClick={copyTxHash}
                title="Copy Hash"
                className="p-0.5 hover:bg-slate-200 rounded text-slate-500 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between">
            <span className="text-slate-500">Block Explorer:</span>
            <a
              href={execution.explorerUrl || `https://sepolia.etherscan.io/tx/${execution.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              <span>View on Etherscan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Failure message if any */}
      {isFailed && execution.errorMessage && (
        <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-mono">
          {execution.errorMessage}
        </div>
      )}

      {/* Next trade button */}
      {!isPending && onNewTrade && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onNewTrade}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
          >
            <span>Start Another Trade</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
