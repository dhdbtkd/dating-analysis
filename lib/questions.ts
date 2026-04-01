import type { WarmupQuestion, Question } from '@/types';

export const warmupPool: WarmupQuestion[] = [
  {
    id: 'W1',
    text: '연인이 카톡을 2시간째 읽씹하고 있다. 나의 반응은?',
    measures: 'ECR 불안 차원 — 애착 신호 부재 시 과활성화 전략 (Brennan et al. 1998)',
    options: [
      { label: 'A', text: '바쁜가 보다 하고 그냥 기다린다' },
      { label: 'B', text: '슬슬 불안해지며 \'혹시 나한테 화났나?\' 생각한다' },
      { label: 'C', text: '나도 할 일 하면서 신경 끈다' },
      { label: 'D', text: '이유를 직접 물어본다' },
    ],
  },
  {
    id: 'W2',
    text: '연인이 "우리 좀 거리를 두자"고 말했다. 첫 반응은?',
    measures: 'ECR 불안 차원 — 분리 위협에 대한 정서 반응 (Brennan et al. 1998)',
    options: [
      { label: 'A', text: '"알겠어, 각자 시간 갖자"' },
      { label: 'B', text: '가슴이 철렁, 이별 예감에 불안해진다' },
      { label: 'C', text: '솔직히 좀 홀가분하다' },
      { label: 'D', text: '무슨 의미인지 정확히 파악하려 한다' },
    ],
  },
  {
    id: 'W3',
    text: '첫 데이트 후 연락 빈도는?',
    measures: 'ECR 불안 차원 — 근접성 추구 행동 빈도 (Hazan & Shaver 1987 기반, Wei et al. 2007)',
    options: [
      { label: 'A', text: '평소 페이스대로, 억지로 늘리지 않는다' },
      { label: 'B', text: '자꾸 생각나서 먼저 연락하게 된다' },
      { label: 'C', text: '상대가 연락할 때만 답한다' },
      { label: 'D', text: '적당히 주고받는 균형을 찾는다' },
    ],
  },
  {
    id: 'W4',
    text: '싸운 뒤 연인에게서 연락이 없다. 나는?',
    measures: 'ECR 불안+회피 복합 — 갈등 후 재접근 행동 vs 철수 전략 (Bartholomew & Horowitz 1991)',
    options: [
      { label: 'A', text: '감정이 가라앉으면 자연스럽게 먼저 연락한다' },
      { label: 'B', text: '불안해서 계속 연락을 시도한다' },
      { label: 'C', text: '상대가 먼저 연락할 때까지 기다린다' },
      { label: 'D', text: '혼자 정리할 시간이 필요해 일부러 거리를 둔다' },
    ],
  },
  {
    id: 'W5',
    text: '연인이 나를 두고 친구들과만 여행을 간다면?',
    measures: 'ECR 불안 차원 — 분리 상황의 정서 반응, 질투 경향 (Brennan et al. 1998)',
    options: [
      { label: 'A', text: '나도 내 시간을 즐긴다' },
      { label: 'B', text: '섭섭하고 소외감을 느낀다' },
      { label: 'C', text: '잘 됐다, 혼자 시간이 생긴다' },
      { label: 'D', text: '다음엔 같이 가자고 미리 얘기해 둔다' },
    ],
  },
  {
    id: 'W6',
    text: '연애에서 "나"의 역할을 한 단어로 표현한다면?',
    measures: 'B&H 자기 모델 — 관계 내 자기 인식 (긍정적/부정적 자기상, Bartholomew & Horowitz 1991)',
    options: [
      { label: 'A', text: '동반자' },
      { label: 'B', text: '전부' },
      { label: 'C', text: '독립체' },
      { label: 'D', text: '관찰자' },
    ],
  },
  {
    id: 'W7',
    text: '연인이 힘들다고 털어놓을 때 나는?',
    measures: 'B&H 타인 모델 — 파트너 고통에 대한 반응, 돌봄 행동 (Bartholomew & Horowitz 1991)',
    options: [
      { label: 'A', text: '공감하며 옆에 있어준다' },
      { label: 'B', text: '내 일처럼 같이 걱정한다' },
      { label: 'C', text: '조언을 주되 과도하게 개입하지 않는다' },
      { label: 'D', text: '솔직히 어떻게 반응해야 할지 모를 때가 있다' },
    ],
  },
  {
    id: 'W8',
    text: '연인과의 미래 계획을 이야기할 때 느낌은?',
    measures: 'ECR 회피 차원 — 장기 친밀감에 대한 불편감, 헌신 회피 (Wei et al. 2007)',
    options: [
      { label: 'A', text: '설레고 즐겁다' },
      { label: 'B', text: '확인받는 느낌이 들어서 좋다' },
      { label: 'C', text: '너무 먼 미래 얘기는 부담스럽다' },
      { label: 'D', text: '현실적으로 따져본다' },
    ],
  },
  {
    id: 'W9',
    text: '연인과 처음 "사랑해"를 말하는 순간, 나는?',
    measures: 'ECR 회피+불안 복합 — 감정 표현 회피 vs 확인 욕구 (Brennan et al. 1998)',
    options: [
      { label: 'A', text: '자연스럽게 표현했다' },
      { label: 'B', text: '먼저 말하고 싶었지만 눈치를 봤다' },
      { label: 'C', text: '상대가 먼저 말할 때까지 기다렸다' },
      { label: 'D', text: '표현 자체가 조금 쑥스러웠다' },
    ],
  },
  {
    id: 'W10',
    text: '이별 후 회복 방식은?',
    measures: 'ECR 불안+회피 복합 — 애착 상실 후 정서 조절 전략 (Wei et al. 2007)',
    options: [
      { label: 'A', text: '시간이 지나면서 자연스럽게 회복된다' },
      { label: 'B', text: '오래 그리워하며 SNS를 반복해서 본다' },
      { label: 'C', text: '빠르게 일상으로 복귀, 감정을 잘 드러내지 않는다' },
      { label: 'D', text: '원인을 분석하며 다음엔 다르게 하겠다고 다짐한다' },
    ],
  },
  {
    id: 'W11',
    text: '힘든 하루였다. 연인에게 어떻게 하나요?',
    measures: 'ECR 회피 차원 — 자기 공개 회피, 의존 불편감 (B&H 1991 거부-회피형의 핵심 지표)',
    options: [
      { label: 'A', text: '자연스럽게 오늘 있었던 일을 털어놓는다' },
      { label: 'B', text: '힘들다고 말하되, 세세한 속마음까지는 꺼내기 어렵다' },
      { label: 'C', text: '걱정 끼치기 싫어서 "괜찮아"라고 한다' },
      { label: 'D', text: '연인보다 혼자 해결하거나 다른 방식으로 푼다' },
    ],
  },
  {
    id: 'W12',
    text: '연인의 SNS에 모르는 이성이 친근한 댓글을 달았다. 나는?',
    measures: 'ECR 불안 차원 — 질투 및 관계 위협 모니터링 행동 (Brennan et al. 1998 불안 하위 문항)',
    options: [
      { label: 'A', text: '별로 신경 안 쓰인다' },
      { label: 'B', text: '신경은 쓰이지만 내색하지 않는다' },
      { label: 'C', text: '슬쩍 누군지 물어보거나 확인하게 된다' },
      { label: 'D', text: '솔직하게 불편하다고 말한다' },
    ],
  },
  {
    id: 'W13',
    text: '연인이 "오늘 하루 종일 같이 있고 싶어"라고 한다. 나의 솔직한 반응은?',
    measures: 'ECR 회피 차원 — 신체적·감정적 근접성 선호도, 친밀감 불편감 (Wei et al. 2007)',
    options: [
      { label: 'A', text: '나도 그러고 싶다, 설렌다' },
      { label: 'B', text: '좋긴 한데 하루 종일은 살짝 부담스럽다' },
      { label: 'C', text: '솔직히 나만의 시간이 필요해서 조율하고 싶다' },
      { label: 'D', text: '상황에 따라 다르다' },
    ],
  },
  {
    id: 'W14',
    text: '연인이 바쁜 시기에 연락이 뜸해졌다. 나는 어떻게 되나요?',
    measures: 'ECR 불안 차원 — 안심 추구 행동, 확인 욕구 (Brennan et al. 1998 불안 핵심 구인)',
    options: [
      { label: 'A', text: '바쁜가 보다 하고 기다린다' },
      { label: 'B', text: '나를 덜 좋아하게 된 건 아닌지 불안해진다' },
      { label: 'C', text: '오히려 나도 내 일에 집중하게 된다' },
      { label: 'D', text: '"요즘 많이 바빠?" 하고 가볍게 확인한다' },
    ],
  },
];

