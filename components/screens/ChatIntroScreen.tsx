'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { GoldButton } from '@/components/ui/GoldButton';

const ENERGY_EVENT_NAME = 'chat-bg-energy';

function emitChatBgEnergy(detail: { energy?: number; pulse?: number }) {
  globalThis.dispatchEvent(new CustomEvent(ENERGY_EVENT_NAME, { detail }));
}

export function ChatIntroScreen() {
  const { userInfo, ecrScores, setStep } = useAppStore();

  useEffect(() => {
    emitChatBgEnergy({ energy: 0.25, pulse: 0.08 });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.45 }}
      className="flex flex-col items-center justify-center min-h-[100dvh] px-6 py-16"
    >
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.45 }}
          className="mb-10"
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#0060ac' }}>
            AI 심층 대화
          </p>
          <h1
            className="text-3xl font-bold leading-tight"
            style={{ fontFamily: 'Paperozi', color: '#002045' }}
          >
            이제, 대화로
            <br />
            당신을 더 정교하게 읽어요
          </h1>
          <p className="text-sm leading-relaxed mt-4" style={{ color: '#43474e' }}>
            {userInfo?.nickname ? `${userInfo.nickname}님의 답변을 바탕으로, ` : ''}
            짧은 대화를 통해 감정의 흐름과 관계 패턴을
            <br />
            맥락까지 포함해 분석합니다.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45 }}
          className="glass rounded-3xl p-7 soft-lift"
          style={{ border: '1px solid rgba(0, 32, 69, 0.10)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold" style={{ color: '#0060ac' }}>
                대화는 총 6턴
              </p>
              <p className="text-xs mt-1" style={{ color: '#74777f' }}>
                짧지만, 핵심만 묻습니다.
              </p>
            </div>
            <div
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: '#dbeafe', color: '#002045' }}
            >
              {ecrScores?.typeName ? `${ecrScores.typeName} 유형` : '연애 패턴 분석'}
            </div>
          </div>

          <div className="grid gap-3">
            {[
              {
                title: '솔직할수록 정확해요',
                desc: '정답은 없습니다. 지금 떠오르는 그대로 답해주세요.',
              },
              {
                title: '대화 맥락까지 반영해요',
                desc: '같은 답이라도 이유와 감정 흐름을 함께 읽습니다.',
              },
              {
                title: '결과 생성에만 사용돼요',
                desc: '입력 내용은 결과 분석 외의 목적으로 저장하지 않습니다.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl px-5 py-4"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.75)' }}
              >
                <p className="text-sm font-semibold" style={{ color: '#002045' }}>
                  {item.title}
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: '#43474e' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex justify-center">
            <GoldButton onClick={() => setStep('chat')} className="w-full">
              대화 시작하기
            </GoldButton>
          </div>

          <p className="text-center text-xs mt-4" style={{ color: '#74777f' }}>
            Enter로 전송, Shift+Enter로 줄바꿈
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
