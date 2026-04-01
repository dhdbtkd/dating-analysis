'use client';

import { create } from 'zustand';
import type { ChatMessage, WarmupAnswer, WarmupQuestion, Question } from '@/types';
import { sampleQuestions, warmupPool, anxietyPool, avoidancePool } from '@/lib/questions';

export type Step = 'splash' | 'intro' | 'warmup' | 'quiz' | 'chat-intro' | 'chat' | 'loading' | 'done';

interface EcrScores {
  anxiety: number;
  avoidance: number;
  typeName: string;
}

interface UserInfo {
  nickname: string;
  age: number;
  gender: string;
}

interface AppState {
  step: Step;
  userInfo: UserInfo | null;
  sessionId: string | null;
  warmupAnswers: WarmupAnswer[];
  quizAnswers: number[];
  selectedQuestions: Question[];
  selectedWarmup: WarmupQuestion[];
  chatHistory: ChatMessage[];
  ecrScores: EcrScores | null;

  setStep: (step: Step) => void;
  setUserInfo: (info: UserInfo) => void;
  setSessionId: (id: string) => void;
  addWarmupAnswer: (answer: WarmupAnswer) => void;
  addQuizAnswer: (score: number) => void;
  setChatHistory: (history: ChatMessage[]) => void;
  setEcrScores: (scores: EcrScores) => void;
  initQuestions: () => void;
  seedDevState: (step: Step) => void;
  reset: () => void;
}

const initialState = {
  step: 'splash' as Step,
  userInfo: null,
  sessionId: null,
  warmupAnswers: [],
  quizAnswers: [],
  selectedQuestions: [],
  selectedWarmup: [],
  chatHistory: [],
  ecrScores: null,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  setUserInfo: (userInfo) => set({ userInfo }),
  setSessionId: (sessionId) => set({ sessionId }),
  addWarmupAnswer: (answer) =>
    set((state) => ({ warmupAnswers: [...state.warmupAnswers, answer] })),
  addQuizAnswer: (score) =>
    set((state) => ({ quizAnswers: [...state.quizAnswers, score] })),
  setChatHistory: (chatHistory) => set({ chatHistory }),
  setEcrScores: (ecrScores) => set({ ecrScores }),
  initQuestions: () =>
    set({
      selectedWarmup: sampleQuestions(warmupPool, 4),
      selectedQuestions: [
        ...sampleQuestions(anxietyPool, 6),
        ...sampleQuestions(avoidancePool, 6),
      ].sort(() => Math.random() - 0.5),
      warmupAnswers: [],
      quizAnswers: [],
      chatHistory: [],
      ecrScores: null,
    }),
  seedDevState: (step) => {
    const devUser = { nickname: '하임', age: 23, gender: '여성' };
    const selectedWarmup = warmupPool.slice(0, 4);
    const warmupAnswers: WarmupAnswer[] = selectedWarmup.map((question, index) => {
      const option = question.options[Math.min(index + 1, question.options.length - 1)];
      return {
        questionId: question.id,
        questionText: question.text,
        measures: question.measures,
        selectedLabel: option.label,
        selectedText: option.text,
      };
    });
    const selectedQuestions = [...anxietyPool.slice(0, 6), ...avoidancePool.slice(0, 6)];
    const quizAnswers = [6, 5, 6, 5, 6, 5, 3, 4, 5, 4, 5, 4];
    const chatHistory: ChatMessage[] = [
      { role: 'assistant', content: '연애에서 가까워질수록 마음이 복잡해지는 순간이 있다면, 보통 어떤 장면에서 그래요?' },
      { role: 'user', content: '답장이 늦거나 분위기가 달라지면 괜히 혼자 의미를 크게 받아들이게 돼요.' },
      { role: 'assistant', content: '그럴 때 바로 묻는 편인가요, 아니면 혼자 정리하는 쪽에 더 가까운가요?' },
      { role: 'user', content: '바로 말은 잘 못 하고, 티 안 내려고 하다가 혼자 식는 쪽에 가까워요.' },
    ];
    const ecrScores = { anxiety: 4.83, avoidance: 4.12, typeName: '서운함은 숨기고, 확인은 속으로 더 하는 관계형' };

    const baseState = {
      userInfo: devUser,
      sessionId: null,
      selectedWarmup,
      selectedQuestions,
      warmupAnswers: [] as WarmupAnswer[],
      quizAnswers: [] as number[],
      chatHistory: [] as ChatMessage[],
      ecrScores: null as EcrScores | null,
    };

    if (step === 'splash' || step === 'intro') {
      set({ ...initialState, step });
      return;
    }

    if (step === 'warmup') {
      set({ ...baseState, step });
      return;
    }

    if (step === 'quiz') {
      set({ ...baseState, warmupAnswers, step });
      return;
    }

    if (step === 'chat-intro') {
      set({ ...baseState, warmupAnswers, quizAnswers, ecrScores, step });
      return;
    }

    if (step === 'chat') {
      set({ ...baseState, warmupAnswers, quizAnswers, ecrScores, chatHistory, step });
      return;
    }

    set({ ...baseState, warmupAnswers, quizAnswers, ecrScores, chatHistory, step });
  },
  reset: () => set(initialState),
}));
