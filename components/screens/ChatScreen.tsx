'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { GoldButton } from '@/components/ui/GoldButton';
import type { ChatMessage } from '@/types';

const DEFAULT_MAX_TURNS = 6;
const ENERGY_EVENT_NAME = 'chat-bg-energy';

function emitChatBgEnergy(detail: { energy?: number; pulse?: number }) {
    globalThis.dispatchEvent(new CustomEvent(ENERGY_EVENT_NAME, { detail }));
}

export function ChatScreen() {
    const { ecrScores, userInfo, warmupAnswers, selectedQuestions, quizAnswers, setChatHistory, chatHistory, setStep } =
        useAppStore();
    const quizDetails = useMemo(
        () => selectedQuestions.map((q, i) => ({ questionText: q.text, score: quizAnswers[i] ?? 0 })),
        [quizAnswers, selectedQuestions],
    );
    const [maxTurns, setMaxTurns] = useState(DEFAULT_MAX_TURNS);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const autoStartedRef = useRef(false);
    const messageKeysRef = useRef<string[]>([]);
    const lastTypingEmitAtRef = useRef(0);
    const lastInputHadTextRef = useRef(false);
    const userTurns = chatHistory.filter((m) => m.role === 'user').length;
    const lastMessage = chatHistory[chatHistory.length - 1];
    const lastMessageContent = lastMessage?.content ?? '';
    // 첫 토큰 수신 전(빈 assistant 메시지)일 때만 ... 말풍선 표시
    const showTypingIndicator = loading && lastMessage?.role === 'assistant' && lastMessageContent.length === 0;

    useEffect(() => {
        fetch('/api/config')
            .then((r) => r.json())
            .then((d: { chatMaxTurns?: number }) => {
                if (d.chatMaxTurns) setMaxTurns(d.chatMaxTurns);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        emitChatBgEnergy({ energy: 0.26, pulse: 0.06 });
    }, []);

    useEffect(() => {
        emitChatBgEnergy({ energy: loading ? 0.48 : input.trim().length ? 0.34 : 0.26, pulse: loading ? 0.05 : 0 });
        if (!loading) return;
        const id = globalThis.setInterval(() => {
            emitChatBgEnergy({ pulse: 0.06 });
        }, 1200);
        return () => globalThis.clearInterval(id);
    }, [input, loading]);

    if (messageKeysRef.current.length !== chatHistory.length) {
        const next = messageKeysRef.current.slice(0, chatHistory.length);
        for (let i = next.length; i < chatHistory.length; i++) {
            next[i] = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
        }
        messageKeysRef.current = next;
    }

    const streamAssistantReply = useCallback(
        async (history: ChatMessage[]) => {
            setLoading(true);
            setError('');
            setChatHistory([...history, { role: 'assistant', content: '' }]);
            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ messages: history, ecrScores, userInfo, warmupAnswers, quizDetails }),
                });
                if (!res.ok) {
                    const err = (await res.json().catch(() => ({ error: '응답 생성에 실패했습니다.' }))) as {
                        error?: string;
                    };
                    throw new Error(err.error ?? '응답 생성에 실패했습니다.');
                }
                const reader = res.body!.getReader();
                const decoder = new TextDecoder();
                let text = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    text += decoder.decode(value, { stream: true });
                    setChatHistory([...history, { role: 'assistant', content: text }]);
                }
            } catch (e) {
                setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
                setChatHistory(history);
            } finally {
                setLoading(false);
            }
        },
        [ecrScores, quizDetails, setChatHistory, userInfo, warmupAnswers],
    );

    const startConversation = useCallback(async () => {
        await streamAssistantReply([]);
    }, [streamAssistantReply]);

    useEffect(() => {
        if (autoStartedRef.current) return;
        if (chatHistory.length !== 0) {
            autoStartedRef.current = true;
            return;
        }
        autoStartedRef.current = true;
        void startConversation();
    }, [chatHistory.length, startConversation]);

    useEffect(() => {
        if (chatHistory.length === 0) return;
        const behavior = lastMessageContent.length > 0 ? 'smooth' : 'auto';
        messagesEndRef.current?.scrollIntoView({ behavior });
    }, [chatHistory.length, lastMessageContent]);

    useEffect(() => {
        if (!loading) inputRef.current?.focus();
    }, [loading]);

    async function handleSend() {
        if (!input.trim() || loading) return;
        emitChatBgEnergy({ energy: 0.52, pulse: 0.18 });
        const userMsg: ChatMessage = { role: 'user', content: input.trim() };
        const updatedHistory = [...chatHistory, userMsg];
        setChatHistory(updatedHistory);
        setInput('');
        const newUserTurns = updatedHistory.filter((m) => m.role === 'user').length;
        if (newUserTurns >= maxTurns) {
            setStep('loading');
            return;
        }
        await streamAssistantReply(updatedHistory);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col min-h-[100dvh]"
        >
            {/* Header */}
            <div className="px-6 py-4 sticky top-0 z-10" style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.18)' }}>
                <div className="max-w-lg mx-auto flex items-center justify-end">
                    <div className="text-right">
                        <p className="text-[0.7rem] font-semibold text-zinc-300">
                            {userTurns} / {maxTurns}
                        </p>
                        <div className="flex gap-1 mt-1">
                            {Array.from({ length: maxTurns }, (_, i) => i + 1).map((turn) => (
                                <div
                                    key={turn}
                                    className="w-3 h-1 rounded-full transition-all"
                                    style={{ backgroundColor: turn <= userTurns ? '#0060ac' : '#e6e8ea' }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
                <div className="max-w-lg mx-auto flex flex-col gap-4">
                    {chatHistory.map((msg, i) => msg.role === 'assistant' && msg.content.length === 0 ? null : (
                        <div
                            key={messageKeysRef.current[i]}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className="max-w-[80%] rounded-3xl px-5 py-3.5 text-sm leading-relaxed break-words text-xs"
                                style={
                                    msg.role === 'user'
                                        ? {
                                              background: 'linear-gradient(135deg, #002045 0%, #1a365d 100%)',
                                              color: '#ffffff',
                                              borderBottomRightRadius: '6px',
                                          }
                                        : {
                                              backgroundColor: '#ffffff',
                                              color: '#191c1e',
                                              borderBottomLeftRadius: '6px',
                                              boxShadow: '0px 4px 12px rgba(25,28,30,0.06)',
                                          }
                                }
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {showTypingIndicator && (
                        <div className="flex justify-start">
                            <div
                                className="rounded-3xl px-5 py-3.5"
                                style={{
                                    backgroundColor: '#ffffff',
                                    borderBottomLeftRadius: '6px',
                                    boxShadow: '0px 4px 12px rgba(25,28,30,0.06)',
                                }}
                            >
                                <div className="flex gap-1.5">
                                    {[0, 1, 2].map((i) => (
                                        <div
                                            key={i}
                                            className="w-2 h-2 rounded-full animate-bounce"
                                            style={{ backgroundColor: '#64a8fe', animationDelay: `${i * 0.12}s` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="px-6 py-4 bg-none" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 22px)' }}>
                <div className="max-w-lg mx-auto">
                    {error && (
                        <p className="text-xs mb-2" style={{ color: '#ba1a1a' }}>
                            {error}
                        </p>
                    )}
                    {userTurns < maxTurns ? (
                        <div
                            className="flex items-center gap-2 rounded-3xl px-4 py-3 transition-all soft-lift justify-center"
                            style={{ backgroundColor: '#ffffff' }}
                        >
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    const now = Date.now();
                                    const hasText = e.target.value.trim().length > 0;
                                    if (hasText !== lastInputHadTextRef.current) {
                                        lastInputHadTextRef.current = hasText;
                                        emitChatBgEnergy({
                                            energy: hasText ? 0.34 : 0.26,
                                            pulse: hasText ? 0.05 : 0.03,
                                        });
                                    } else if (now - lastTypingEmitAtRef.current > 180) {
                                        lastTypingEmitAtRef.current = now;
                                        emitChatBgEnergy({ pulse: 0.035 });
                                    }
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="솔직하게 답해주세요"
                                rows={1}
                                disabled={loading}
                                className="flex-1 bg-transparent outline-none resize-none leading-relaxed text-sm"
                                style={{
                                    color: '#191c1e',
                                    caretColor: '#0060ac',
                                    paddingTop: '2px',
                                    paddingBottom: '2px',
                                }}
                            />
                            <button
                                type="button"
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                aria-label="메시지 보내기"
                                className="flex-shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-95"
                                style={{
                                    background:
                                        input.trim() && !loading
                                            ? 'linear-gradient(135deg, #002045 0%, #1a365d 100%)'
                                            : '#f2f4f6',
                                    color: input.trim() && !loading ? '#ffffff' : '#74777f',
                                }}
                            >
                                <svg
                                    aria-hidden="true"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-2">
                            <p className="text-sm mb-4" style={{ color: '#43474e' }}>
                                대화가 완료되었습니다. 결과를 분석합니다.
                            </p>
                            <GoldButton onClick={() => setStep('loading')}>결과 보기</GoldButton>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
