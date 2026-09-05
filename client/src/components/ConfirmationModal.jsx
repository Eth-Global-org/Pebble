import React, { useState, useEffect } from 'react';
import { ArrowDown, AlertTriangle, ShieldCheck, Clock, Check, X, Fuel } from 'lucide-react';

export function ConfirmationModal({ proposal, onConfirm, onCancel, isExecuting }) {
  const [hasAcknowledgedImpact, setHasAcknowledgedImpact] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(120);

  useEffect(() => {
    if (!proposal?.expiresAt) return;

    const updateTimer = () => {
      const diffMs = proposal.expiresAt - Date.now();
      const remaining = Math.max(0, Math.floor(diffMs / 1000));
      setSecondsRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [proposal?.expiresAt]);

  if (!proposal) return null;

  const isExpired = secondsRemaining === 0;
  const isHighImpact = proposal.requiresAcknowledgment || proposal.priceImpactPercent > 5.0;
  const canConfirm = !isExpired && !isExecuting && (!isHighImpact || hasAcknowledgedImpact);

  return (
    <div className="bg-[#151A23] border border-[#232B3B] rounded-2xl p-5 shadow-2xl my-4 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
      {/* Header & Expiry Countdown */}
      <div className="flex items-center justify-between border-b border-[#232B3B] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
          <h3 className="font-semibold text-base text-white">Trade Confirmation</h3>
        </div>
        <div className={`flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-full border ${
          isExpired 
            ? 'bg-red-950/60 border-red-800 text-red-400' 
            : secondsRemaining < 30 
              ? 'bg-amber-950/60 border-amber-800 text-amber-300' 
              : 'bg-[#0B0E14] border-[#232B3B] text-slate-400'
        }`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{isExpired ? 'Quote Expired' : `${secondsRemaining}s remaining`}</span>
        </div>
      </div>

      {/* Trade Parameter Cards */}
      <div className="space-y-2">
        {/* You Pay */}
        <div className="bg-[#0B0E14] border border-[#232B3B] rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block mb-1">You Pay</span>
            <span className="text-xl font-bold text-white tracking-tight">
              {proposal.amountInFormatted}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-[#151A23] border border-[#232B3B] px-3 py-1.5 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-500 font-bold text-xs flex items-center justify-center">
              {proposal.tokenIn.symbol.slice(0, 1)}
            </div>
            <span className="font-semibold text-sm">{proposal.tokenIn.symbol}</span>
          </div>
        </div>

        {/* Arrow Divider */}
        <div className="flex justify-center -my-1.5 relative z-10">
          <div className="bg-[#151A23] border border-[#232B3B] p-1.5 rounded-full text-slate-400 shadow-md">
            <ArrowDown className="w-4 h-4" />
          </div>
        </div>

        {/* You Receive (Estimated) */}
        <div className="bg-[#0B0E14] border border-[#232B3B] rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block mb-1">Estimated Output</span>
            <span className="text-xl font-bold text-emerald-400 tracking-tight">
              {parseFloat(proposal.estimatedAmountOutFormatted).toFixed(6)}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-[#151A23] border border-[#232B3B] px-3 py-1.5 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
              {proposal.tokenOut.symbol.slice(0, 1)}
            </div>
            <span className="font-semibold text-sm">{proposal.tokenOut.symbol}</span>
          </div>
        </div>
      </div>

      {/* Safety & Protocol Breakdown Details */}
      <div className="mt-4 bg-[#0B0E14]/60 border border-[#232B3B]/60 rounded-xl p-3 space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span>Minimum Received (after {proposal.slippagePercent}% slippage):</span>
          <span className="font-mono text-slate-200">{parseFloat(proposal.minAmountOutFormatted).toFixed(6)} {proposal.tokenOut.symbol}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1"><Fuel className="w-3.5 h-3.5" /> Estimated Gas Cost:</span>
          <span className="font-mono text-slate-200">~{parseFloat(proposal.estimatedGasEth).toFixed(5)} ETH</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Network / DEX Router:</span>
          <span className="text-slate-200">Sepolia (Uniswap V2)</span>
        </div>
        {proposal.priceImpactPercent > 0 && (
          <div className="flex items-center justify-between text-slate-400">
            <span>Price Impact:</span>
            <span className={`font-mono font-medium ${isHighImpact ? 'text-amber-400' : 'text-slate-200'}`}>
              {proposal.priceImpactPercent}%
            </span>
          </div>
        )}
      </div>

      {/* Warnings & Approvals */}
      {proposal.requiresApproval && (
        <div className="mt-3 flex items-center gap-2 bg-indigo-950/30 border border-indigo-700/40 rounded-xl p-2.5 text-xs text-indigo-300">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>One-time ERC-20 approval will be automatically submitted prior to the swap.</span>
        </div>
      )}

      {isHighImpact && (
        <div className="mt-3 bg-amber-950/30 border border-amber-600/40 rounded-xl p-3 text-xs text-amber-200">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>High Price Impact Warning: This swap may cause substantial slippage.</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none mt-1">
            <input
              type="checkbox"
              checked={hasAcknowledgedImpact}
              onChange={(e) => setHasAcknowledgedImpact(e.target.checked)}
              className="rounded border-amber-600 bg-amber-950/50 text-amber-500 focus:ring-0 focus:ring-offset-0"
            />
            <span className="font-medium text-amber-300">I understand and want to proceed anyway</span>
          </label>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isExecuting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#232B3B] hover:bg-[#232B3B]/60 text-slate-300 text-sm font-medium transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          <span>Cancel</span>
        </button>

        <button
          type="button"
          onClick={() => onConfirm(proposal.proposalId)}
          disabled={!canConfirm}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-black text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20"
        >
          {isExecuting ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>Executing Swap...</span>
            </>
          ) : isExpired ? (
            <span>Expired — Re-request</span>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Confirm & Swap</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
