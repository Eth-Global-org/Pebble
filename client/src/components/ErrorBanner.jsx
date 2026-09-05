import React from 'react';
import { AlertCircle, ExternalLink, RefreshCw, X } from 'lucide-react';

export function ErrorBanner({ error, onDismiss, onRetry }) {
  if (!error) return null;

  const isGasError = error.code === 'INSUFFICIENT_GAS';
  const isRecoverable = error.recoverable !== false;

  return (
    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 my-2.5 text-rose-900 shadow-xs animate-in fade-in duration-150">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-1 bg-rose-100 text-rose-600 rounded-lg shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-xs text-rose-900">Validation Notice</span>
              {error.code && (
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300">
                  {error.code}
                </span>
              )}
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">{error.message}</p>

            {isGasError && (
              <div className="mt-2.5">
                <a
                  href="https://sepoliafaucet.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition-colors shadow-xs"
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
              className="p-1 text-rose-400 hover:text-rose-700 hover:bg-rose-100 rounded transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              title="Dismiss"
              className="p-1 text-rose-400 hover:text-rose-700 hover:bg-rose-100 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