export const anxietyPool: Question[] = [
  {
    id: 'A1',
    text: '연인에게 연락이 평소보다 늦게 올 때, 마음속에서 가장 먼저 떠오르는 생각은 어느 쪽에 가깝나요?',
    dimension: 'anxiety',
    reverse: false,
  },
  {
    id: 'A2',
    text: '관계가 잘 흘러가고 있을 때도, 문득 "이게 언제까지 계속될까" 하는 생각이 찾아오는 편인가요?',
    dimension: 'anxiety',
    reverse: false,
  },
  {
    id: 'A3',
    text: '내가 원하는 만큼 상대도 이 관계에 마음을 쏟고 있는지, 가끔 가늠하기 어렵게 느껴지나요?',
    dimension: 'anxiety',
    reverse: false,
  },
  {
    id: 'A4',
    text: '연인에게 "나 요즘 어때 보여?" 같은 말을 건네거나, 내가 소중한 사람인지 확인하고 싶어질 때가 있나요?',
    dimension: 'anxiety',
    reverse: false,
  },
  {
    id: 'A5',
    text: '연인이 나를 얼마나 아끼는지, 직접 말해주지 않으면 잘 믿어지지 않는 편인가요?',
    dimension: 'anxiety',
    reverse: false,
  },
  {
    id: 'A6',
    text: '사소한 다툼이나 냉랭한 분위기 뒤에, "혹시 이게 끝의 시작일까" 하는 불안이 스치나요?',
    dimension: 'anxiety',
    reverse: false,
  },
  {
    id: 'A7',
    text: '연인과의 관계가 흔들릴지 모른다는 걱정 없이, 지금 이 순간에 온전히 있을 수 있는 편인가요?',
    dimension: 'anxiety',
    reverse: true,
  },
  {
    id: 'A8',
    text: '연인이 갑자기 마음이 식으면 어떡하나 하는 생각이, 일상 속에서 거의 떠오르지 않는 편인가요?',
    dimension: 'anxiety',
    reverse: true,
  },
];

