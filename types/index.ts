export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface WarmupQuestion {
  id: string;
  text: string;
  measures: string; // LLM 프롬프트용 — 사용자에게 비표시
  options: { label: string; text: string }[];
}

export interface WarmupAnswer {
  questionId: string;
  questionText: string;
  measures: string;
  selectedLabel: string;
  selectedText: string;
}

export interface QuizDetail {
  questionText: string;
  score: number;
}

export type QuestionDimension = 'anxiety' | 'avoidance' | 'trust' | 'self_disclosure' | 'conflict' | 'rel_self_esteem';

export interface Question {
  id: string;
  text: string;
  dimension: QuestionDimension;
  reverse: boolean;
}

export interface ExtendedScores {
  anxiety: number;
  avoidance: number;
  trust: number;
  selfDisclosure: number;
  conflict: number;
  relSelfEsteem: number;
  typeName: string;
}

export interface ResultCoreJson {
  typeName: string;
  tagline: string;
  lovePattern: string;
  coreWound: string;
  actionTip: string[];
  mindset: string;
  anxietyScore: number;
  avoidanceScore: number;
}

export interface ResultDetailJson {
  patternFlow: string[];
  shakyMoments: string[];
  visibleReaction: string;
  realFeeling: string;
  partnerFeels: string[];
  whenSafe: string;
  whenShaken: string;
  nextSteps: string[];
  keyClues: string[];
}

export type ResultJson = ResultCoreJson;

export type ResultDetailStatus = 'idle' | 'pending' | 'completed' | 'failed';
export type ResultCoreStatus = 'idle' | 'pending' | 'completed' | 'failed';

export interface SessionRow {
  id: string;
  nickname: string;
  age: number;
  gender: string;
  ecr_anxiety: number;
  ecr_avoidance: number;
  score_trust: number | null;
  score_self_disclosure: number | null;
  score_conflict: number | null;
  score_rel_self_esteem: number | null;
  attachment_type: string;
  chat_history: ChatMessage[];
  warmup_answers: WarmupAnswer[];
  quiz_details: QuizDetail[];
  result: ResultCoreJson | null;
  result_status: ResultCoreStatus;
  result_error: string | null;
  result_detail: ResultDetailJson | null;
  result_detail_status: ResultDetailStatus;
  result_detail_error: string | null;
  consent: boolean;
  created_at: string;
}

export interface CoupleRow {
  id: string;
  sender_session_id: string;
  partner_session_id: string | null;
  invite_token: string;
  expires_at: string;
  couple_analysis: CoupleAnalysis | null;
  status: 'pending' | 'completed';
  created_at: string;
}

export interface CoupleAnalysis {
  summary: string;
  conflictPattern: string;
  eachPersonsCore: { name: string; core: string }[];
  coupleStrengths: string;
  communicationTips: string[];
  crisisScript: string;
  compatibilityNote: string;
}

export type AttachmentType = 'secure' | 'anxious' | 'avoidant' | 'fearful';
