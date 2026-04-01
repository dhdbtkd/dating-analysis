import type { WarmupQuestion, Question } from '@/types';

export const warmupPool: WarmupQuestion[] = [
  {
    id: 'W1',
    text: '연인이 카톡을 2시간째 읽씹하고 있다. 나의 반응은?',
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
    options: [
      { label: 'A', text: '평소 페이스대로, 억지로 늘리지 않는다' },
      { label: 'B', text: '자꾸 생각나서 먼저 연락하게 된다' },
      { label: 'C', text: '상대가 연락할 때만 답한다' },
      { label: 'D', text: '적당히 주고받는 균형을 찾는다' },
    ],
  },
  {
    id: 'W4',
    text: '싸운 뒤 화해 방식은?',
    options: [
      { label: 'A', text: '감정이 가라앉으면 자연스럽게 대화한다' },
      { label: 'B', text: '먼저 사과하고 빨리 풀고 싶다' },
      { label: 'C', text: '혼자 냉각기가 필요하고, 먼저 다가가기 힘들다' },
      { label: 'D', text: '원인을 분석해서 논리적으로 해결한다' },
    ],
  },
  {
    id: 'W5',
    text: '연인이 나를 두고 친구들과만 여행을 간다면?',
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
    options: [
      { label: 'A', text: '시간이 지나면서 자연스럽게 회복된다' },
      { label: 'B', text: '오래 그리워하며 SNS를 반복해서 본다' },
      { label: 'C', text: '빠르게 일상으로 복귀, 감정을 잘 드러내지 않는다' },
      { label: 'D', text: '원인을 분석하며 다음엔 다르게 하겠다고 다짐한다' },
    ],
  },
];

export const anxietyPool: Question[] = [
  { id: 'A1', text: '나는 연인에게 버림받을까 봐 걱정된다.', dimension: 'anxiety', reverse: false },
  { id: 'A2', text: '연인이 나를 사랑하지 않게 될까 봐 두렵다.', dimension: 'anxiety', reverse: false },
  { id: 'A3', text: '연인과 가까워지고 싶지만, 상대가 나만큼 원하지 않을까 봐 불안하다.', dimension: 'anxiety', reverse: false },
  { id: 'A4', text: '나는 연인에게 내가 중요한 사람인지 자주 확인받고 싶다.', dimension: 'anxiety', reverse: false },
  { id: 'A5', text: '연인이 나를 정말 소중히 여기는지 확신이 없다.', dimension: 'anxiety', reverse: false },
  { id: 'A6', text: '연인이 나를 떠날까 봐 때때로 걱정된다.', dimension: 'anxiety', reverse: false },
  { id: 'A7', text: '나는 연인을 잃을까 봐 별로 걱정하지 않는다.', dimension: 'anxiety', reverse: true },
  { id: 'A8', text: '연인과 헤어질지도 모른다는 생각이 거의 들지 않는다.', dimension: 'anxiety', reverse: true },
];

export const avoidancePool: Question[] = [
  { id: 'V1', text: '나는 연인에게 내 감정을 드러내는 것이 불편하다.', dimension: 'avoidance', reverse: false },
  { id: 'V2', text: '나는 연인에게 완전히 의지하는 것이 어렵다.', dimension: 'avoidance', reverse: false },
  { id: 'V3', text: '나는 연인과 너무 가까워지는 것이 부담스럽다.', dimension: 'avoidance', reverse: false },
  { id: 'V4', text: '나는 연인에게 속마음을 털어놓기가 쉽지 않다.', dimension: 'avoidance', reverse: false },
  { id: 'V5', text: '친밀한 관계를 맺는 것이 편안하다.', dimension: 'avoidance', reverse: true },
  { id: 'V6', text: '연인에게 의지하는 것이 편안하게 느껴진다.', dimension: 'avoidance', reverse: true },
  { id: 'V7', text: '나는 연인과 가까워지는 것을 즐긴다.', dimension: 'avoidance', reverse: true },
  { id: 'V8', text: '나는 연인이 나에게 의지하는 것이 불편하다.', dimension: 'avoidance', reverse: false },
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

export const famousCoordinates = [
  { name: '오바마', anxiety: 2.0, avoidance: 2.0 },
  { name: '미셸 오바마', anxiety: 2.2, avoidance: 2.3 },
  { name: '헤르미온느', anxiety: 2.8, avoidance: 2.5 },
  { name: '엘리자베스 베넷', anxiety: 2.5, avoidance: 2.8 },
  { name: '비욘세', anxiety: 2.0, avoidance: 2.1 },
  { name: '로미오', anxiety: 6.2, avoidance: 1.8 },
  { name: '미스터 빅', anxiety: 5.5, avoidance: 5.0 },
  { name: '아나스타샤', anxiety: 5.8, avoidance: 1.5 },
  { name: '닥터 하우스', anxiety: 2.5, avoidance: 6.0 },
  { name: '사만다(Her)', anxiety: 1.8, avoidance: 6.5 },
  { name: '캐리 브래드쇼', anxiety: 5.2, avoidance: 4.8 },
  { name: '히스클리프', anxiety: 6.5, avoidance: 1.2 },
  { name: '셜록 홈즈', anxiety: 1.2, avoidance: 6.8 },
  { name: '조이 트리비아니', anxiety: 2.3, avoidance: 2.0 },
  { name: '클레어 언더우드', anxiety: 2.0, avoidance: 6.2 },
];
