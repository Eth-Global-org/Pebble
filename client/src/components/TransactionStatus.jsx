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
    <div className={`rounded-2xl border p-5 my-4 text-slate-100 shadow-xl animate-in fade-in zoom-in-95 duration-200 ${
      isConfirmed 
        ? 'bg-emerald-950/20 border-emerald-500/30' 
        : isFailed 
          ? 'bg-red-950/20 border-red-500/30' 
          : 'bg-[#151A23] border-[#232B3B]'
    }`}>
      {/* Title & Status Indicator */}
      <div className="flex items-center justify-between border-b border-[#232B3B] pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          {isPending && <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />}
          {isConfirmed && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {isFailed && <XCircle className="w-5 h-5 text-red-400" />}
          
          <h3 className="font-semibold text-base">
            {isPending && 'Submitting On-Chain Transaction...'}
            {isConfirmed && 'Transaction Confirmed!'}
            {isFailed && 'Transaction Failed'}
          </h3>
        </div>

        <span className={`text-xs font-mono font-medium px-2.5 py-1 rounded-full uppercase border ${
          isConfirmed 
            ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300' 
            : isFailed 
              ? 'bg-red-950/80 border-red-700/60 text-red-300' 
              : 'bg-indigo-950/80 border-indigo-700/60 text-indigo-300 animate-pulse'
        }`}>
          {execution.status}
        </span>
      </div>

      {/* Execution Pipeline Steps */}
      <div className="grid grid-cols-3 gap-2 my-4 text-xs">
        {/* Step 1 */}
        <div className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-1.5 ${
          execution.approvalTxHash || isConfirmed || execution.status === 'swapping'
            ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
            : execution.status === 'approving'
              ? 'bg-indigo-950/40 border-indigo-700/60 text-indigo-300'
              : 'bg-[#0B0E14] border-[#232B3B] text-slate-400'
        }`}>
          <div className="font-medium">1. Approval</div>
          <span className="text-[10px] opacity-80">
            {execution.approvalTxHash ? 'Approved' : 'Not Needed / Done'}
          </span>
        </div>

        {/* Step 2 */}
        <div className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-1.5 ${
          isConfirmed
            ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
            : execution.status === 'swapping'
              ? 'bg-indigo-950/40 border-indigo-700/60 text-indigo-300'
              : 'bg-[#0B0E14] border-[#232B3B] text-slate-400'
        }`}>
          <div className="font-medium">2. Uniswap Router</div>
          <span className="text-[10px] opacity-80">
            {isConfirmed ? 'Swap Executed' : execution.status === 'swapping' ? 'Broadcasting' : 'Pending'}
          </span>
        </div>

        {/* Step 3 */}
        <div className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-1.5 ${
          isConfirmed
            ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
            : isFailed
              ? 'bg-red-950/30 border-red-800/40 text-red-300'
              : 'bg-[#0B0E14] border-[#232B3B] text-slate-400'
        }`}>
          <div className="font-medium">3. Sepolia Receipt</div>
          <span className="text-[10px] opacity-80">
            {isConfirmed ? '1 Block Confirmed' : isFailed ? 'Reverted' : 'Awaiting'}
          </span>
        </div>
      </div>

      {/* Transaction Details & Etherscan Link */}
      {execution.txHash && (
        <div className="bg-[#0B0E14] border border-[#232B3B] rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Transaction Hash:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-slate-300 text-xs">
                {execution.txHash.slice(0, 10)}...{execution.txHash.slice(-8)}
              </span>
              <button
                type="button"
                onClick={copyTxHash}
                title="Copy Transaction Hash"
                className="p-1 hover:bg-[#232B3B] rounded text-slate-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-[#232B3B] flex items-center justify-between">
            <span className="text-xs text-slate-400">Sepolia Block Explorer:</span>
            <a
              href={execution.explorerUrl || `https://sepolia.etherscan.io/tx/${execution.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-500 hover:text-brand-400 transition-colors"
            >
              <span>View on Etherscan</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Failure message if any */}
      {isFailed && execution.errorMessage && (
        <div className="mt-3 p-3 bg-red-950/40 border border-red-700/50 rounded-xl text-xs text-red-300">
          <span className="font-semibold block mb-1">Revert Reason:</span>
          <span className="font-mono">{execution.errorMessage}</span>
        </div>
      )}

      {/* Next trade button */}
      {!isPending && onNewTrade && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onNewTrade}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#232B3B] hover:bg-[#334155] text-white text-xs font-medium transition-colors"
          >
            <span>Start Another Trade</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
