'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { IntroScreen } from '@/components/screens/IntroScreen';
import { WarmupScreen } from '@/components/screens/WarmupScreen';
import { QuizScreen } from '@/components/screens/QuizScreen';
import { ChatIntroScreen } from '@/components/screens/ChatIntroScreen';
import { ChatScreen } from '@/components/screens/ChatScreen';
import { LoadingScreen } from '@/components/screens/LoadingScreen';
import { ChatGradientBackground } from '@/components/ui/ChatGradientBackground';

interface InviteInfo {
  coupleId: string;
  senderNickname: string;
  expiresAt: string;
}

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const { token } = React.use(params);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [inviteError, setInviteError] = useState('');
  const [checkingInvite, setCheckingInvite] = useState(true);
  const [linked, setLinked] = useState(false);
  const router = useRouter();
  const { step, sessionId, setStep } = useAppStore();
  const showChatBackground = step === 'chat-intro' || step === 'chat';

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then((r) => r.json())
      .then((data: InviteInfo & { error?: string }) => {
        if (data.error) {
          setInviteError(data.error);
        } else {
          setInviteInfo(data);
          setStep('intro');
        }
      })
      .catch(() => setInviteError('초대 링크 확인에 실패했습니다.'))
      .finally(() => setCheckingInvite(false));
  }, [token]);

  // After partner done, link sessions
  useEffect(() => {
    if (step === 'done' && sessionId && inviteInfo && !linked) {
      setLinked(true);
      fetch(`/api/invite/${token}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ partnerSessionId: sessionId }),
      })
        .then((r) => r.json())
        .then((data: { coupleId?: string; error?: string }) => {
          if (data.coupleId) {
            router.push(`/couple/${data.coupleId}`);
          }
        })
        .catch(() => {});
    }
  }, [step, sessionId, inviteInfo, token, router, linked]);

  if (checkingInvite) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] relative z-10">
        <p style={{ color: '#8a8a9a' }}>초대 링크 확인 중...</p>
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-4 relative z-10">
        <div className="text-center">
          <p className="text-3xl mb-4">🚫</p>
          <p className="text-base" style={{ color: '#e0c898' }}>{inviteError}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 relative overflow-hidden">
      {showChatBackground && <ChatGradientBackground />}
      <div className="relative z-10">
        {step === 'intro' && (
          <div>
            <div className="px-4 pt-10 pb-2 text-center">
              <div
                className="inline-block px-4 py-2 rounded-xl border mb-2 text-xs"
                style={{ borderColor: '#1e1e2e', backgroundColor: '#111118', color: '#c8a96e' }}
              >
                💌 {inviteInfo?.senderNickname}님이 당신을 초대했습니다
              </div>
              <p className="text-xs" style={{ color: '#8a8a9a' }}>
                동일한 검사를 완료하면 커플 분석 결과를 확인할 수 있어요
              </p>
            </div>
            <IntroScreen />
          </div>
        )}
        <AnimatePresence mode="wait">
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
