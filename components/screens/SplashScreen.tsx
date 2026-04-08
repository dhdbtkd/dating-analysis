'use client';

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

const PARTICLE_SEEDS = [
    [79.2, 37.5, 1.45, 0.3, 5.2],
    [49.5, 19.9, 1.0, 1.1, 7.0],
    [95.1, 34.4, 2.4, 0.7, 4.5],
    [11.5, 0.09, 1.1, 1.8, 6.3],
    [94.3, 92.7, 1.04, 0.1, 5.8],
    [22.7, 73.7, 2.63, 1.5, 4.8],
    [81.5, 59.0, 2.86, 0.9, 7.2],
    [63.6, 90.8, 2.53, 0.4, 5.5],
    [0.21, 46.9, 2.74, 1.3, 6.7],
    [66.4, 12.1, 1.04, 0.6, 4.9],
];

// 움직이는 그라디언트 orb
function GradientOrb({
    color,
    size,
    blur,
    initialX,
    initialY,
    animateX,
    animateY,
    duration,
    opacity,
}: {
    color: string;
    size: number;
    blur: number;
    initialX: string;
    initialY: string;
    animateX: string[];
    animateY: string[];
    duration: number;
    opacity: number;
}) {
    return (
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
                width: size,
                height: size,
                left: initialX,
                top: initialY,
                background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                filter: `blur(${blur}px)`,
                opacity,
                translateX: '-50%',
                translateY: '-50%',
            }}
            animate={{ left: animateX, top: animateY }}
            transition={{
                duration,
                repeat: Infinity,
                repeatType: 'mirror',
                ease: 'easeInOut',
            }}
        />
    );
}

export function SplashScreen() {
    const { setStep } = useAppStore();

    const particles = useMemo(
        () =>
            PARTICLE_SEEDS.map(([x, y, size, delay, duration], i) => ({
                id: i, x, y, size, delay, duration,
            })),
        [],
    );

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
            style={{ backgroundColor: '#06060f' }}
            suppressHydrationWarning
        >
            {/* ── 움직이는 메시 그라디언트 ── */}

            {/* 블루 orb — 좌상단 */}
            <GradientOrb
                color="rgba(80,130,220,0.55)"
                size={620}
                blur={90}
                initialX="5%"
                initialY="10%"
                animateX={['5%', '18%', '8%', '5%']}
                animateY={['10%', '22%', '5%', '10%']}
                duration={9}
                opacity={1}
            />

            {/* 딥 퍼플 orb — 우상단 */}
            <GradientOrb
                color="rgba(90,50,180,0.6)"
                size={560}
                blur={100}
                initialX="80%"
                initialY="8%"
                animateX={['80%', '68%', '85%', '80%']}
                animateY={['8%', '20%', '12%', '8%']}
                duration={11}
                opacity={1}
            />

            {/* 인디고 orb — 중앙 */}
            <GradientOrb
                color="rgba(60,40,140,0.5)"
                size={500}
                blur={110}
                initialX="45%"
                initialY="42%"
                animateX={['45%', '52%', '38%', '45%']}
                animateY={['42%', '35%', '50%', '42%']}
                duration={13}
                opacity={1}
            />

            {/* 라벤더 orb — 하단 */}
            <GradientOrb
                color="rgba(150,100,220,0.4)"
                size={700}
                blur={120}
                initialX="50%"
                initialY="90%"
                animateX={['50%', '38%', '60%', '50%']}
                animateY={['90%', '82%', '88%', '90%']}
                duration={15}
                opacity={1}
            />

            {/* 골드 액센트 orb — 중앙 미세 */}
            <GradientOrb
                color="rgba(200,169,110,0.2)"
                size={300}
                blur={60}
                initialX="50%"
                initialY="50%"
                animateX={['50%', '55%', '46%', '50%']}
                animateY={['50%', '46%', '54%', '50%']}
                duration={7}
                opacity={1}
            />

            {/* ── 파티클 ── */}
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        width: p.size,
                        height: p.size,
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        backgroundColor: 'rgba(255,255,255,0.6)',
                    }}
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: [0, 0.5, 0], y: -30 }}
                    transition={{
                        delay: p.delay,
                        duration: p.duration,
                        repeat: Infinity,
                        ease: 'easeOut',
                    }}
                />
            ))}

            {/* ── 중앙 콘텐츠 ── */}
            <div className="relative z-10 flex flex-col items-center text-center px-8">
                <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                    className="mb-8"
                >
                    <div
                        className="w-20 h-20 rounded-full mx-auto"
                        style={{
                            background: 'radial-gradient(circle, rgba(200,169,110,0.22) 0%, transparent 70%)',
                            border: '1px solid rgba(200,169,110,0.3)',
                            boxShadow: '0 0 40px rgba(200,169,110,0.18), 0 0 80px rgba(80,130,220,0.15)',
                        }}
                    />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
                    className="text-3xl font-bold leading-snug mb-3"
                    style={{ fontFamily: 'Paperozi', color: '#e8dfc8' }}
                >
                    알고보면 보이는 <br />
                    나의 연애
                </motion.h1>

                <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ delay: 1.0, duration: 0.8, ease: 'easeOut' }}
                    className="mb-8"
                    style={{
                        width: 120,
                        height: 1,
                        background: 'linear-gradient(90deg, transparent, rgba(200,169,110,0.7), transparent)',
                    }}
                />

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
                            style={{ backgroundColor: 'rgba(200,169,110,0.8)' }}
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
        </motion.div>
    );
}
