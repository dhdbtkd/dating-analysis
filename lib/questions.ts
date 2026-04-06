import type { WarmupQuestion, Question, QuestionDimension } from '@/types';

// ─────────────────────────────────────────────
// 워밍업 풀 (다양화: 애착 외 신뢰·자기개방·갈등·자존감 커버)
// ─────────────────────────────────────────────
export const warmupPool: WarmupQuestion[] = [
  // ECR 불안 계열
  {
    id: 'W1',
    text: '연인이 카톡을 2시간째 읽씹하고 있다. 나의 반응은?',
    measures: 'ECR 불안 — 애착 신호 부재 시 과활성화 전략',
    options: [
      { label: 'A', text: '바쁜가 보다 하고 그냥 기다린다' },
      { label: 'B', text: '슬슬 불안해지며 혹시 나한테 화났나 생각한다' },
      { label: 'C', text: '나도 할 일 하면서 신경 끈다' },
      { label: 'D', text: '이유를 직접 물어본다' },
    ],
  },
  {
    id: 'W2',
    text: '연인이 "우리 좀 거리를 두자"고 말했다. 첫 반응은?',
    measures: 'ECR 불안 — 분리 위협에 대한 정서 반응',
    options: [
      { label: 'A', text: '"알겠어, 각자 시간 갖자"' },
      { label: 'B', text: '가슴이 철렁, 이별 예감에 불안해진다' },
      { label: 'C', text: '솔직히 좀 홀가분하다' },
      { label: 'D', text: '무슨 의미인지 정확히 파악하려 한다' },
    ],
  },
  {
    id: 'W3',
    text: '싸운 뒤 연인에게서 연락이 없다. 나는?',
    measures: 'ECR 불안+회피 복합 — 갈등 후 재접근 vs 철수 전략',
    options: [
      { label: 'A', text: '감정이 가라앉으면 자연스럽게 먼저 연락한다' },
      { label: 'B', text: '불안해서 계속 연락을 시도한다' },
      { label: 'C', text: '상대가 먼저 연락할 때까지 기다린다' },
      { label: 'D', text: '혼자 정리할 시간이 필요해 일부러 거리를 둔다' },
    ],
  },
  {
    id: 'W4',
    text: '연인이 바쁜 시기에 연락이 뜸해졌다. 나는 어떻게 되나요?',
    measures: 'ECR 불안 — 안심 추구 행동, 확인 욕구',
    options: [
      { label: 'A', text: '바쁜가 보다 하고 기다린다' },
      { label: 'B', text: '나를 덜 좋아하게 된 건 아닌지 불안해진다' },
      { label: 'C', text: '오히려 나도 내 일에 집중하게 된다' },
      { label: 'D', text: '"요즘 많이 바빠?" 하고 가볍게 확인한다' },
    ],
  },
  // ECR 회피 계열
  {
    id: 'W5',
    text: '힘든 하루였다. 연인에게 어떻게 하나요?',
    measures: 'ECR 회피 — 자기 공개 회피, 의존 불편감',
    options: [
      { label: 'A', text: '자연스럽게 오늘 있었던 일을 털어놓는다' },
      { label: 'B', text: '힘들다고 말하되, 세세한 속마음까지는 꺼내기 어렵다' },
      { label: 'C', text: '걱정 끼치기 싫어서 "괜찮아"라고 한다' },
      { label: 'D', text: '연인보다 혼자 해결하거나 다른 방식으로 푼다' },
    ],
  },
  {
    id: 'W6',
    text: '연인이 "오늘 하루 종일 같이 있고 싶어"라고 한다. 나의 솔직한 반응은?',
    measures: 'ECR 회피 — 신체적·감정적 근접성 선호도',
    options: [
      { label: 'A', text: '나도 그러고 싶다, 설렌다' },
      { label: 'B', text: '좋긴 한데 하루 종일은 살짝 부담스럽다' },
      { label: 'C', text: '솔직히 나만의 시간이 필요해서 조율하고 싶다' },
      { label: 'D', text: '상황에 따라 다르다' },
    ],
  },
  {
    id: 'W7',
    text: '연인과의 미래 계획을 이야기할 때 느낌은?',
    measures: 'ECR 회피 — 장기 친밀감에 대한 불편감, 헌신 회피',
    options: [
      { label: 'A', text: '설레고 즐겁다' },
      { label: 'B', text: '확인받는 느낌이 들어서 좋다' },
      { label: 'C', text: '너무 먼 미래 얘기는 부담스럽다' },
      { label: 'D', text: '현실적으로 따져본다' },
    ],
  },
  // 신뢰 계열
  {
    id: 'W8',
    text: '연인이 친구에게 나에 대한 이야기를 했다는 걸 알게 됐다. 어떤 생각이 드나요?',
    measures: '신뢰 — 파트너 의도에 대한 기본 귀인 방향',
    options: [
      { label: 'A', text: '좋게 얘기했겠지, 별로 신경 안 쓴다' },
      { label: 'B', text: '어떻게 얘기했는지 살짝 궁금하고 신경 쓰인다' },
      { label: 'C', text: '굳이 내 얘기를 했다는 게 마음에 걸린다' },
      { label: 'D', text: '연인에게 직접 어떻게 얘기했는지 물어본다' },
    ],
  },
  {
    id: 'W9',
    text: '연인이 예전에 한 번 약속을 어긴 적이 있다. 지금 나는?',
    measures: '신뢰 — 과거 경험 기반 신뢰 지속성',
    options: [
      { label: 'A', text: '이미 넘어갔다, 지금은 믿는다' },
      { label: 'B', text: '믿으려 하지만 가끔 그 일이 떠오른다' },
      { label: 'C', text: '비슷한 상황이 오면 자동으로 경계하게 된다' },
      { label: 'D', text: '솔직히 완전히 믿기가 어렵다' },
    ],
  },
  // 자기개방성 계열
  {
    id: 'W10',
    text: '연인에게 처음 "사랑해"를 말하는 순간, 나는?',
    measures: '자기개방성 — 감정 표현 회피 vs 개방',
    options: [
      { label: 'A', text: '자연스럽게 표현했다' },
      { label: 'B', text: '먼저 말하고 싶었지만 눈치를 봤다' },
      { label: 'C', text: '상대가 먼저 말할 때까지 기다렸다' },
      { label: 'D', text: '표현 자체가 조금 쑥스러웠다' },
    ],
  },
  {
    id: 'W11',
    text: '연인과 깊은 대화를 할 때, 나는 어느 정도까지 열어놓는 편인가요?',
    measures: '자기개방성 — 자기 노출 깊이',
    options: [
      { label: 'A', text: '속마음 거의 다 얘기하는 편이다' },
      { label: 'B', text: '감정은 말하지만 깊은 두려움이나 약점은 아직 어렵다' },
      { label: 'C', text: '필요한 얘기는 하지만 감정을 드러내는 건 별로다' },
      { label: 'D', text: '연인이라도 잘 모르겠다, 말 안 해도 알아주길 바란다' },
    ],
  },
  // 갈등 대처 계열
  {
    id: 'W12',
    text: '연인과 의견이 충돌했다. 나의 첫 반응은?',
    measures: '갈등 대처 — 초기 갈등 반응 패턴',
    options: [
      { label: 'A', text: '일단 상대 얘기를 다 들어본다' },
      { label: 'B', text: '내 입장을 먼저 명확히 말한다' },
      { label: 'C', text: '분위기가 나빠질까봐 그냥 넘기려 한다' },
      { label: 'D', text: '잠깐 거리를 두고 나중에 얘기한다' },
    ],
  },
  {
    id: 'W13',
    text: '연인과 큰 다툼 후 화해하는 나만의 방식은?',
    measures: '갈등 대처 — 갈등 후 회복 전략',
    options: [
      { label: 'A', text: '충분히 이야기해서 서로 이해하고 마무리한다' },
      { label: 'B', text: '시간이 지나면 자연스럽게 풀린다' },
      { label: 'C', text: '내가 먼저 양보하거나 사과하는 편이다' },
      { label: 'D', text: '솔직히 화해 과정 자체가 어색하고 힘들다' },
    ],
  },
  // 관계 자존감 계열
  {
    id: 'W14',
    text: '연인이 나를 좋아하는 이유를 생각할 때, 나는?',
    measures: '관계 자존감 — 자기가치감, 사랑받을 자격 인식',
    options: [
      { label: 'A', text: '여러 이유가 자연스럽게 떠오른다' },
      { label: 'B', text: '이유가 있겠지 하면서도 가끔 확신이 안 선다' },
      { label: 'C', text: '나한테 뭘 보는 건지 솔직히 잘 모르겠다' },
      { label: 'D', text: '언젠가 실망하지 않을까 하는 생각이 든다' },
    ],
  },
  {
    id: 'W15',
    text: '연애에서 "나"의 역할을 한 단어로 표현한다면?',
    measures: '관계 자존감 — 관계 내 자기 인식',
    options: [
      { label: 'A', text: '동반자' },
      { label: 'B', text: '전부' },
      { label: 'C', text: '나 자신' },
      { label: 'D', text: '노력하는 사람' },
    ],
  },
  {
    id: 'W16',
    text: '이별 후 회복 방식은?',
    measures: 'ECR 복합 — 애착 상실 후 정서 조절 전략',
    options: [
      { label: 'A', text: '시간이 지나면서 자연스럽게 회복된다' },
      { label: 'B', text: '오래 그리워하며 SNS를 반복해서 본다' },
      { label: 'C', text: '빠르게 일상으로 복귀, 감정을 잘 드러내지 않는다' },
      { label: 'D', text: '원인을 분석하며 다음엔 다르게 하겠다고 다짐한다' },
    ],
  },
];

