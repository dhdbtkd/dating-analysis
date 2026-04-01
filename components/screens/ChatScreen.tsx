'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { GoldButton } from '@/components/ui/GoldButton';
import type { ChatMessage } from '@/types';

const MAX_TURNS = 6;

export function ChatScreen() {
  const { ecrScores, userInfo, warmupAnswers, selectedQuestions, quizAnswers, setChatHistory, chatHistory, setStep } = useAppStore();
  const quizDetails = selectedQuestions.map((q, i) => ({ questionText: q.text, score: quizAnswers[i] ?? 0 }));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const userTurns = chatHistory.filter((m) => m.role === 'user').length;

  useEffect(() => {
    if (chatHistory.length === 0) {
      startConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  async function streamAssistantReply(history: ChatMessage[]) {
    setLoading(true);
    setError('');
    // placeholder message to stream into
    setChatHistory([...history, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history, ecrScores, userInfo, warmupAnswers, quizDetails }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '응답 생성에 실패했습니다.' })) as { error?: string };
        throw new Error(err.error ?? '응답 생성에 실패했습니다.');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let text = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        const snapshot = text;
        setChatHistory([...history, { role: 'assistant', content: snapshot }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
      setChatHistory(history); // remove empty placeholder
    } finally {
      setLoading(false);
    }
  }

  async function startConversation() {
    await streamAssistantReply([]);
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setInput('');

    const newUserTurns = updatedHistory.filter((m) => m.role === 'user').length;
    if (newUserTurns >= MAX_TURNS) {
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
      className="flex flex-col min-h-[100dvh] relative z-10"
    >
      {/* Header */}
      <div
        className="px-4 py-4 border-b"
        style={{ borderColor: '#1e1e2e', backgroundColor: '#0a0a0f' }}
      >
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs" style={{ color: '#c8a96e' }}>심층 대화</p>
              <p className="text-xs font-medium" style={{ color: '#e8e8f0' }}>
                {ecrScores?.typeName && `${ecrScores.typeName} 유형`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: '#8a8a9a' }}>
                {userTurns} / {MAX_TURNS} 턴
              </p>
              <div className="flex gap-1 mt-1">
                {Array.from({ length: MAX_TURNS }).map((_, i) => (
                  <div
                    key={i}
                    className="w-4 h-1 rounded-full"
                    style={{ backgroundColor: i < userTurns ? '#c8a96e' : '#1e1e2e' }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-lg mx-auto flex flex-col gap-4">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed break-words"
                style={{
                  backgroundColor: msg.role === 'user' ? 'rgba(200,169,110,0.15)' : '#111118',
                  border: msg.role === 'user' ? '1px solid rgba(200,169,110,0.3)' : '1px solid #1e1e2e',
                  color: '#e8e8f0',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div
                className="rounded-2xl px-4 py-3"
                style={{ backgroundColor: '#111118', border: '1px solid #1e1e2e' }}
              >
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: '#c8a96e',
                        animationDelay: `${i * 0.1}s`,
                      }}
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
      <div
        className="px-4 py-4 border-t pb-[env(safe-area-inset-bottom,16px)]"
        style={{ borderColor: '#1e1e2e', backgroundColor: '#0a0a0f' }}
      >
        <div className="max-w-lg mx-auto">
          {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
          {userTurns < MAX_TURNS ? (
            <div
              className="flex items-end gap-2 rounded-2xl px-3 py-2 transition-colors"
              style={{ backgroundColor: '#111118', border: '1px solid #1e1e2e' }}
              onFocusCapture={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = '#c8a96e')}
              onBlurCapture={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = '#1e1e2e')}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="솔직하게 답해주세요"
                rows={1}
                disabled={loading}
                className="flex-1 bg-transparent outline-none resize-none leading-relaxed"
                style={{
                  color: '#e8e8f0',
                  fontSize: '13px',
                  caretColor: '#c8a96e',
                  paddingTop: '4px',
                  paddingBottom: '4px',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                style={{
                  backgroundColor: input.trim() && !loading ? '#c8a96e' : '#1e1e2e',
                  color: input.trim() && !loading ? '#0a0a0f' : '#8a8a9a',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs mb-3" style={{ color: '#8a8a9a' }}>
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
