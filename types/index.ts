export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface WarmupQuestion {
  id: string;
  text: string;
  options: { label: string; text: string }[];
}

export interface WarmupAnswer {
  questionId: string;
  selectedLabel: string;
  selectedText: string;
}

export interface Question {
  id: string;
  text: string;
  dimension: 'anxiety' | 'avoidance';
  reverse: boolean;
}

export interface ResultJson {
  typeName: string;
  tagline: string;
  lovePattern: string;
  coreWound: string;
  actionTip: string[];
  mindset: string;
  quote: string;
  famousMatch: string;
  anxietyScore: number;
  avoidanceScore: number;
}

export interface SessionRow {
  id: string;
  nickname: string;
  age: number;
  gender: string;
  ecr_anxiety: number;
  ecr_avoidance: number;
  attachment_type: string;
  chat_history: ChatMessage[];
  result: ResultJson | null;
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
  dynamics: string;
  communicationTips: string[];
  growthSuggestions: string[];
  compatibilityNote: string;
}

export type AttachmentType = 'secure' | 'anxious' | 'avoidant' | 'fearful';