// ─────────────────────────────────────────────
// ECR-12 (Lafontaine et al., 2016)
// ─────────────────────────────────────────────
export const anxietyPool: Question[] = [
  { id: 'A1', text: '연인이 나를 정말로 원하는지 확신이 서지 않아 걱정될 때가 많다.', dimension: 'anxiety', reverse: false },
  { id: 'A2', text: '연인에게 버림받을까봐 자주 걱정된다.', dimension: 'anxiety', reverse: false },
  { id: 'A3', text: '연인이 나만큼 이 관계를 소중히 여기는지 걱정된다.', dimension: 'anxiety', reverse: false },
  { id: 'A4', text: '연인과의 관계가 흔들릴까봐 불안해지는 일이 자주 있다.', dimension: 'anxiety', reverse: false },
  { id: 'A5', text: '연인에게 충분히 소중한 사람인지 확인받고 싶은 마음이 자주 생긴다.', dimension: 'anxiety', reverse: false },
  { id: 'A6', text: '연인과 함께일 때 이 관계를 잃을까봐 걱정하기보다 편안하게 즐기는 편이다.', dimension: 'anxiety', reverse: true },
];

export const avoidancePool: Question[] = [
  { id: 'V1', text: '연인에게 속마음을 드러내는 것이 불편하다.', dimension: 'avoidance', reverse: false },
  { id: 'V2', text: '힘든 일이 생기면 연인에게 기대기보다 혼자 해결하는 편이 더 편하다.', dimension: 'avoidance', reverse: false },
  { id: 'V3', text: '관계가 깊어질수록 오히려 거리를 두고 싶어진다.', dimension: 'avoidance', reverse: false },
  { id: 'V4', text: '연인에게 감정적으로 의존하는 것이 불편하다.', dimension: 'avoidance', reverse: false },
  { id: 'V5', text: '연인과 마음이 가까워질수록 자연스럽고 편안한 편이다.', dimension: 'avoidance', reverse: true },
  { id: 'V6', text: '연인이 곁에 있으면 기댈 수 있다는 느낌이 자연스럽게 드는 편이다.', dimension: 'avoidance', reverse: true },
];

