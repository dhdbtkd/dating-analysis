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
    {
        short: 'Lafontaine et al. 2016',
        full: 'Lafontaine, M.-F., Brassard, A., Lussier, Y., Valois, P., Shaver, P. R., & Johnson, S. M. (2016). Selecting the best items for a short-form of the Experiences in Close Relationships questionnaire (ECR-12).',
    },
    {
        short: 'Rempel, Holmes & Zanna 1985',
        full: 'Rempel, J. K., Holmes, J. G., & Zanna, M. P. (1985). Trust in close relationships. Journal of Personality and Social Psychology, 49(1), 95–112.',
    },
    {
        short: 'Miller et al. 1983',
        full: 'Miller, L. C., Berg, J. H., & Archer, R. L. (1983). Openers: Individuals who elicit intimate self-disclosure. Journal of Personality and Social Psychology, 44(6), 1234–1244.',
    },
    {
        short: 'Rahim 1983',
        full: 'Rahim, M. A. (1983). A measure of styles of handling interpersonal conflict. Academy of Management Journal, 26(2), 368–376.',
    },
    {
        short: 'Murray et al. 2000',
        full: 'Murray, S. L., Holmes, J. G., & Griffin, D. W. (2000). Self-esteem and the quest for felt security: How perceived regard regulates attachment processes. Journal of Personality and Social Psychology, 78(3), 478–498.',
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
        if (!nickname.trim()) return setError('닉네임을 입력해주세요.');
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
            initial={{ clipPath: 'circle(0% at 50% 50%)', opacity: 1 }}
            animate={{ clipPath: 'circle(160% at 50% 50%)', opacity: 1 }}
            exit={{ opacity: 0, y: -20, clipPath: 'circle(160% at 50% 50%)' }}
            transition={{ duration: 0.85, ease: [0.4, 0, 0.15, 1] }}
            className="flex flex-col items-center justify-center min-h-[100dvh] px-6 py-16"
            style={{ backgroundColor: '#f7f9fb' }}
        >
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="mb-12">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#0060ac' }}>
                        나의 연애 패턴 알아보기
                    </p>
                    <h1
                        className="text-3xl font-bold mb-4 leading-tight"
                        style={{ fontFamily: 'Paperozi', color: '#002045' }}
                    >
                        알고보면 보이는
                        <br />
                        나의 연애
                    </h1>
                    <p className="text-sm leading-relaxed" style={{ color: '#43474e' }}>
                        질문에 답하고, 짧은 대화를 나누면
                        <br />
                        나의 연애 패턴이 보이기 시작해요.
                    </p>
                    <p className="text-xs mt-3" style={{ color: '#74777f' }}>
                        ⏱ 약 7분 소요
                    </p>
                </div>

                {/* Form */}
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-semibold mb-2" style={{ color: '#43474e' }}>
                            닉네임
                        </label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="뭐라고 부를까요?"
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
                        <label className="block text-xs font-semibold mb-2" style={{ color: '#43474e' }}>
                            나이
                        </label>
                        <input
                            type="number"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            placeholder="나이를 알려주세요"
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
                        <label className="block text-xs font-semibold mb-2" style={{ color: '#43474e' }}>
                            성별
                        </label>
                        <div className="flex gap-2">
                            {[
                                { value: 'male', label: '남자' },
                                { value: 'female', label: '여자' },
                                // { value: 'other', label: '숨기기' },
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
                    {error && (
                        <p className="text-xs" style={{ color: '#ba1a1a' }}>
                            {error}
                        </p>
                    )}
                    <GoldButton onClick={handleStart} className="w-full mt-4">
                        시작하기
                    </GoldButton>
                </div>

                {/* Footer */}
                <div className="mt-10 flex flex-col items-center gap-2">
                    <p className="text-center text-xs" style={{ color: '#74777f' }}>
                        입력하신 정보는 동의 없이 저장되지 않아요.
                    </p>
                    <div className="relative flex items-center gap-1.5">
                        <span className="text-xs" style={{ color: '#74777f' }}>
                            학술 연구 기반
                        </span>
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
                                        className="absolute bottom-7 left-1/2 -translate-x-1/2 z-50 w-72 rounded-2xl soft-lift overflow-hidden"
                                        style={{ backgroundColor: '#ffffff' }}
                                    >
                                        <div className="px-5 pt-5 pb-1">
                                            <p className="text-xs font-semibold" style={{ color: '#002045' }}>참고 논문</p>
                                        </div>
                                        <div className="overflow-y-auto px-5 pb-5" style={{ maxHeight: '260px' }}>
                                        <div className="flex flex-col gap-3 mt-3">
                                            {PAPERS.map((p) => (
                                                <div key={p.short}>
                                                    <p
                                                        className="text-xs font-semibold mb-0.5"
                                                        style={{ color: '#191c1e' }}
                                                    >
                                                        {p.short}
                                                    </p>
                                                    <p className="text-xs leading-relaxed" style={{ color: '#74777f' }}>
                                                        {p.full}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
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
