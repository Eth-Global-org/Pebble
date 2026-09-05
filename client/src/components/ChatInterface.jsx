import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Trash2, ArrowRight } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal.jsx';
import { TransactionStatus } from './TransactionStatus.jsx';
import { ErrorBanner } from './ErrorBanner.jsx';
import { TradeReceiptCard } from './TradeReceiptCard.jsx';

const SAMPLE_PROMPTS = [
  'Swap 0.05 ETH for USDC',
  'Trade 10 USDC for LINK',
  'What is my current balance?',
  'What was my last trade?'
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
    <div className="flex flex-col h-[580px] bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header bar of Chat terminal */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-800">NLP Trading Terminal</span>
          <span className="text-[10px] font-mono text-slate-400">Gemini 3 Flash</span>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={onClearChat}
            title="Clear Chat History"
            className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div className="max-w-md">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Interactive Trading Assistant</h3>
              <p className="text-xs text-slate-500">
                Execute swaps with plain English commands, inspect live balances, or request transaction histories.
              </p>
            </div>

            {/* Starter Chips */}
            <div className="w-full max-w-md pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAMPLE_PROMPTS.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => handlePromptChipClick(sample)}
                    className="text-left text-xs bg-slate-50 hover:bg-slate-100/80 text-slate-700 border border-slate-200 rounded-lg p-2.5 transition-colors flex items-center justify-between group"
                  >
                    <span>{sample}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`flex items-start gap-2.5 animate-in fade-in duration-150 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            {/* Bubble Content */}
            <div className="max-w-[85%] sm:max-w-[80%] space-y-2">
              {msg.text && (
                <div
                  className={`p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-50 text-slate-800 border border-slate-200'
                  }`}
                >
                  {msg.text}
                </div>
              )}

              {/* Error Banner */}
              {msg.error && (
                <ErrorBanner
                  error={msg.error}
                  onRetry={() => msg.retryPrompt && onSendMessage(msg.retryPrompt)}
                />
              )}

              {/* Confirmation Modal */}
              {msg.proposal && !msg.execution && !msg.isCancelled && (
                <ConfirmationModal
                  proposal={msg.proposal}
                  onConfirm={(proposalId) => onConfirmTrade(proposalId, msg.id)}
                  onCancel={() => onCancelTrade(msg.id)}
                  isExecuting={isExecuting}
                />
              )}

              {/* Cancelled Notice */}
              {msg.isCancelled && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-500 italic">
                  Trade cancelled. No on-chain transaction was submitted.
                </div>
              )}

              {/* Live Execution Status */}
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

        {/* Loading Bounce */}
        {isLoading && (
          <div className="flex items-start gap-2.5 animate-in fade-in">
            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] text-slate-500 ml-1 font-mono">Parsing intent with Gemini...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type 'Swap 0.05 ETH for USDC' or ask 'What is my current balance?'..."
            disabled={isLoading || isExecuting}
            className="flex-1 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading || isExecuting}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-lg transition-all shadow-xs shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
