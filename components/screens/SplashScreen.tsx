'use client';

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

// 고정 시드값으로 파티클 생성 — 서버/클라이언트 hydration 불일치 방지
const PARTICLE_SEEDS = [
  [79.2, 37.5, 1.45, 0.3, 5.2], [49.5, 19.9, 1.00, 1.1, 7.0],
  [95.1, 34.4, 2.40, 0.7, 4.5], [11.5, 0.09, 1.10, 1.8, 6.3],
  [94.3, 92.7, 1.04, 0.1, 5.8], [22.7, 73.7, 2.63, 1.5, 4.8],
  [81.5, 59.0, 2.86, 0.9, 7.2], [63.6, 90.8, 2.53, 0.4, 5.5],
  [0.21, 46.9, 2.74, 1.3, 6.7], [66.4, 12.1, 1.04, 0.6, 4.9],
  [90.5, 30.4, 2.90, 1.9, 5.1], [89.8, 23.0, 1.39, 0.2, 7.5],
  [43.9, 47.4, 2.53, 1.6, 4.6], [4.24, 86.6, 2.02, 0.8, 6.1],
  [72.0, 47.0, 1.72, 1.2, 5.9], [43.8, 57.1, 1.42, 0.5, 7.3],
  [38.6, 83.5, 2.07, 1.7, 4.7], [28.4, 69.9, 2.39, 1.0, 6.5],
];

export function SplashScreen() {
  const { setStep } = useAppStore();

  const particles = useMemo(() =>
    PARTICLE_SEEDS.map(([x, y, size, delay, duration], i) => ({
      id: i, x, y, size, delay, duration,
    })), []);

  useEffect(() => {
    const timer = setTimeout(() => setStep('intro'), 3200);
    return () => clearTimeout(timer);
  }, [setStep]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#0a0a0f' }}
    >
      {/* Ambient orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,169,110,0.07) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(40px)',
        }}
      />
      <motion.div
        className="absolute pointer-events-none"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,169,110,0.12) 0%, transparent 65%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(24px)',
        }}
      />

      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: '#c8a96e',
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 0.6, 0], y: -40 }}
          transition={{
            delay: p.delay,
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          className="mb-8"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{
              background: 'radial-gradient(circle, rgba(200,169,110,0.18) 0%, transparent 70%)',
              border: '1px solid rgba(200,169,110,0.25)',
              boxShadow: '0 0 40px rgba(200,169,110,0.15)',
            }}
          >
            <span className="text-3xl">🪐</span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
          className="text-3xl font-bold leading-snug mb-3"
          style={{ fontFamily: 'Paperozi', color: '#e0c898' }}
        >
          당신도 몰랐던<br />나의 연애 패턴
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6, ease: 'easeOut' }}
          className="text-xs tracking-widest uppercase mb-10"
          style={{ color: '#c8a96e', letterSpacing: '0.2em' }}
        >
          Love Pattern Analysis
        </motion.p>

        {/* Divider line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.8, ease: 'easeOut' }}
          className="mb-8"
          style={{
            width: 120,
            height: 1,
            background: 'linear-gradient(90deg, transparent, #c8a96e, transparent)',
          }}
        />

        {/* Loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.5 }}
          className="flex gap-2 items-center"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: '#c8a96e' }}
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
              transition={{
                delay: 1.6 + i * 0.18,
                duration: 0.9,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Bottom badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        className="absolute bottom-10 flex gap-3"
      >
        <span
          className="text-xs px-3 py-1 rounded-full border"
          style={{ borderColor: 'rgba(200,169,110,0.2)', color: 'rgba(200,169,110,0.5)' }}
        >
          ECR Scale
        </span>
        <span
          className="text-xs px-3 py-1 rounded-full border"
          style={{ borderColor: 'rgba(200,169,110,0.2)', color: 'rgba(200,169,110,0.5)' }}
        >
          AI 심층 대화
        </span>
      </motion.div>
    </motion.div>
  );
}
