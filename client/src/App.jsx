import React, { useState, useEffect, useCallback } from 'react';
import {
  parseIntent,
  executeTrade,
  getWalletInfo,
  getSupportedTokens,
  getSessionReceipts,
  clearSession
} from './services/api.js';
import { Sidebar } from './components/Sidebar.jsx';
import { Header } from './components/Header.jsx';
import { MetricCards } from './components/MetricCards.jsx';
import { ReceiptsTable } from './components/ReceiptsTable.jsx';
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

  const [activeTab, setActiveTab] = useState('terminal'); // 'terminal' | 'analytics' | 'receipts' | 'tokens'
  const [messages, setMessages] = useState([]);
  const [walletInfo, setWalletInfo] = useState(null);
  const [supportedTokens, setSupportedTokens] = useState([]);
  const [sessionReceipts, setSessionReceipts] = useState([]);
  const [isTokensModalOpen, setIsTokensModalOpen] = useState(false);
  const [isReceiptsModalOpen, setIsReceiptsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      const data = await getWalletInfo();
      setWalletInfo(data);
    } catch {
      // Ignore background fetch error
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
      // Ignore initial receipts error
    }
  }, [sessionId]);

  useEffect(() => {
    fetchWallet();
    fetchTokens();
    fetchReceipts();
  }, [fetchWallet, fetchTokens, fetchReceipts]);

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
        // Conversational response
        const botMessage = {
          id: Date.now() + 1,
          role: 'bot',
          text: data.message
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        // Proposal response
        const botMessage = {
          id: Date.now() + 1,
          role: 'bot',
          text: `I've prepared and simulated your trade: swap **${data.proposal.amountInFormatted} ${data.proposal.tokenIn.symbol}** for estimated **${parseFloat(data.proposal.estimatedAmountOutFormatted).toFixed(4)} ${data.proposal.tokenOut.symbol}** on Sepolia.\n\nPlease review to confirm or cancel:`,
          proposal: data.proposal,
          intent: data.intent
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        role: 'bot',
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'An error occurred while parsing trade intent.',
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
        setSessionReceipts((prev) => [result.receipt, ...prev]);
      }

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
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      {/* Left Navigation Sidebar matching screenshot */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        walletInfo={walletInfo}
        receiptsCount={sessionReceipts.length}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          walletInfo={walletInfo}
          activeTab={activeTab}
          onRefreshWallet={fetchWallet}
          onSearchSelect={(query) => {
            setActiveTab('terminal');
            handleSendMessage(query);
          }}
        />

        <main className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-4">
          {/* Workspace Subheader with Real Contract Info */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Trading Terminal</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Natural language Uniswap V2 execution with automated safety rails
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Uniswap V2 Router:</span>
                <a
                  href="https://sepolia.etherscan.io/address/0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                >
                  0xC532...4008 ↗
                </a>
              </div>
            </div>

            {/* Real Navigation Tabs: Terminal | Trade Receipts | Token Balances */}
            <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-medium text-slate-500 mb-4">
              <button
                onClick={() => setActiveTab('terminal')}
                className={`pb-2 transition-colors relative ${
                  activeTab === 'terminal'
                    ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600 -mb-[1px]'
                    : 'text-slate-500 hover:text-slate-900 border-b-2 border-transparent'
                }`}
              >
                Chat Terminal
              </button>

              <button
                onClick={() => setActiveTab('receipts')}
                className={`pb-2 transition-colors relative flex items-center gap-1.5 ${
                  activeTab === 'receipts'
                    ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600 -mb-[1px]'
                    : 'text-slate-500 hover:text-slate-900 border-b-2 border-transparent'
                }`}
              >
                <span>Trade Receipts</span>
                {sessionReceipts.length > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded-full border border-indigo-100">
                    {sessionReceipts.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('tokens')}
                className={`pb-2 transition-colors relative ${
                  activeTab === 'tokens'
                    ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600 -mb-[1px]'
                    : 'text-slate-500 hover:text-slate-900 border-b-2 border-transparent'
                }`}
              >
                Token Balances ({supportedTokens.length})
              </button>
            </div>
          </div>

          {/* Real Metric Cards */}
          <MetricCards
            receipts={sessionReceipts}
            walletBalances={walletInfo?.balances}
          />

          {/* Dynamic Content Views */}
          {activeTab === 'terminal' && (
            <div className="space-y-6">
              {/* Chat Terminal Card */}
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                onConfirmTrade={handleConfirmTrade}
                onCancelTrade={handleCancelTrade}
                onClearChat={handleClearChat}
                isLoading={isLoading}
                isExecuting={isExecuting}
              />

              {/* Data Table beneath chat */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Session Trade Receipts
                  </h3>
                  {sessionReceipts.length > 0 && (
                    <button
                      onClick={() => setActiveTab('receipts')}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      View All Receipts →
                    </button>
                  )}
                </div>
                <ReceiptsTable receipts={sessionReceipts} />
              </div>
            </div>
          )}

          {activeTab === 'receipts' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">All Confirmed Session Receipts</h3>
                <button
                  onClick={() => setActiveTab('terminal')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  ← Back to Terminal
                </button>
              </div>
              <ReceiptsTable receipts={sessionReceipts} />
            </div>
          )}

          {activeTab === 'tokens' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Whitelisted Token Reserves</h3>
                  <p className="text-xs text-slate-500">
                    Live ERC-20 balances held in your active Sepolia burner wallet
                  </p>
                </div>
                <button
                  onClick={fetchWallet}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Refresh Balances
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {supportedTokens.map((token) => {
                  const balanceData = walletInfo?.balances?.[token.symbol];
                  const balanceFormatted = balanceData?.balance || '0.0';

                  return (
                    <div
                      key={token.symbol}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 font-bold text-xs flex items-center justify-center text-indigo-700">
                            {token.symbol.slice(0, 3)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-xs text-slate-900">{token.name}</h4>
                            <span className="font-mono text-[10px] text-slate-400">{token.symbol}</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-semibold text-slate-900">
                          {parseFloat(balanceFormatted).toFixed(4)}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-mono text-[11px]">Decimals: {token.decimals}</span>
                        <button
                          onClick={() => {
                            setActiveTab('terminal');
                            handleSendMessage(`Swap 0.05 ETH for ${token.symbol}`);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Quick Swap →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <TokenListModal
        isOpen={isTokensModalOpen}
        onClose={() => setIsTokensModalOpen(false)}
        tokens={supportedTokens}
        walletBalances={walletInfo?.balances}
        onSelectToken={(token) => {
          setActiveTab('terminal');
          handleSendMessage(`Swap 0.05 ETH for ${token.symbol}`);
        }}
      />

      <ReceiptsHistoryModal
        isOpen={isReceiptsModalOpen}
        onClose={() => setIsReceiptsModalOpen(false)}
        receipts={sessionReceipts}
      />
    </div>
  );
}

export default App;