export const avoidancePool: Question[] = [
  {
    id: 'V1',
    text: '연인이 "요즘 무슨 생각 해?" 하고 물어올 때, 속마음을 그대로 꺼내기보다 적당히 추스르게 되나요?',
    dimension: 'avoidance',
    reverse: false,
  },
  {
    id: 'V2',
    text: '힘든 일이 생겼을 때, 연인보다 혼자 해결하는 쪽이 더 편하게 느껴지나요?',
    dimension: 'avoidance',
    reverse: false,
  },
  {
    id: 'V3',
    text: '관계가 깊어질수록 오히려 살짝 물러서고 싶어지거나, 숨이 막히는 느낌이 드는 편인가요?',
    dimension: 'avoidance',
    reverse: false,
  },
  {
    id: 'V4',
    text: '연인에게 털어놓기 전에, "이 얘기까지 해야 하나?" 하고 한 번 더 망설이게 되나요?',
    dimension: 'avoidance',
    reverse: false,
  },
  {
    id: 'V5',
    text: '연인과 마음이 가까워지는 느낌이 들 때, 자연스럽고 편안한 편인가요?',
    dimension: 'avoidance',
    reverse: true,
  },
  {
    id: 'V6',
    text: '기댈 수 있는 사람이 곁에 있다는 느낌, 연인과의 관계에서 쉽게 느껴지나요?',
    dimension: 'avoidance',
    reverse: true,
  },
  {
    id: 'V7',
    text: '서로의 일상에 자연스럽게 스며드는 것, 연인과의 관계에서 즐거운 편인가요?',
    dimension: 'avoidance',
    reverse: true,
  },
  {
    id: 'V8',
    text: '연인이 감정적으로 많이 기대오거나 의지하려 할 때, 부담스럽거나 불편해지는 편인가요?',
    dimension: 'avoidance',
    reverse: false,
  },
];

export function sampleQuestions<T>(pool: T[], n: number): T[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export function getAttachmentType(anxiety: number, avoidance: number): string {
  if (anxiety < 4 && avoidance < 4) return '따뜻한 안착형';
  if (anxiety >= 4 && avoidance < 4) return '소용돌이형';
  if (anxiety < 4 && avoidance >= 4) return '고독한 고지형';
  return '이중심리형';
}

export function getAttachmentEmoji(anxiety: number, avoidance: number): string {
  if (anxiety < 4 && avoidance < 4) return '🌿';
  if (anxiety >= 4 && avoidance < 4) return '🌪️';
  if (anxiety < 4 && avoidance >= 4) return '🏔️';
  return '🎭';
}

export function getAttachmentAcademic(anxiety: number, avoidance: number): string {
  if (anxiety < 4 && avoidance < 4) return '안정형';
  if (anxiety >= 4 && avoidance < 4) return '집착형';
  if (anxiety < 4 && avoidance >= 4) return '거부-회피형';
  return '두려움-회피형';
}

