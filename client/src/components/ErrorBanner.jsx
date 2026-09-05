import React from 'react';
import { AlertCircle, ExternalLink, RefreshCw, X } from 'lucide-react';

export function ErrorBanner({ error, onDismiss, onRetry }) {
  if (!error) return null;

  const isGasError = error.code === 'INSUFFICIENT_GAS';
  const isRecoverable = error.recoverable !== false;

  return (
    <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-4 my-3 text-red-200 animate-in fade-in duration-200 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-500/20 text-red-400 rounded-lg shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-red-300 text-sm">Validation Error</span>
              {error.code && (
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-red-900/60 border border-red-700/40 text-red-300">
                  {error.code}
                </span>
              )}
            </div>
            <p className="text-sm text-red-200/90 leading-relaxed">{error.message}</p>

            {isGasError && (
              <div className="mt-3">
                <a
                  href="https://sepoliafaucet.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-700/40 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <span>Get Free Sepolia Testnet ETH</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onRetry && isRecoverable && (
            <button
              onClick={onRetry}
              title="Retry"
              className="p-1.5 text-red-300 hover:text-white hover:bg-red-900/40 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              title="Dismiss"
              className="p-1.5 text-red-300 hover:text-white hover:bg-red-900/40 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
