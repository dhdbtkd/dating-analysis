'use client';

import { useEffect, useRef } from 'react';
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

export default function Home() {
  const { step, seedDevState } = useAppStore();
  const appliedDevStepRef = useRef<string | null>(null);
  const showChatBackground = step === 'chat-intro' || step === 'chat';

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const devStep = new URLSearchParams(window.location.search).get('devStep');
    if (!devStep || appliedDevStepRef.current === devStep) return;

    const supportedSteps = new Set(['splash', 'intro', 'warmup', 'quiz', 'chat-intro', 'chat']);
    if (!supportedSteps.has(devStep)) return;

    appliedDevStepRef.current = devStep;
    seedDevState(devStep as Parameters<typeof seedDevState>[0]);
  }, [seedDevState]);

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
