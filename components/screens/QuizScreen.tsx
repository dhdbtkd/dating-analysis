'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TimerBar } from '@/components/ui/TimerBar';
import { useCountdown } from '@/hooks/useCountdown';
import { getAttachmentType } from '@/lib/questions';

const TIMER_DURATION = 10;

const LIKERT_LABELS = [
  '전혀\n그렇지\n않다',
  '그렇지\n않다',
  '약간\n그렇지\n않다',
  '보통',
  '약간\n그렇다',
  '그렇다',
  '매우\n그렇다',
];

export function QuizScreen() {
  const { selectedQuestions, selectedWarmup, warmupAnswers, addQuizAnswer, setStep, setEcrScores } = useAppStore();

  const [normalQueue] = useState<number[]>(() =>
    selectedQuestions.map((_, i) => i)
  );
  const [normalPos, setNormalPos] = useState(0);
  const [retryQueue, setRetryQueue] = useState<number[]>([]);
  const [retryPos, setRetryPos] = useState(0);
  const [isRetry, setIsRetry] = useState(false);

  // 점수 맵: questionIndex → score (역채점 적용 후)
  const scoresMapRef = useRef<Record<number, number>>({});

  const [selected, setSelected] = useState<number | null>(null);
  const [timerKey, setTimerKey] = useState(0);
  const advancingRef = useRef(false);

  const questionIndex = isRetry ? retryQueue[retryPos] : normalQueue[normalPos];
  const question = selectedQuestions[questionIndex];
  const quizAnsweredCount = isRetry ? normalQueue.length + retryPos : normalPos;
  const globalTotal = selectedWarmup.length + selectedQuestions.length;
  const globalCurrent = warmupAnswers.length + quizAnsweredCount + 1;

  const finishQuiz = useCallback(() => {
    const scores = scoresMapRef.current;
    let aSum = 0, aCount = 0, vSum = 0, vCount = 0;
    selectedQuestions.forEach((q, i) => {
      const s = scores[i] ?? 4; // 미답 시 중간값 fallback
      if (q.dimension === 'anxiety') { aSum += s; aCount++; }
      else { vSum += s; vCount++; }
    });
    const anxiety = aSum / aCount;
    const avoidance = vSum / vCount;
    setEcrScores({ anxiety, avoidance, typeName: getAttachmentType(anxiety, avoidance) });
    setStep('chat');
  }, [selectedQuestions, setEcrScores, setStep]);

  const advance = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;

    setTimeout(() => {
      advancingRef.current = false;
      setSelected(null);
      setTimerKey((k) => k + 1);

      if (isRetry) {
        const next = retryPos + 1;
        if (next >= retryQueue.length) {
          finishQuiz();
        } else {
          setRetryPos(next);
        }
      } else {
        const next = normalPos + 1;
        if (next >= normalQueue.length) {
          if (retryQueue.length === 0) {
            finishQuiz();
          } else {
            setIsRetry(true);
          }
        } else {
          setNormalPos(next);
        }
      }
    }, 280);
  }, [isRetry, retryPos, retryQueue, normalPos, normalQueue, finishQuiz]);

  const handleExpire = useCallback(() => {
    setRetryQueue((prev) => [...prev, questionIndex]);
    advance();
  }, [questionIndex, advance]);

  const timeLeft = useCountdown(
    TIMER_DURATION,
    handleExpire,
    !isRetry,
    timerKey,
  );

  function handleSelect(i: number) {
    if (selected !== null) return;
    setSelected(i);
    const rawScore = i + 1;
    const score = question.reverse ? 8 - rawScore : rawScore;
    scoresMapRef.current[questionIndex] = score;
    addQuizAnswer(score);
    advance();
  }

  useEffect(() => {
    if (isRetry) setTimerKey((k) => k + 1);
  }, [isRetry]);

  if (!question) return null;

  return (
    <motion.div
      key={`quiz-${questionIndex}-${isRetry ? 'retry' : 'normal'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center min-h-[100dvh] px-4 py-12 relative z-10"
    >
      <div className="w-full max-w-lg">
        <div className="mb-5">
          <ProgressBar current={globalCurrent} total={globalTotal} />
          <div className="flex items-center justify-between mb-1">
            <span />
            <AnimatePresence>
              {isRetry && (
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
          <p className="text-base font-medium mb-8 leading-relaxed text-center" style={{ color: '#e8e8f0' }}>
            {question.text}
          </p>

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-7 gap-1">
              {LIKERT_LABELS.map((_label, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className="flex flex-col items-center gap-2 py-3 rounded-xl border transition-all duration-200 min-h-[52px]"
                  style={{
                    backgroundColor: selected === i ? 'rgba(200,169,110,0.12)' : '#0a0a0f',
                    borderColor: selected === i ? '#c8a96e' : '#1e1e2e',
                  }}
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: selected === i ? '#c8a96e' : '#1e1e2e',
                      color: selected === i ? '#0a0a0f' : '#8a8a9a',
                    }}
                  >
                    {i + 1}
                  </span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 mt-1">
              {LIKERT_LABELS.map((label, i) => (
                <p
                  key={i}
                  className="text-center leading-tight whitespace-pre-line"
                  style={{ color: '#8a8a9a', fontSize: '11px' }}
                >
                  {label}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
