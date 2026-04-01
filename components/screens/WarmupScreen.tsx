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

  const [normalQueue] = useState<number[]>(() => selectedWarmup.map((_, i) => i));
  const [normalPos, setNormalPos] = useState(0);
  const [retryQueue, setRetryQueue] = useState<number[]>([]);
  const [retryPos, setRetryPos] = useState(0);
  const [isRetry, setIsRetry] = useState(false);

  const [selected, setSelected] = useState<string | null>(null);
  const [timerKey, setTimerKey] = useState(0);
  const advancingRef = useRef(false);

  const questionIndex = isRetry ? retryQueue[retryPos] : normalQueue[normalPos];
  const question = selectedWarmup[questionIndex];
  const warmupAnsweredCount = isRetry ? normalQueue.length + retryPos : normalPos;
  const globalTotal = selectedWarmup.length + selectedQuestions.length;
  const globalCurrent = warmupAnsweredCount + 1;

  const advance = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setTimeout(() => {
      advancingRef.current = false;
      setSelected(null);
      setTimerKey((k) => k + 1);
      if (isRetry) {
        const nextRetryPos = retryPos + 1;
        if (nextRetryPos >= retryQueue.length) setStep('quiz');
        else setRetryPos(nextRetryPos);
      } else {
        const nextNormalPos = normalPos + 1;
        if (nextNormalPos >= normalQueue.length) {
          if (retryQueue.length === 0) setStep('quiz');
          else setIsRetry(true);
        } else {
          setNormalPos(nextNormalPos);
        }
      }
    }, 280);
  }, [isRetry, retryPos, retryQueue, normalPos, normalQueue, setStep]);

  const handleExpire = useCallback(() => {
    setRetryQueue((prev) => [...prev, questionIndex]);
    advance();
  }, [questionIndex, advance]);

  const timeLeft = useCountdown(TIMER_DURATION, handleExpire, !isRetry, timerKey);

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

  useEffect(() => {
    if (isRetry) setTimerKey((k) => k + 1);
  }, [isRetry]);

  if (!question) return null;

  return (
    <motion.div
      key={`warmup-${questionIndex}-${isRetry ? 'retry' : 'normal'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center min-h-[100dvh] px-6 py-12"
      style={{ backgroundColor: '#f7f9fb' }}
    >
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <ProgressBar current={globalCurrent} total={globalTotal} />
          <div className="flex items-center justify-end mb-2">
            <AnimatePresence>
              {isRetry && (
                <motion.span
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs px-3 py-1 rounded-full font-semibold"
                  style={{ backgroundColor: '#ffdad6', color: '#ba1a1a' }}
                >
                  다시 답해주세요
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <TimerBar timeLeft={timeLeft} duration={TIMER_DURATION} />
        </div>

        <div className="rounded-3xl p-7 soft-lift mb-5" style={{ backgroundColor: '#ffffff' }}>
          <p className="text-base font-medium mb-7 leading-relaxed" style={{ color: '#191c1e', fontFamily: 'Inter' }}>
            {question.text}
          </p>
          <div className="flex flex-col gap-2.5">
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
