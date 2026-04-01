'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { GoldButton } from '@/components/ui/GoldButton';
import { getAttachmentType } from '@/lib/questions';

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
  const { selectedQuestions, quizAnswers, addQuizAnswer, setStep, setEcrScores } = useAppStore();
  const [selected, setSelected] = useState<number | null>(null);

  const current = quizAnswers.length;
  const question = selectedQuestions[current];

  if (!question) return null;

  function handleNext() {
    if (selected === null) return;
    const rawScore = selected + 1; // 1~7
    const score = question.reverse ? 8 - rawScore : rawScore;
    addQuizAnswer(score);
    setSelected(null);

    if (current + 1 >= selectedQuestions.length) {
      // Calculate ECR scores
      const allAnswers = [...quizAnswers, score];
      const anxietyAnswers = selectedQuestions
        .map((q, i) => ({ q, score: allAnswers[i] }))
        .filter(({ q }) => q.dimension === 'anxiety')
        .map(({ score }) => score);
      const avoidanceAnswers = selectedQuestions
        .map((q, i) => ({ q, score: allAnswers[i] }))
        .filter(({ q }) => q.dimension === 'avoidance')
        .map(({ score }) => score);

      const anxiety = anxietyAnswers.reduce((a, b) => a + b, 0) / anxietyAnswers.length;
      const avoidance = avoidanceAnswers.reduce((a, b) => a + b, 0) / avoidanceAnswers.length;
      const typeName = getAttachmentType(anxiety, avoidance);
      setEcrScores({ anxiety, avoidance, typeName });
      setStep('chat');
    }
  }

  return (
    <motion.div
      key={`quiz-${current}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-[100dvh] px-4 py-12 relative z-10"
    >
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <p className="text-xs mb-1" style={{ color: '#c8a96e' }}>
            {question.dimension === 'anxiety' ? '불안 문항' : '회피 문항'}
          </p>
          <ProgressBar current={current + 1} total={selectedQuestions.length} />
        </div>

        <div
          className="rounded-2xl p-6 border mb-6"
          style={{ backgroundColor: '#111118', borderColor: '#1e1e2e' }}
        >
          <p className="text-lg font-medium mb-8 leading-relaxed text-center" style={{ color: '#e8e8f0' }}>
            {question.text}
          </p>

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-7 gap-1">
              {LIKERT_LABELS.map((_label, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className="flex flex-col items-center gap-2 py-3 rounded-xl border transition-all duration-200 min-h-[52px]"
                  style={{
                    backgroundColor: selected === i ? 'rgba(200,169,110,0.12)' : '#0a0a0f',
                    borderColor: selected === i ? '#c8a96e' : '#1e1e2e',
                  }}
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
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
                <p key={i} className="text-center leading-tight whitespace-pre-line" style={{ color: '#8a8a9a', fontSize: '11px' }}>
                  {label}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <GoldButton onClick={handleNext} disabled={selected === null}>
            다음
          </GoldButton>
        </div>
      </div>
    </motion.div>
  );
}
