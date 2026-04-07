'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { SplashScreen } from '@/components/screens/SplashScreen';
import { IntroScreen } from '@/components/screens/IntroScreen';
import { WarmupScreen } from '@/components/screens/WarmupScreen';
import { QuizScreen } from '@/components/screens/QuizScreen';
import { ChatIntroScreen } from '@/components/screens/ChatIntroScreen';
import { ChatScreen } from '@/components/screens/ChatScreen';
import { LoadingScreen } from '@/components/screens/LoadingScreen';
import { ChatGradientBackground } from '@/components/ui/ChatGradientBackground';
import { buildFullQuestionSet, calcDimensionScore, getAttachmentType } from '@/lib/questions';
import type { ExtendedScores } from '@/types';

const DEV_NICKNAMES = ['하임', '지우', '서연', '민준', '채원', '도윤'];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function Home() {
  const { step, seedDevState } = useAppStore();
  const appliedDevStepRef = useRef<string | null>(null);
  const [devLoading, setDevLoading] = useState(false);
  const router = useRouter();
  const showChatBackground = step === 'chat-intro' || step === 'chat';

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const params = new URLSearchParams(window.location.search);

    // ?devStep= — 기존 기능 유지
    const devStep = params.get('devStep');
    if (devStep && appliedDevStepRef.current !== devStep) {
      const supportedSteps = new Set(['splash', 'intro', 'warmup', 'quiz', 'chat-intro', 'chat']);
      if (supportedSteps.has(devStep)) {
        appliedDevStepRef.current = devStep;
        seedDevState(devStep as Parameters<typeof seedDevState>[0]);
      }
    }

    // ?dev=1 — 랜덤 응답으로 세션 생성 + LLM 분석 → 결과 페이지 이동
    if (params.get('dev') === '1') {
      setDevLoading(true);
      const questions = buildFullQuestionSet();
      const answers = questions.map(() => randomInt(1, 7));
      const anxiety = calcDimensionScore(questions, answers, 'anxiety');
      const avoidance = calcDimensionScore(questions, answers, 'avoidance');
      const trust = calcDimensionScore(questions, answers, 'trust');
      const selfDisclosure = calcDimensionScore(questions, answers, 'self_disclosure');
      const conflict = calcDimensionScore(questions, answers, 'conflict');
      const relSelfEsteem = calcDimensionScore(questions, answers, 'rel_self_esteem');
      const scores: ExtendedScores = { anxiety, avoidance, trust, selfDisclosure, conflict, relSelfEsteem, typeName: getAttachmentType(anxiety, avoidance) };

      const nickname = DEV_NICKNAMES[randomInt(0, DEV_NICKNAMES.length - 1)];
      const age = randomInt(20, 32);
      const gender = Math.random() > 0.5 ? 'female' : 'male';

      const quizDetails = questions.map((q, i) => ({ questionText: q.text, score: answers[i] }));

      (async () => {
        try {
          const sessionRes = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              nickname, age, gender,
              ecr_anxiety: scores.anxiety,
              ecr_avoidance: scores.avoidance,
              score_trust: scores.trust,
              score_self_disclosure: scores.selfDisclosure,
              score_conflict: scores.conflict,
              score_rel_self_esteem: scores.relSelfEsteem,
              attachment_type: scores.typeName,
              chat_history: [],
              warmup_answers: [],
              quiz_details: quizDetails,
            }),
          });
          if (!sessionRes.ok) throw new Error('세션 생성 실패');
          const { id: sessionId } = await sessionRes.json() as { id: string };

          await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              mode: 'core',
              chatHistory: [],
              ecrScores: scores,
              userInfo: { nickname, age, gender },
              warmupAnswers: [],
              quizDetails,
            }),
          });

          router.push(`/result/${sessionId}`);
        } catch (e) {
          console.error('[dev=1] 오류:', e);
          setDevLoading(false);
        }
      })();
    }
  }, [seedDevState, router]);

  if (devLoading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-sm" style={{ color: '#74777f' }}>dev 결과 생성 중...</p>
      </main>
    );
  }

  return (
    <main className="flex-1 relative overflow-hidden">
      {showChatBackground && <ChatGradientBackground />}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {step === 'splash' && <SplashScreen key="splash" />}
          {step === 'intro' && <IntroScreen key="intro" />}
          {step === 'warmup' && <WarmupScreen key="warmup" />}
          {step === 'quiz' && <QuizScreen key="quiz" />}
          {step === 'chat-intro' && <ChatIntroScreen key="chat-intro" />}
          {step === 'chat' && <ChatScreen key="chat" />}
          {(step === 'loading' || step === 'done') && <LoadingScreen key="loading" />}
        </AnimatePresence>
      </div>
    </main>
  );
}
