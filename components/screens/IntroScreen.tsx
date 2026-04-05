'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { GoldButton } from '@/components/ui/GoldButton';

const PAPERS = [
  {
    short: 'Brennan et al. 1998',
    full: 'Brennan, K. A., Clark, C. L., & Shaver, P. R. (1998). Self-report measurement of adult attachment: An integrative overview.',
  },
  {
    short: 'Bartholomew & Horowitz 1991',
    full: 'Bartholomew, K., & Horowitz, L. M. (1991). Attachment styles among young adults: A test of a four-category model.',
  },
  {
    short: 'Wei et al. 2007',
    full: 'Wei, M., Russell, D. W., Mallinckrodt, B., & Vogel, D. L. (2007). The Experiences in Close Relationship Scale (ECR)-Short Form.',
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
      className="flex flex-col items-center justify-center min-h-[100dvh] px-6 py-16"
      style={{ backgroundColor: '#f7f9fb' }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#0060ac' }}>
            ECR 성인 애착 검사
          </p>
          <h1
            className="text-3xl font-bold mb-4 leading-tight"
            style={{ fontFamily: 'Paperozi', color: '#002045' }}
          >
            알고보면 보이는<br />나의 연애
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#43474e' }}>
            학술 연구 기반의 ECR 척도로 애착 유형을 측정하고,<br />AI 심층 대화로 나만의 패턴을 분석합니다.
          </p>
          <p className="text-xs mt-3" style={{ color: '#74777f' }}>⏱ 약 5분 소요</p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#43474e' }}>별명</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="검사에서 사용할 별명"
              maxLength={20}
              className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
              style={{
                backgroundColor: '#f2f4f6',
                border: '2px solid transparent',
                color: '#191c1e',
                fontSize: '16px',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#0060ac')}
              onBlur={(e) => (e.target.style.borderColor = 'transparent')}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#43474e' }}>나이</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="나이 (숫자)"
              min={16}
              max={99}
              className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
              style={{
                backgroundColor: '#f2f4f6',
                border: '2px solid transparent',
                color: '#191c1e',
                fontSize: '16px',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#0060ac')}
              onBlur={(e) => (e.target.style.borderColor = 'transparent')}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#43474e' }}>성별</label>
            <div className="flex gap-2">
              {[
                { value: 'male', label: '남성' },
                { value: 'female', label: '여성' },
                { value: 'other', label: '기타' },
              ].map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGender(g.value)}
                  className="flex-1 py-3 rounded-2xl text-sm transition-all duration-200 min-h-[44px] active:scale-[0.98]"
                  style={{
                    backgroundColor: gender === g.value ? '#dbeafe' : '#f2f4f6',
                    color: gender === g.value ? '#002045' : '#43474e',
                    fontWeight: gender === g.value ? 600 : 400,
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-xs" style={{ color: '#ba1a1a' }}>{error}</p>}
          <GoldButton onClick={handleStart} className="w-full mt-4">
            시작하기
          </GoldButton>
        </div>

        {/* Footer */}
        <div className="mt-10 flex flex-col items-center gap-2">
          <p className="text-center text-xs" style={{ color: '#74777f' }}>
            입력하신 정보는 검사 완료 후 동의 없이 저장되지 않습니다.
          </p>
          <div className="relative flex items-center gap-1.5">
            <span className="text-xs" style={{ color: '#74777f' }}>학술 논문 기반 검사</span>
            <button
              onClick={() => setShowRef((v) => !v)}
              className="w-4 h-4 rounded-full flex items-center justify-center text-xs leading-none transition-colors"
              style={{
                backgroundColor: showRef ? '#dbeafe' : '#e6e8ea',
                color: '#43474e',
              }}
              aria-label="참고 논문 보기"
            >
              i
            </button>
            <AnimatePresence>
              {showRef && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowRef(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="absolute bottom-7 left-1/2 -translate-x-1/2 z-50 w-72 rounded-2xl p-5 soft-lift"
                    style={{ backgroundColor: '#ffffff' }}
                  >
                    <p className="text-xs font-semibold mb-3" style={{ color: '#002045' }}>참고 논문</p>
                    <div className="flex flex-col gap-3">
                      {PAPERS.map((p) => (
                        <div key={p.short}>
                          <p className="text-xs font-semibold mb-0.5" style={{ color: '#191c1e' }}>{p.short}</p>
                          <p className="text-xs leading-relaxed" style={{ color: '#74777f' }}>{p.full}</p>
                        </div>
                      ))}
                    </div>
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