// ─────────────────────────────────────────────
// 신뢰 (Rempel & Holmes Trust Scale 기반 단축형)
// ─────────────────────────────────────────────
export const trustPool: Question[] = [
  { id: 'T1', text: '연인은 내게 솔직하게 말한다고 믿는다.', dimension: 'trust', reverse: false },
  { id: 'T2', text: '연인은 약속을 지키는 편이다.', dimension: 'trust', reverse: false },
  { id: 'T3', text: '연인의 말과 행동이 일관적이라고 느낀다.', dimension: 'trust', reverse: false },
  { id: 'T4', text: '어려운 상황에서도 연인이 내 편이 되어줄 것이라 믿는다.', dimension: 'trust', reverse: false },
  { id: 'T5', text: '연인의 의도를 기본적으로 좋게 보는 편이다.', dimension: 'trust', reverse: false },
  { id: 'T6', text: '연인을 완전히 믿는 것이 두렵게 느껴진다.', dimension: 'trust', reverse: true },
  { id: 'T7', text: '연인이 나를 실망시킬 것 같은 예감이 든다.', dimension: 'trust', reverse: true },
  { id: 'T8', text: '연인과의 미래에 대해 믿음이 있다.', dimension: 'trust', reverse: false },
];

// ─────────────────────────────────────────────
// 자기개방성 (Opener Scale / Jourard 기반 단축형)
// ─────────────────────────────────────────────
export const selfDisclosurePool: Question[] = [
  { id: 'S1', text: '연인에게 내 감정을 솔직하게 말하는 편이다.', dimension: 'self_disclosure', reverse: false },
  { id: 'S2', text: '연인에게 나의 약점이나 두려움을 털어놓기가 어렵다.', dimension: 'self_disclosure', reverse: true },
  { id: 'S3', text: '연인과 대화할 때 진짜 속마음을 드러내는 편이다.', dimension: 'self_disclosure', reverse: false },
  { id: 'S4', text: '연인에게 부정적인 감정도 표현하는 편이다.', dimension: 'self_disclosure', reverse: false },
  { id: 'S5', text: '나에 대한 깊은 이야기를 연인과 나누는 것이 불편하다.', dimension: 'self_disclosure', reverse: true },
  { id: 'S6', text: '연인 앞에서 있는 그대로의 나를 보여줄 수 있다.', dimension: 'self_disclosure', reverse: false },
];

