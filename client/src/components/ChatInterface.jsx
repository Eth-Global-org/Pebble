import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Trash2, ArrowRight } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal.jsx';
import { TransactionStatus } from './TransactionStatus.jsx';
import { ErrorBanner } from './ErrorBanner.jsx';
import { TradeReceiptCard } from './TradeReceiptCard.jsx';

const SAMPLE_PROMPTS = [
  'Swap 0.05 ETH for USDC',
  'Trade 10 USDC for LINK',
  'What was my last trade?',
  'What tokens are supported?'
];

export function ChatInterface({
  messages,
  onSendMessage,
  onConfirmTrade,
  onCancelTrade,
  onClearChat,
  isLoading,
  isExecuting
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isExecuting]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isExecuting) return;
    const text = input;
    setInput('');
    onSendMessage(text);
  };

  const handlePromptChipClick = (promptText) => {
    if (isLoading || isExecuting) return;
    onSendMessage(promptText);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full bg-[#0B0E14] rounded-2xl border border-[#232B3B] overflow-hidden shadow-2xl">
      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4 my-8">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-500 flex items-center justify-center shadow-inner">
              <Bot className="w-7 h-7" />
            </div>
            <div className="max-w-md">
              <h2 className="text-xl font-bold text-white mb-2">Trade with Plain English</h2>
              <p className="text-sm text-slate-400">
                Type natural language trade instructions like <span className="text-slate-200 font-mono">"swap 0.05 ETH for USDC"</span>. 
                We parse your intent, simulate the swap, and execute on Sepolia only when you confirm.
              </p>
            </div>

            {/* Starter Suggestion Chips */}
            <div className="w-full max-w-lg pt-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 justify-center">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                <span>Try an example instruction</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAMPLE_PROMPTS.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => handlePromptChipClick(sample)}
                    className="text-left text-xs bg-[#151A23] hover:bg-[#232B3B] text-slate-300 hover:text-white border border-[#232B3B] rounded-xl p-3 transition-colors flex items-center justify-between group"
                  >
                    <span>{sample}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`flex items-start gap-3 animate-in fade-in duration-200 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-semibold ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-[#151A23] text-brand-500 border border-[#232B3B]'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble Content */}
            <div className={`max-w-[85%] md:max-w-[75%] space-y-2`}>
              {/* Text message */}
              {msg.text && (
                <div
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-[#151A23] text-slate-200 border border-[#232B3B] rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              )}

              {/* Error Banner if attached */}
              {msg.error && (
                <ErrorBanner
                  error={msg.error}
                  onRetry={() => msg.retryPrompt && onSendMessage(msg.retryPrompt)}
                />
              )}

              {/* Confirmation Modal / Card */}
              {msg.proposal && !msg.execution && !msg.isCancelled && (
                <ConfirmationModal
                  proposal={msg.proposal}
                  onConfirm={(proposalId) => onConfirmTrade(proposalId, msg.id)}
                  onCancel={() => onCancelTrade(msg.id)}
                  isExecuting={isExecuting}
                />
              )}

              {/* Cancelled State notice */}
              {msg.isCancelled && (
                <div className="bg-[#151A23] border border-[#232B3B] rounded-xl p-3 text-xs text-slate-400 italic">
                  Trade cancelled by user. No on-chain transaction was sent.
                </div>
              )}

              {/* Transaction Execution Status */}
              {msg.execution && (
                <TransactionStatus
                  execution={msg.execution}
                  onNewTrade={() => inputRef.current?.focus()}
                />
              )}

              {/* On-Chain Trade Receipt */}
              {msg.receipt && (
                <TradeReceiptCard receipt={msg.receipt} />
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 animate-in fade-in">
            <div className="w-8 h-8 rounded-xl bg-[#151A23] text-brand-500 border border-[#232B3B] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#151A23] border border-[#232B3B] rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-400 ml-1">Parsing intent & simulating Uniswap route...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Footer */}
      <div className="p-3 md:p-4 bg-[#151A23] border-t border-[#232B3B]">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={onClearChat}
              title="Clear chat history"
              className="p-3 text-slate-400 hover:text-white hover:bg-[#232B3B] rounded-xl transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. 'Swap 0.05 ETH for USDC' or 'Trade 10 DAI for LINK'..."
              disabled={isLoading || isExecuting}
              className="w-full bg-[#0B0E14] border border-[#232B3B] focus:border-brand-500 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none transition-colors disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading || isExecuting}
            className="p-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:hover:bg-brand-500 text-black rounded-xl font-semibold transition-all shadow-lg shadow-brand-500/20 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
