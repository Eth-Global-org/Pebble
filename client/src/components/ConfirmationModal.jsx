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
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg my-3 text-slate-900 animate-in fade-in duration-150">
      {/* Header & Expiry Countdown */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
          <h3 className="font-semibold text-sm text-slate-900">Trade Confirmation</h3>
        </div>
        <div className={`flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-full border ${
          isExpired 
            ? 'bg-red-50 border-red-200 text-red-600' 
            : secondsRemaining < 30 
              ? 'bg-amber-50 border-amber-200 text-amber-600' 
              : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{isExpired ? 'Quote Expired' : `${secondsRemaining}s remaining`}</span>
        </div>
      </div>

      {/* Trade Parameter Cards */}
      <div className="space-y-2">
        {/* You Pay */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block mb-0.5">You Pay</span>
            <span className="text-lg font-bold text-slate-900 font-mono tracking-tight">
              {proposal.amountInFormatted}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
            <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center">
              {proposal.tokenIn.symbol.slice(0, 1)}
            </div>
            <span className="font-semibold text-xs text-slate-900">{proposal.tokenIn.symbol}</span>
          </div>
        </div>

        {/* Arrow Divider */}
        <div className="flex justify-center -my-1 relative z-10">
          <div className="bg-white border border-slate-200 p-1 rounded-full text-slate-400 shadow-xs">
            <ArrowDown className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* You Receive (Estimated) */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block mb-0.5">Estimated Output</span>
            <span className="text-lg font-bold text-emerald-600 font-mono tracking-tight">
              {parseFloat(proposal.estimatedAmountOutFormatted).toFixed(6)}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
            <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center">
              {proposal.tokenOut.symbol.slice(0, 1)}
            </div>
            <span className="font-semibold text-xs text-slate-900">{proposal.tokenOut.symbol}</span>
          </div>
        </div>
      </div>

      {/* Safety & Protocol Breakdown Details */}
      <div className="mt-3 bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs text-slate-600 font-mono">
        <div className="flex items-center justify-between">
          <span className="font-sans text-slate-500">Min. Received (slippage {proposal.slippagePercent}%):</span>
          <span className="text-slate-900">{parseFloat(proposal.minAmountOutFormatted).toFixed(6)} {proposal.tokenOut.symbol}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-sans text-slate-500 flex items-center gap-1"><Fuel className="w-3.5 h-3.5" /> Est. Gas Fee:</span>
          <span className="text-slate-900">~{parseFloat(proposal.estimatedGasEth).toFixed(5)} ETH</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-sans text-slate-500">Router / DEX:</span>
          <span className="text-slate-900">Uniswap V2 (Sepolia)</span>
        </div>
        {proposal.priceImpactPercent > 0 && (
          <div className="flex items-center justify-between">
            <span className="font-sans text-slate-500">Price Impact:</span>
            <span className={`font-semibold ${isHighImpact ? 'text-amber-600' : 'text-slate-900'}`}>
              {proposal.priceImpactPercent}%
            </span>
          </div>
        )}
      </div>

      {/* Warnings & Approvals */}
      {proposal.requiresApproval && (
        <div className="mt-2.5 flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl p-2.5 text-xs text-indigo-700 font-sans">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>One-time ERC-20 approval will be automatically submitted prior to the swap.</span>
        </div>
      )}

      {isHighImpact && (
        <div className="mt-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-sans">
          <div className="flex items-start gap-2 mb-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>High Price Impact: This swap may cause substantial slippage.</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasAcknowledgedImpact}
              onChange={(e) => setHasAcknowledgedImpact(e.target.checked)}
              className="rounded border-amber-300 text-amber-600 focus:ring-0"
            />
            <span className="font-medium text-amber-900">I understand and want to proceed</span>
          </label>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 flex items-center gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          disabled={isExecuting}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </button>

        <button
          type="button"
          onClick={() => onConfirm(proposal.proposalId)}
          disabled={!canConfirm}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          {isExecuting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Executing Swap...</span>
            </>
          ) : isExpired ? (
            <span>Expired — Re-request</span>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Confirm & Swap</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