// ─────────────────────────────────────────────
// 갈등 대처 건강도 (ROCI-II 기반 단축형)
// 협력·타협 → 건강한 방향 / 회피·경쟁 → 역채점
// ─────────────────────────────────────────────
export const conflictPool: Question[] = [
  // 협력
  { id: 'C1', text: '갈등이 생기면 두 사람 모두 만족할 수 있는 해결책을 함께 찾으려 한다.', dimension: 'conflict', reverse: false },
  { id: 'C2', text: '문제가 생겼을 때 대화로 풀어가려고 노력하는 편이다.', dimension: 'conflict', reverse: false },
  // 타협
  { id: 'C3', text: '서로 조금씩 양보해서 해결하는 방식을 선호한다.', dimension: 'conflict', reverse: false },
  { id: 'C4', text: '완벽한 해결보다 빠른 합의를 위해 일부를 양보할 수 있다.', dimension: 'conflict', reverse: false },
  // 회피 (역채점)
  { id: 'C5', text: '갈등 상황 자체를 피하려는 편이다.', dimension: 'conflict', reverse: true },
  { id: 'C6', text: '불편한 주제는 꺼내지 않고 넘어가려 한다.', dimension: 'conflict', reverse: true },
  // 경쟁 (역채점)
  { id: 'C7', text: '갈등에서 내 입장을 끝까지 관철시키려 하는 편이다.', dimension: 'conflict', reverse: true },
  { id: 'C8', text: '갈등 시 상대를 설득해서 내 뜻대로 하려는 편이다.', dimension: 'conflict', reverse: true },
];

// ─────────────────────────────────────────────
// 관계 자존감 (Murray RSES 기반 단축형)
// ─────────────────────────────────────────────
export const relSelfEsteemPool: Question[] = [
  { id: 'R1', text: '나는 좋은 연인이 될 자격이 있다고 생각한다.', dimension: 'rel_self_esteem', reverse: false },
  { id: 'R2', text: '연인이 나를 선택한 것이 좋은 선택이라고 생각한다.', dimension: 'rel_self_esteem', reverse: false },
  { id: 'R3', text: '나는 연인에게 충분히 좋은 파트너라고 느낀다.', dimension: 'rel_self_esteem', reverse: false },
  { id: 'R4', text: '관계에서 내가 짐이 되는 것 같다는 생각이 든다.', dimension: 'rel_self_esteem', reverse: true },
  { id: 'R5', text: '나는 사랑받을 자격이 있다고 생각한다.', dimension: 'rel_self_esteem', reverse: false },
  { id: 'R6', text: '좋은 관계를 만들어갈 능력이 나에게 있다고 믿는다.', dimension: 'rel_self_esteem', reverse: false },
];

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────
export function sampleQuestions<T>(pool: T[], n: number): T[] {
  return [...pool].sort(() => Math.random() - 0.5).slice(0, n);
}

/** 40문항 전체를 랜덤 섞어서 반환 */
export function buildFullQuestionSet(): Question[] {
  const all: Question[] = [
    ...anxietyPool,
    ...avoidancePool,
    ...trustPool,
    ...selfDisclosurePool,
    ...conflictPool,
    ...relSelfEsteemPool,
  ];
  return all.sort(() => Math.random() - 0.5);
}

/** 역채점 처리 후 차원별 평균 계산 */
export function calcDimensionScore(questions: Question[], answers: number[], dim: QuestionDimension): number {
  const items = questions
    .map((q, i) => ({ q, score: answers[i] ?? 4 }))
    .filter(({ q }) => q.dimension === dim);
  if (items.length === 0) return 4;
  const sum = items.reduce((acc, { q, score }) => acc + (q.reverse ? 8 - score : score), 0);
  return sum / items.length;
}

export function getAttachmentType(anxiety: number, avoidance: number): string {
  if (anxiety < 4 && avoidance < 4) return '따뜻한 안착형';
  if (anxiety >= 4 && avoidance < 4) return '소용돌이형';
  if (anxiety < 4 && avoidance >= 4) return '고독한 고지형';
  return '이중심리형';
}

export function getAttachmentAcademic(anxiety: number, avoidance: number): string {
  if (anxiety < 4 && avoidance < 4) return '안정형';
  if (anxiety >= 4 && avoidance < 4) return '집착형';
  if (anxiety < 4 && avoidance >= 4) return '거부-회피형';
  return '두려움-회피형';
}
