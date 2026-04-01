'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { GoldButton } from '@/components/ui/GoldButton';

export function IntroScreen() {
  const { setUserInfo, setStep, initQuestions } = useAppStore();
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');

  function handleStart() {
    if (!nickname.trim()) return setError('별명을 입력해주세요.');
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 16 || ageNum > 99) return setError('올바른 나이를 입력해주세요 (16~99).');
    if (!gender) return setError('성별을 선택해주세요.');
    setError('');
    setUserInfo({ nickname: nickname.trim(), age: ageNum, gender });
    initQuestions();
    setStep('warmup');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-screen px-4 py-12 relative z-10"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="text-4xl mb-4">🪐</div>
          <h1
            className="text-3xl font-bold mb-3 leading-tight"
            style={{ fontFamily: 'Paperozi', color: '#e0c898' }}
          >
            당신도 몰랐던<br />나의 연애 패턴
          </h1>
          <p className="text-sm mb-6" style={{ color: '#8a8a9a' }}>
            ECR 척도 기반 성인 애착 유형 측정 + AI 심층 대화
          </p>
          <div className="flex gap-2 justify-center flex-wrap mb-2">
            <span
              className="text-xs px-3 py-1 rounded-full border"
              style={{ borderColor: '#1e1e2e', color: '#8a8a9a' }}
            >
              Brennan et al. 1998
            </span>
            <span
              className="text-xs px-3 py-1 rounded-full border"
              style={{ borderColor: '#1e1e2e', color: '#8a8a9a' }}
            >
              Bartholomew & Horowitz 1991
            </span>
          </div>
          <p className="text-xs mt-3" style={{ color: '#8a8a9a' }}>⏱ 약 7~10분 소요</p>
        </div>

        <div
          className="rounded-2xl p-6 border"
          style={{ backgroundColor: '#111118', borderColor: '#1e1e2e' }}
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: '#8a8a9a' }}>별명</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="검사에서 사용할 별명"
                maxLength={20}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                style={{
                  backgroundColor: '#0a0a0f',
                  border: '1px solid #1e1e2e',
                  color: '#e8e8f0',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#c8a96e')}
                onBlur={(e) => (e.target.style.borderColor = '#1e1e2e')}
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: '#8a8a9a' }}>나이</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="나이 (숫자)"
                min={16}
                max={99}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                style={{
                  backgroundColor: '#0a0a0f',
                  border: '1px solid #1e1e2e',
                  color: '#e8e8f0',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#c8a96e')}
                onBlur={(e) => (e.target.style.borderColor = '#1e1e2e')}
              />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: '#8a8a9a' }}>성별</label>
              <div className="flex gap-2">
                {[
                  { value: 'male', label: '남성' },
                  { value: 'female', label: '여성' },
                  { value: 'other', label: '기타' },
                ].map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGender(g.value)}
                    className="flex-1 py-2 rounded-xl text-sm border transition-all duration-200"
                    style={{
                      backgroundColor: gender === g.value ? 'rgba(200,169,110,0.12)' : '#0a0a0f',
                      borderColor: gender === g.value ? '#c8a96e' : '#1e1e2e',
                      color: gender === g.value ? '#c8a96e' : '#8a8a9a',
                    }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <GoldButton onClick={handleStart} className="w-full mt-2">
              시작하기
            </GoldButton>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#8a8a9a' }}>
          본 검사는 학술 목적으로 개발된 설문지를 기반으로 합니다.<br />
          입력하신 정보는 검사 완료 후 동의 없이 저장되지 않습니다.
        </p>
      </div>
    </motion.div>
  );
}
