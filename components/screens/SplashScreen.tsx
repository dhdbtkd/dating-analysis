'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 1,
  delay: Math.random() * 2,
  duration: Math.random() * 4 + 4,
}));

export function SplashScreen() {
  const { setStep } = useAppStore();

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
      {PARTICLES.map((p) => (
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
            <span className="text-4xl">🪐</span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
          className="text-4xl font-bold leading-snug mb-3"
          style={{ fontFamily: 'Paperozi', color: '#e0c898' }}
        >
          당신도 몰랐던<br />나의 연애 패턴
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6, ease: 'easeOut' }}
          className="text-sm tracking-widest uppercase mb-10"
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
