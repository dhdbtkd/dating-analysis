'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { OptionButton } from '@/components/ui/OptionButton';
import { TimerBar } from '@/components/ui/TimerBar';
import { useCountdown } from '@/hooks/useCountdown';
import type { WarmupAnswer } from '@/types';

const TIMER_DURATION = 10;

export function WarmupScreen() {
  const { selectedWarmup, selectedQuestions, addWarmupAnswer, setStep } = useAppStore();

  // 일반 큐: 인덱스 배열 [0, 1, 2]
  const [normalQueue] = useState<number[]>(() =>
    selectedWarmup.map((_, i) => i)
  );
  const [normalPos, setNormalPos] = useState(0);

  // 스킵된 문항 인덱스
  const [retryQueue, setRetryQueue] = useState<number[]>([]);
  const [retryPos, setRetryPos] = useState(0);
  const [isRetry, setIsRetry] = useState(false);

  const [selected, setSelected] = useState<string | null>(null);
  const [timerKey, setTimerKey] = useState(0);
  const advancingRef = useRef(false);

  const questionIndex = isRetry ? retryQueue[retryPos] : normalQueue[normalPos];
  const question = selectedWarmup[questionIndex];
  const isRetryMode = isRetry;
  const warmupAnsweredCount = isRetry ? normalQueue.length + retryPos : normalPos;
  const globalTotal = selectedWarmup.length + selectedQuestions.length;
  const globalCurrent = warmupAnsweredCount + 1; // warmup은 앞쪽 구간


  const advance = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;

    setTimeout(() => {
      advancingRef.current = false;
      setSelected(null);
      setTimerKey((k) => k + 1);

      if (isRetry) {
        const nextRetryPos = retryPos + 1;
        if (nextRetryPos >= retryQueue.length) {
          setStep('quiz');
        } else {
          setRetryPos(nextRetryPos);
        }
      } else {
        const nextNormalPos = normalPos + 1;
        if (nextNormalPos >= normalQueue.length) {
          // 일반 큐 완료
          if (retryQueue.length === 0) {
            setStep('quiz');
          } else {
            setIsRetry(true);
          }
        } else {
          setNormalPos(nextNormalPos);
        }
      }
    }, 280);
  }, [isRetry, retryPos, retryQueue, normalPos, normalQueue, setStep]);

  const handleExpire = useCallback(() => {
    // 일반 모드에서만 스킵
    setRetryQueue((prev) => [...prev, questionIndex]);
    advance();
  }, [questionIndex, advance]);

  const timeLeft = useCountdown(
    TIMER_DURATION,
    handleExpire,
    !isRetryMode, // retry 모드에서는 만료 콜백 없음
    timerKey,
  );

  function handleSelect(label: string) {
    if (selected) return;
    setSelected(label);
    const opt = question.options.find((o) => o.label === label)!;
    const answer: WarmupAnswer = {
      questionId: question.id,
      questionText: question.text,
      measures: question.measures,
      selectedLabel: label,
      selectedText: opt.text,
    };
    addWarmupAnswer(answer);
    advance();
  }

  // retry 진입 시 타이머 리셋
  useEffect(() => {
    if (isRetry) {
      setTimerKey((k) => k + 1);
    }
  }, [isRetry]);

  if (!question) return null;

  return (
    <motion.div
      key={`warmup-${questionIndex}-${isRetry ? 'retry' : 'normal'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center min-h-[100dvh] px-4 py-12 relative z-10"
    >
      <div className="w-full max-w-lg">
        {/* 상단 헤더 */}
        <div className="mb-5">
          <ProgressBar current={globalCurrent} total={globalTotal} />
          <div className="flex items-center justify-between mb-1">
            <span />
            <AnimatePresence>
              {isRetryMode && (
                <motion.span
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
                >
                  다시 답해주세요
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <TimerBar timeLeft={timeLeft} duration={TIMER_DURATION} />
        </div>

        <div
          className="rounded-2xl p-6 border mb-4"
          style={{ backgroundColor: '#111118', borderColor: '#1e1e2e' }}
        >
          <p className="text-base font-medium mb-6 leading-relaxed" style={{ color: '#e8e8f0' }}>
            {question.text}
          </p>
          <div className="flex flex-col gap-3">
            {question.options.map((opt) => (
              <OptionButton
                key={opt.label}
                label={opt.label}
                text={opt.text}
                selected={selected === opt.label}
                onClick={() => handleSelect(opt.label)}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
