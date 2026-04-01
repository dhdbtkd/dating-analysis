'use client';

import { create } from 'zustand';
import type { ChatMessage, WarmupAnswer, WarmupQuestion, Question } from '@/types';
import { sampleQuestions, warmupPool, anxietyPool, avoidancePool } from '@/lib/questions';

export type Step = 'splash' | 'intro' | 'warmup' | 'quiz' | 'chat' | 'loading' | 'done';

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
  reset: () => set(initialState),
}));
