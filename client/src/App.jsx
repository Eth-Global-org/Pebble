import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Shield, Coins, Copy, Check, ExternalLink, Receipt } from 'lucide-react';
import { parseIntent, executeTrade, getWalletInfo, getSupportedTokens, getSessionReceipts, clearSession } from './services/api.js';
import { ChatInterface } from './components/ChatInterface.jsx';
import { TokenListModal } from './components/TokenListModal.jsx';
import { ReceiptsHistoryModal } from './components/ReceiptsHistoryModal.jsx';

export function App() {
  const [sessionId] = useState(() => {
    const saved = sessionStorage.getItem('swapchat_session_id');
    if (saved) return saved;
    const newId = 'session_' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('swapchat_session_id', newId);
    return newId;
  });

  const [messages, setMessages] = useState([]);
  const [walletInfo, setWalletInfo] = useState(null);
  const [supportedTokens, setSupportedTokens] = useState([]);
  const [sessionReceipts, setSessionReceipts] = useState([]);
  const [isTokensModalOpen, setIsTokensModalOpen] = useState(false);
  const [isReceiptsModalOpen, setIsReceiptsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      const data = await getWalletInfo();
      setWalletInfo(data);
    } catch {
      // Ignore initial background fetch error
    }
  }, []);

  const fetchTokens = useCallback(async () => {
    try {
      const data = await getSupportedTokens();
      if (data?.tokens) {
        setSupportedTokens(data.tokens);
      }
    } catch {
      // Ignore background fetch error
    }
  }, []);

  const fetchReceipts = useCallback(async () => {
    try {
      const list = await getSessionReceipts(sessionId);
      setSessionReceipts(list);
    } catch {
      // Ignore initial receipts fetch error
    }
  }, [sessionId]);

  useEffect(() => {
    fetchWallet();
    fetchTokens();
    fetchReceipts();
  }, [fetchWallet, fetchTokens, fetchReceipts]);

  const copyWalletAddress = () => {
    if (walletInfo?.address) {
      navigator.clipboard.writeText(walletInfo.address);
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessageId = Date.now();
    const userMessage = {
      id: userMessageId,
      role: 'user',
      text
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const data = await parseIntent(text, sessionId);

      if (!data.isTrade) {
        // Conversational or informational assistant response
        const botMessage = {
          id: Date.now() + 1,
          role: 'bot',
          text: data.message
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        // Trade intent parsed and simulated proposal generated
        const botMessage = {
          id: Date.now() + 1,
          role: 'bot',
          text: `I've prepared and simulated your trade: swap **${data.proposal.amountInFormatted} ${data.proposal.tokenIn.symbol}** for estimated **${parseFloat(data.proposal.estimatedAmountOutFormatted).toFixed(4)} ${data.proposal.tokenOut.symbol}** on Sepolia.\n\nPlease review the details below to confirm or cancel:`,
          proposal: data.proposal,
          intent: data.intent
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      // Standardized ApiError handling
      const errorMessage = {
        id: Date.now() + 1,
        role: 'bot',
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'An error occurred during trade parsing.',
          recoverable: error.recoverable !== false
        },
        retryPrompt: text
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTrade = async (proposalId, messageId) => {
    setIsExecuting(true);

    try {
      const result = await executeTrade(proposalId, sessionId);
      
      // Update the specific message in the conversation feed with execution results and receipt
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            return {
              ...msg,
              execution: result.execution,
              receipt: result.receipt || null
            };
          }
          return msg;
        })
      );

      if (result.receipt) {
        setSessionReceipts((prev) => [...prev, result.receipt]);
      }

      // Refresh wallet balance after swap
      await fetchWallet();
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            return {
              ...msg,
              error: {
                code: error.code || 'TRANSACTION_REVERTED',
                message: error.message || 'Failed to execute swap on-chain.',
                recoverable: true
              }
            };
          }
          return msg;
        })
      );
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCancelTrade = (messageId) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          return {
            ...msg,
            isCancelled: true
          };
        }
        return msg;
      })
    );
  };

  const handleClearChat = async () => {
    setMessages([]);
    try {
      await clearSession(sessionId);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-[#232B3B] bg-[#151A23]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 p-0.5 shadow-lg shadow-brand-500/10 flex items-center justify-center">
              <div className="w-full h-full bg-[#0B0E14] rounded-[10px] flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-brand-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight text-white">SwapChat</h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-brand-400 font-semibold">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">NLP-Powered Sepolia DEX Assistant</p>
            </div>
          </div>

          {/* Wallet, Network Pill & Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Receipts button */}
            <button
              type="button"
              onClick={() => setIsReceiptsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B0E14] border border-[#232B3B] hover:border-slate-600 text-xs font-medium text-slate-300 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Receipts</span>
              {sessionReceipts.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold">
                  {sessionReceipts.length}
                </span>
              )}
            </button>

            {/* Supported Tokens button */}
            <button
              type="button"
              onClick={() => setIsTokensModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B0E14] border border-[#232B3B] hover:border-slate-600 text-xs font-medium text-slate-300 transition-colors"
            >
              <Coins className="w-3.5 h-3.5 text-brand-500" />
              <span className="hidden sm:inline">Tokens</span>
            </button>

            {/* Network Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B0E14] border border-[#232B3B] text-xs font-mono text-slate-300">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Sepolia Testnet</span>
              <span className="sm:hidden">Sepolia</span>
            </div>

            {/* Burner Wallet Pill */}
            {walletInfo && (
              <div className="flex items-center gap-1 bg-[#0B0E14] border border-[#232B3B] rounded-xl px-2.5 py-1 text-xs">
                <span className="text-slate-400 text-[11px] hidden md:inline">Burner:</span>
                <span className="font-mono text-slate-200">
                  {walletInfo.address.slice(0, 6)}...{walletInfo.address.slice(-4)}
                </span>
                <button
                  type="button"
                  onClick={copyWalletAddress}
                  title="Copy Burner Wallet Address"
                  className="p-1 hover:bg-[#232B3B] rounded text-slate-400 hover:text-white transition-colors ml-0.5"
                >
                  {copiedWallet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 flex flex-col">
        {/* Safety Banner */}
        <div className="mb-4 bg-indigo-950/20 border border-indigo-700/30 rounded-xl p-3 flex items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong>Safety Protected:</strong> Session memory enabled • Simulation before send • On-chain trade receipts
            </span>
          </div>
          <a
            href="https://sepoliafaucet.com"
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1 text-brand-400 hover:underline shrink-0 text-xs font-medium"
          >
            <span>Sepolia Faucet</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 flex flex-col min-h-0">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            onConfirmTrade={handleConfirmTrade}
            onCancelTrade={handleCancelTrade}
            onClearChat={handleClearChat}
            isLoading={isLoading}
            isExecuting={isExecuting}
          />
        </div>
      </main>

      {/* Token List & Balances Modal */}
      <TokenListModal
        isOpen={isTokensModalOpen}
        onClose={() => setIsTokensModalOpen(false)}
        tokens={supportedTokens}
        walletBalances={walletInfo?.balances}
        onSelectToken={(token) => {
          handleSendMessage(`Swap 0.05 ETH for ${token.symbol}`);
        }}
      />

      {/* Receipts History Modal */}
      <ReceiptsHistoryModal
        isOpen={isReceiptsModalOpen}
        onClose={() => setIsReceiptsModalOpen(false)}
        receipts={sessionReceipts}
      />
    </div>
  );
}

export default App;
