'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';

const MESSAGES = [
  '당신의 대화를 깊이 분석하고 있습니다...',
  '애착 패턴을 파악하고 있습니다...',
  '맞춤형 인사이트를 생성하고 있습니다...',
  '결과 카드를 완성하는 중입니다...',
];

export function LoadingScreen() {
  const { ecrScores, userInfo, chatHistory, sessionId, setSessionId, setStep, selectedQuestions, quizAnswers, warmupAnswers } = useAppStore();
  const quizDetails = selectedQuestions.map((q, i) => ({ questionText: q.text, score: quizAnswers[i] ?? 0 }));
  const [msgIndex, setMsgIndex] = useState(0);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => setMsgIndex((i) => (i + 1) % MESSAGES.length), 1800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    analyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function analyze() {
    try {
      let sid = sessionId;
      if (!sid) {
        const sessionRes = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            nickname: userInfo?.nickname,
            age: userInfo?.age,
            gender: userInfo?.gender,
            ecr_anxiety: ecrScores?.anxiety ?? 0,
            ecr_avoidance: ecrScores?.avoidance ?? 0,
            attachment_type: ecrScores?.typeName ?? '',
            chat_history: chatHistory,
          }),
        });
        if (!sessionRes.ok) throw new Error('세션 생성 실패');
        const sessionData = await sessionRes.json() as { id: string };
        sid = sessionData.id;
        setSessionId(sid);
        localStorage.setItem('dating_session_id', sid);
      }
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, chatHistory, ecrScores, userInfo, warmupAnswers, quizDetails }),
      });
      if (!analyzeRes.ok) throw new Error('분석 실패');
      setStep('done');
      router.push(`/result/${sid}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다. 다시 시도해주세요.');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-[100dvh] px-6"
      style={{ backgroundColor: '#f7f9fb' }}
    >
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-10">
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
            style={{ borderTopColor: '#0060ac', borderRightColor: '#dbeafe' }}
          />
          <div className="absolute inset-3 rounded-full flex items-center justify-center text-2xl">
            🪐
          </div>
        </div>
        <h2
          className="text-xl font-bold mb-4"
          style={{ fontFamily: 'Paperozi', color: '#002045' }}
        >
          분석 중
        </h2>
        <motion.p
          key={msgIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="text-sm"
          style={{ color: '#43474e' }}
        >
          {MESSAGES[msgIndex]}
        </motion.p>
        {error && (
          <div className="mt-8">
            <p className="text-sm mb-4" style={{ color: '#ba1a1a' }}>{error}</p>
            <button
              onClick={analyze}
              className="cta-gradient px-8 py-3 rounded-2xl text-sm text-white font-medium"
            >
              재시도
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
