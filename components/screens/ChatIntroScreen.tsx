'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { GoldButton } from '@/components/ui/GoldButton';

const ENERGY_EVENT_NAME = 'chat-bg-energy';

function emitChatBgEnergy(detail: { energy?: number; pulse?: number }) {
    globalThis.dispatchEvent(new CustomEvent(ENERGY_EVENT_NAME, { detail }));
}

export function ChatIntroScreen() {
    const { userInfo, ecrScores, setStep } = useAppStore();

    useEffect(() => {
        emitChatBgEnergy({ energy: 0.25, pulse: 0.08 });
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col items-center justify-center min-h-[100dvh] px-6 py-16"
        >
            <div className="w-full max-w-lg">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, duration: 0.45 }}
                    className="mb-10"
                >
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-zinc-200">더 깊게</p>
                    <h1 className="text-3xl font-bold leading-tight text-white" style={{ fontFamily: 'Paperozi' }}>
                        이제, 대화로
                        <br />
                        {userInfo?.nickname ? `${userInfo.nickname}님` : '당신'}을 더 알아볼게요
                    </h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12, duration: 0.45 }}
                    className="glass rounded-3xl p-7 soft-lift"
                    style={{ border: '1px solid rgba(0, 32, 69, 0.10)' }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-xs font-semibold" style={{ color: '#0060ac' }}>
                                여섯번만 대답해주시면 돼요.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-3">
                        {[
                            {
                                title: '솔직할수록 정확해요',
                                desc: '정답은 없어요. 지금 떠오르는 그대로 답해주세요.',
                            },
                            {
                                title: '분석에만 사용돼요',
                                desc: '입력 내용은 결과 분석 외의 목적으로 저장하지 않아요.',
                            },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="rounded-2xl px-5 py-4"
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.65)' }}
                            >
                                <p className="text-xs font-semibold" style={{ color: '#002045' }}>
                                    {item.title}
                                </p>
                                <p className="text-[0.70rem] mt-1 leading-relaxed" style={{ color: '#43474e' }}>
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-7 flex justify-center">
                        <GoldButton onClick={() => setStep('chat')} className="w-full animate-bounce">
                            대화 시작하기
                        </GoldButton>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
