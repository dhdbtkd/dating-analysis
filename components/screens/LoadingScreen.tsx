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
  const { ecrScores, userInfo, chatHistory, sessionId, setSessionId, setStep } = useAppStore();
  const [msgIndex, setMsgIndex] = useState(0);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    analyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function analyze() {
    try {
      // Create or use session
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

      // Run analysis
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sessionId: sid,
          chatHistory,
          ecrScores,
          userInfo,
        }),
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
      className="flex flex-col items-center justify-center min-h-[100dvh] px-4 relative z-10"
    >
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
            style={{ borderTopColor: '#c8a96e', borderRightColor: 'rgba(200,169,110,0.3)' }}
          />
          <div className="absolute inset-3 rounded-full flex items-center justify-center text-3xl">
            🪐
          </div>
        </div>
        <h2
          className="text-xl font-bold mb-4"
          style={{ fontFamily: 'Paperozi', color: '#e0c898' }}
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
          style={{ color: '#8a8a9a' }}
        >
          {MESSAGES[msgIndex]}
        </motion.p>
        {error && (
          <div className="mt-6">
            <p className="text-red-400 text-sm mb-3">{error}</p>
            <button
              onClick={analyze}
              className="px-6 py-3 rounded-xl text-sm min-h-[44px]"
              style={{ backgroundColor: '#c8a96e', color: '#0a0a0f' }}
            >
              재시도
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
