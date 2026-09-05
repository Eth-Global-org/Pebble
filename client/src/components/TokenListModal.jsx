import React from 'react';
import { X, ExternalLink, Coins, ArrowRight, Shield } from 'lucide-react';

export function TokenListModal({ isOpen, onClose, tokens, walletBalances, onSelectToken }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#151A23] border border-[#232B3B] rounded-2xl w-full max-w-lg p-5 shadow-2xl relative text-slate-100 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#232B3B] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-500/10 text-brand-500 rounded-lg">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Supported Tokens</h3>
              <p className="text-xs text-slate-400">Sepolia EVM Whitelist</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#232B3B] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {tokens.map((token) => {
            const balanceData = walletBalances?.[token.symbol];
            const balanceFormatted = balanceData?.balance || '0.0';

            return (
              <div
                key={token.symbol}
                className="bg-[#0B0E14] border border-[#232B3B] rounded-xl p-3.5 flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 font-bold text-xs flex items-center justify-center text-slate-200">
                    {token.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">{token.name}</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#151A23] text-slate-300 border border-[#232B3B]">
                        {token.symbol}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span>Decimals: {token.decimals}</span>
                      <span>•</span>
                      {token.isNative ? (
                        <span className="text-emerald-400 font-medium">Native Gas Token</span>
                      ) : (
                        <a
                          href={`https://sepolia.etherscan.io/address/${token.address}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-brand-400 inline-flex items-center gap-1 font-mono text-[11px]"
                        >
                          <span>{token.address.slice(0, 6)}...{token.address.slice(-4)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400 mb-1">Burner Balance</div>
                  <div className="font-mono font-semibold text-xs text-slate-100">
                    {parseFloat(balanceFormatted).toFixed(4)} {token.symbol}
                  </div>
                  {onSelectToken && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectToken(token);
                        onClose();
                      }}
                      className="mt-1.5 text-[11px] font-medium text-brand-500 hover:text-brand-400 inline-flex items-center gap-1"
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

        <div className="mt-4 pt-3 border-t border-[#232B3B] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-brand-500" />
            <span>Strict whitelist: Unlisted tokens are rejected automatically.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
