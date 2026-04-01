'use client';

import { AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { SplashScreen } from '@/components/screens/SplashScreen';
import { IntroScreen } from '@/components/screens/IntroScreen';
import { WarmupScreen } from '@/components/screens/WarmupScreen';
import { QuizScreen } from '@/components/screens/QuizScreen';
import { ChatScreen } from '@/components/screens/ChatScreen';
import { LoadingScreen } from '@/components/screens/LoadingScreen';

export default function Home() {
  const { step } = useAppStore();

  return (
    <main className="flex-1 relative z-10">
      <AnimatePresence mode="wait">
        {step === 'splash' && <SplashScreen key="splash" />}
        {step === 'intro' && <IntroScreen key="intro" />}
        {step === 'warmup' && <WarmupScreen key="warmup" />}
        {step === 'quiz' && <QuizScreen key="quiz" />}
        {step === 'chat' && <ChatScreen key="chat" />}
        {(step === 'loading' || step === 'done') && <LoadingScreen key="loading" />}
      </AnimatePresence>
    </main>
  );
}
