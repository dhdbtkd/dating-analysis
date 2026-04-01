'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { GoldButton } from '@/components/ui/GoldButton';

const PAPERS = [
  {
    short: 'Brennan et al. 1998',
    full: 'Brennan, K. A., Clark, C. L., & Shaver, P. R. (1998). Self-report measurement of adult attachment: An integrative overview. In J. A. Simpson & W. S. Rholes (Eds.), Attachment theory and close relationships (pp. 46–76). Guilford Press.',
  },
  {
    short: 'Bartholomew & Horowitz 1991',
    full: 'Bartholomew, K., & Horowitz, L. M. (1991). Attachment styles among young adults: A test of a four-category model. Journal of Personality and Social Psychology, 61(2), 226–244.',
  },
  {
    short: 'Wei et al. 2007',
    full: 'Wei, M., Russell, D. W., Mallinckrodt, B., & Vogel, D. L. (2007). The Experiences in Close Relationship Scale (ECR)-Short Form: Reliability, validity, and factor structure. Journal of Personality Assessment, 88(2), 187–204.',
  },
];

export function IntroScreen() {
  const { setUserInfo, setStep, initQuestions } = useAppStore();
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const [showRef, setShowRef] = useState(false);

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
      className="flex flex-col items-center justify-center min-h-[100dvh] px-4 py-12 relative z-10"
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1
            className="text-2xl font-bold mb-3 leading-tight"
            style={{ fontFamily: 'Paperozi', color: '#e0c898' }}
          >
            당신도 몰랐던<br />나의 연애 패턴
          </h1>
          <p className="text-xs mb-4" style={{ color: '#8a8a9a' }}>
            ECR 척도 기반 성인 애착 유형 측정 + AI 심층 대화
          </p>
          <p className="text-xs" style={{ color: '#8a8a9a' }}>⏱ 약 5분 소요</p>
        </div>

        {/* Form */}
        <div
          className="rounded-2xl p-6 border"
          style={{ backgroundColor: '#111118', borderColor: '#1e1e2e' }}
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs mb-1" style={{ color: '#8a8a9a' }}>별명</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="검사에서 사용할 별명"
                maxLength={20}
                className="w-full px-4 py-3 rounded-xl outline-none transition-colors"
                style={{
                  backgroundColor: '#0a0a0f',
                  border: '1px solid #1e1e2e',
                  color: '#e8e8f0',
                  fontSize: '16px',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#c8a96e')}
                onBlur={(e) => (e.target.style.borderColor = '#1e1e2e')}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: '#8a8a9a' }}>나이</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="나이 (숫자)"
                min={16}
                max={99}
                className="w-full px-4 py-3 rounded-xl outline-none transition-colors"
                style={{
                  backgroundColor: '#0a0a0f',
                  border: '1px solid #1e1e2e',
                  color: '#e8e8f0',
                  fontSize: '16px',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#c8a96e')}
                onBlur={(e) => (e.target.style.borderColor = '#1e1e2e')}
              />
            </div>
            <div>
              <label className="block text-xs mb-2" style={{ color: '#8a8a9a' }}>성별</label>
              <div className="flex gap-2">
                {[
                  { value: 'male', label: '남성' },
                  { value: 'female', label: '여성' },
                  { value: 'other', label: '기타' },
                ].map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGender(g.value)}
                    className="flex-1 py-3 rounded-xl text-xs border transition-all duration-200 min-h-[44px]"
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
            {error && <p className="text-xs text-red-400">{error}</p>}
            <GoldButton onClick={handleStart} className="w-full mt-2">
              시작하기
            </GoldButton>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <p className="text-center text-xs" style={{ color: '#4a4a5a' }}>
            입력하신 정보는 검사 완료 후 동의 없이 저장되지 않습니다.
          </p>

          {/* Reference trigger */}
          <div className="relative flex items-center gap-1.5">
            <span className="text-xs" style={{ color: '#4a4a5a' }}>학술 논문 기반 검사</span>
            <button
              onClick={() => setShowRef((v) => !v)}
              className="w-4 h-4 rounded-full flex items-center justify-center text-xs leading-none transition-colors"
              style={{
                border: '1px solid #2e2e3e',
                color: '#6a6a7a',
                backgroundColor: showRef ? 'rgba(200,169,110,0.1)' : 'transparent',
              }}
              aria-label="참고 논문 보기"
            >
              i
            </button>

            {/* Popover */}
            <AnimatePresence>
              {showRef && (
                <>
                  {/* backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowRef(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="absolute bottom-7 left-1/2 -translate-x-1/2 z-50 w-72 rounded-xl p-4 border shadow-xl"
                    style={{ backgroundColor: '#111118', borderColor: '#1e1e2e' }}
                  >
                    <p className="text-xs font-semibold mb-3" style={{ color: '#c8a96e' }}>참고 논문</p>
                    <div className="flex flex-col gap-3">
                      {PAPERS.map((p) => (
                        <div key={p.short}>
                          <p className="text-xs font-medium mb-0.5" style={{ color: '#e8e8f0' }}>{p.short}</p>
                          <p className="text-xs leading-relaxed" style={{ color: '#6a6a7a' }}>{p.full}</p>
                        </div>
                      ))}
                    </div>
                    {/* arrow */}
                    <div
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-r border-b"
                      style={{ backgroundColor: '#111118', borderColor: '#1e1e2e' }}
                    />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
