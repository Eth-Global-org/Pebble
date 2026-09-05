import React from 'react';
import { X, ExternalLink, Coins, ArrowRight, Shield } from 'lucide-react';

export function TokenListModal({ isOpen, onClose, tokens, walletBalances, onSelectToken }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-5 shadow-xl relative text-slate-900 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900">Supported Token Whitelist</h3>
              <p className="text-[11px] text-slate-400">Sepolia Testnet DEX Pairs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {tokens.map((token) => {
            const balanceData = walletBalances?.[token.symbol];
            const balanceFormatted = balanceData?.balance || '0.0';

            return (
              <div
                key={token.symbol}
                className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 font-bold text-xs flex items-center justify-center text-indigo-700">
                    {token.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-slate-900">{token.name}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-600 border border-slate-200">
                        {token.symbol}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <span>Decimals: {token.decimals}</span>
                      <span>•</span>
                      {token.isNative ? (
                        <span className="text-indigo-600 font-medium">Native Gas</span>
                      ) : (
                        <a
                          href={`https://sepolia.etherscan.io/address/${token.address}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-indigo-600 inline-flex items-center gap-0.5 font-mono text-[10px]"
                        >
                          <span>{token.address.slice(0, 6)}...{token.address.slice(-4)}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Balance</div>
                  <div className="font-mono font-semibold text-xs text-slate-900">
                    {parseFloat(balanceFormatted).toFixed(4)}
                  </div>
                  {onSelectToken && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectToken(token);
                        onClose();
                      }}
                      className="mt-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-0.5"
                    >
                      <span>Trade</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
