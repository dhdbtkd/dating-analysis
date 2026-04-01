'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { OptionButton } from '@/components/ui/OptionButton';
import { GoldButton } from '@/components/ui/GoldButton';

export function WarmupScreen() {
  const { selectedWarmup, warmupAnswers, addWarmupAnswer, setStep } = useAppStore();
  const [selected, setSelected] = useState<string | null>(null);

  const current = warmupAnswers.length;
  const question = selectedWarmup[current];

  if (!question) return null;

  function handleNext() {
    if (!selected) return;
    const opt = question.options.find((o) => o.label === selected)!;
    addWarmupAnswer({ questionId: question.id, selectedLabel: selected, selectedText: opt.text });
    setSelected(null);

    if (current + 1 >= selectedWarmup.length) {
      setStep('quiz');
    }
  }

  return (
    <motion.div
      key={`warmup-${current}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-screen px-4 py-12 relative z-10"
    >
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <p className="text-xs mb-1" style={{ color: '#c8a96e' }}>워밍업 문항</p>
          <ProgressBar current={current + 1} total={selectedWarmup.length} />
        </div>

        <div
          className="rounded-2xl p-6 border mb-6"
          style={{ backgroundColor: '#111118', borderColor: '#1e1e2e' }}
        >
          <p className="text-lg font-medium mb-6 leading-relaxed" style={{ color: '#e8e8f0' }}>
            {question.text}
          </p>
          <div className="flex flex-col gap-3">
            {question.options.map((opt) => (
              <OptionButton
                key={opt.label}
                label={opt.label}
                text={opt.text}
                selected={selected === opt.label}
                onClick={() => setSelected(opt.label)}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <GoldButton onClick={handleNext} disabled={!selected}>
            다음
          </GoldButton>
        </div>
      </div>
    </motion.div>
  );
}
