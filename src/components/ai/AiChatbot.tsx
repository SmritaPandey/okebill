import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Trash2, Sparkles, Bot, User } from 'lucide-react';
import { useAiChat, ChatMessage } from '@/hooks/useAiChat';

const AiChatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const {
        messages,
        isLoading,
        suggestions,
        error,
        sendMessage,
        clearHistory,
        loadHistory,
        loadSuggestions,
    } = useAiChat();

    useEffect(() => {
        if (isOpen) {
            loadHistory();
            loadSuggestions();
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, loadHistory, loadSuggestions]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            sendMessage(input);
            setInput('');
        }
    };

    const handleSuggestionClick = (message: string) => {
        sendMessage(message);
    };

    const formatMessage = (content: string) => {
        // Remove action blocks from display
        const cleaned = content.replace(/```action\n[\s\S]*?\n```/g, '').trim();
        // Convert markdown bold to spans
        return cleaned
            .split('\n')
            .map((line, i) => {
                const formatted = line
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>');
                return `<p key="${i}" style="margin:2px 0">${formatted || '&nbsp;'}</p>`;
            })
            .join('');
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center"
                style={{
                    background: 'linear-gradient(135deg, #1E3A5F 0%, #10B981 100%)',
                    boxShadow: isOpen
                        ? '0 0 0 3px rgba(99, 102, 241, 0.3), 0 8px 25px rgba(99, 102, 241, 0.4)'
                        : '0 4px 20px rgba(99, 102, 241, 0.3)',
                }}
                aria-label={isOpen ? 'Close chat' : 'Open AI assistant'}
            >
                {isOpen ? (
                    <X className="h-6 w-6 text-white" />
                ) : (
                    <Sparkles className="h-6 w-6 text-white" />
                )}
            </button>

            {/* Chat Panel */}
            <div
                className={`fixed bottom-24 right-6 z-50 w-96 transition-all duration-300 ${isOpen
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}
                style={{
                    maxHeight: 'calc(100vh - 160px)',
                }}
            >
                <div
                    className="flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
                    style={{
                        height: '560px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                        style={{
                            background: 'linear-gradient(135deg, #1E3A5F 0%, #10B981 100%)',
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Bot className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-sm">AI Billing Assistant</h3>
                                <p className="text-emerald-100 text-xs">Powered by OkBill</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={clearHistory}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                title="Clear chat history"
                            >
                                <Trash2 className="h-4 w-4 text-emerald-100" />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X className="h-4 w-4 text-emerald-100" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollBehavior: 'smooth' }}>
                        {messages.length === 0 && !isLoading && (
                            <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                <div
                                    className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
                                    style={{ background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)' }}
                                >
                                    <Sparkles className="h-8 w-8 text-emerald-500" />
                                </div>
                                <h4 className="text-gray-900 font-semibold mb-1">Hi! I'm your billing assistant</h4>
                                <p className="text-gray-500 text-sm mb-4">
                                    I can help you create invoices, check overdue payments, send reminders, and more.
                                </p>
                            </div>
                        )}

                        {messages.map((msg: ChatMessage) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                                        }`}
                                >
                                    <div
                                        className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === 'user'
                                                ? 'bg-emerald-100 text-emerald-600'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        {msg.role === 'user' ? (
                                            <User className="h-3.5 w-3.5" />
                                        ) : (
                                            <Bot className="h-3.5 w-3.5" />
                                        )}
                                    </div>
                                    <div
                                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                                ? 'bg-emerald-600 text-white rounded-tr-sm'
                                                : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                                            }`}
                                    >
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: formatMessage(msg.content),
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex gap-2 max-w-[85%]">
                                    <div className="h-7 w-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0 mt-1">
                                        <Bot className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-100">
                                        <div className="flex gap-1.5">
                                            <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestion Chips */}
                    {messages.length === 0 && suggestions.length > 0 && (
                        <div className="px-4 pb-2 flex flex-wrap gap-2">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSuggestionClick(s.message)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 rounded-full text-xs text-gray-700 hover:text-emerald-700 transition-colors"
                                >
                                    <span>{s.icon}</span>
                                    <span>{s.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <form
                        onSubmit={handleSubmit}
                        className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0"
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything about billing..."
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="h-10 w-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
                            style={{
                                background: input.trim()
                                    ? 'linear-gradient(135deg, #1E3A5F 0%, #10B981 100%)'
                                    : '#e5e7eb',
                            }}
                        >
                            <Send className={`h-4 w-4 ${input.trim() ? 'text-white' : 'text-gray-400'}`} />
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default AiChatbot;
