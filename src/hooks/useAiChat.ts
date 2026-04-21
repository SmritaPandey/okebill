import { useState, useCallback, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    action?: {
        type: string;
        data: any;
    } | null;
    timestamp: Date;
}

export interface ChatSuggestion {
    label: string;
    icon: string;
    message: string;
}

async function apiCall<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getAuthToken();
    const resp = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });
    if (!resp.ok) {
        const errorBody = await resp.text().catch(() => '');
        let message = `API Error ${resp.status}`;
        try {
            const parsed = JSON.parse(errorBody);
            message = parsed.message || parsed.error || message;
        } catch {
            if (errorBody) message = errorBody;
        }
        throw new Error(message);
    }
    if (resp.status === 204) return undefined as T;
    return resp.json();
}

export function useAiChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<ChatSuggestion[]>([]);
    const [error, setError] = useState<string | null>(null);
    const messageIdCounter = useRef(0);

    const generateId = () => {
        messageIdCounter.current += 1;
        return `msg-${Date.now()}-${messageIdCounter.current}`;
    };

    const loadSuggestions = useCallback(async () => {
        try {
            const data = await apiCall<{ suggestions: ChatSuggestion[] }>('/ai/suggestions');
            setSuggestions(data.suggestions);
        } catch {
            // Suggestions are optional, don't error
        }
    }, []);

    const loadHistory = useCallback(async () => {
        try {
            const data = await apiCall<{ messages: any[] }>('/ai/history');
            setMessages(
                data.messages.map((m: any) => ({
                    id: generateId(),
                    role: m.role as 'user' | 'assistant',
                    content: m.content,
                    action: m.action || null,
                    timestamp: new Date(m.createdAt),
                }))
            );
        } catch {
            // History is optional
        }
    }, []);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || isLoading) return;

        setError(null);

        // Add user message
        const userMessage: ChatMessage = {
            id: generateId(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // Build conversation history
            const conversationHistory = messages.slice(-10).map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const data = await apiCall<{ message: string; action: any; context: any }>('/ai/chat', {
                method: 'POST',
                body: JSON.stringify({
                    message: content.trim(),
                    conversationHistory,
                }),
            });

            const assistantMessage: ChatMessage = {
                id: generateId(),
                role: 'assistant',
                content: data.message,
                action: data.action || null,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);

            // Refresh suggestions after each interaction
            loadSuggestions();
        } catch (err: any) {
            setError(err.message || 'Failed to send message');
            // Remove the user message on error
            setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, messages, loadSuggestions]);

    const clearHistory = useCallback(async () => {
        try {
            await apiCall('/ai/history', { method: 'DELETE' });
            setMessages([]);
        } catch {
            // Silently fail
        }
    }, []);

    return {
        messages,
        isLoading,
        suggestions,
        error,
        sendMessage,
        clearHistory,
        loadHistory,
        loadSuggestions,
    };
}
