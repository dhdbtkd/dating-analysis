// 두 사람의 ECR 불안·회피 점수 기반 커플 조합 유형 분류
// 기준: 점수 4.0 기준으로 고/저 분류 (1~7 척도, 중간값 4)

export interface CoupleTypeResult {
  name: string;
  description: string;
  dynamic: string; // 핵심 역학 한 줄
}

type AttachmentClass = 'secure' | 'anxious' | 'avoidant' | 'fearful';

function classify(anxiety: number, avoidance: number): AttachmentClass {
  const highAnxiety = anxiety >= 4.0;
  const highAvoidance = avoidance >= 4.0;
  if (!highAnxiety && !highAvoidance) return 'secure';
  if (highAnxiety && !highAvoidance) return 'anxious';
  if (!highAnxiety && highAvoidance) return 'avoidant';
  return 'fearful';
}

const COMBO_MAP: Record<string, CoupleTypeResult> = {
  'secure-secure': {
    name: '안전기지형',
    description: '두 사람 모두 서로에게 든든한 안전기지가 되어줄 수 있는 조합이에요. 갈등이 생겨도 대화로 풀어가는 힘이 있고, 함께 있을수록 더 단단해지는 관계를 만들어갈 수 있어요. 다만 안정감이 당연하게 느껴질수록 서로를 향한 표현이 줄어들 수 있으니, 작은 감사와 애정 표현을 꾸준히 이어가는 게 좋아요.',
    dynamic: '서로가 서로의 가장 안전한 사람',
  },
  'secure-anxious': {
    name: '든든함-온기형',
    description: '한 사람의 안정감이 다른 사람의 풍부한 감수성을 따뜻하게 감싸주는 조합이에요. 감정을 잘 표현하는 쪽 덕분에 관계에 생기가 돌고, 안정된 쪽 덕분에 큰 파도에도 흔들리지 않아요. 서로의 다름이 오히려 균형을 만들어줘요. 단, 한쪽이 안아주는 역할을 오래 혼자 맡지 않도록 서로 역할을 나눠가며 표현해주세요.',
    dynamic: '감수성과 안정감이 서로를 채워주는 조합',
  },
  'anxious-secure': {
    name: '든든함-온기형',
    description: '한 사람의 안정감이 다른 사람의 풍부한 감수성을 따뜻하게 감싸주는 조합이에요. 감정을 잘 표현하는 쪽 덕분에 관계에 생기가 돌고, 안정된 쪽 덕분에 큰 파도에도 흔들리지 않아요. 서로의 다름이 오히려 균형을 만들어줘요. 단, 한쪽이 안아주는 역할을 오래 혼자 맡지 않도록 서로 역할을 나눠가며 표현해주세요.',
    dynamic: '감수성과 안정감이 서로를 채워주는 조합',
  },
  'secure-avoidant': {
    name: '인내-성장형',
    description: '한 사람의 꾸준한 존재감이 다른 사람이 스스로 마음을 열 수 있는 환경을 만들어줘요. 천천히 쌓이는 신뢰 위에서 회피형도 자신만의 속도로 가까워질 수 있어요. 압박 없이 기다려주는 것 자체가 이 관계의 강점이에요. 다만 기다리는 쪽도 자신의 감정을 솔직하게 표현해야 오래 지속될 수 있어요.',
    dynamic: '압박 없는 신뢰가 마음을 여는 조합',
  },
  'avoidant-secure': {
    name: '인내-성장형',
    description: '한 사람의 꾸준한 존재감이 다른 사람이 스스로 마음을 열 수 있는 환경을 만들어줘요. 천천히 쌓이는 신뢰 위에서 회피형도 자신만의 속도로 가까워질 수 있어요. 압박 없이 기다려주는 것 자체가 이 관계의 강점이에요. 다만 기다리는 쪽도 자신의 감정을 솔직하게 표현해야 오래 지속될 수 있어요.',
    dynamic: '압박 없는 신뢰가 마음을 여는 조합',
  },
  'anxious-avoidant': {
    name: '끌림-긴장형',
    description: '서로 다른 두 사람이 강하게 끌리는 조합이에요. 한 사람의 뜨거운 감정 표현이 다른 사람에게 특별한 존재감을 느끼게 하고, 다른 사람의 차분한 독립성이 오히려 더 매력적으로 느껴지기도 해요. 서로가 상대에게서 자신에게 없는 것을 보는 관계예요. 다만 패턴을 인식하지 못하면 다가갈수록 멀어지는 순환이 생길 수 있어서, 두 사람만의 소통 방식을 함께 만들어가는 게 중요해요.',
    dynamic: '서로의 다름이 끌림이 되는 조합',
  },
  'avoidant-anxious': {
    name: '끌림-긴장형',
    description: '서로 다른 두 사람이 강하게 끌리는 조합이에요. 한 사람의 뜨거운 감정 표현이 다른 사람에게 특별한 존재감을 느끼게 하고, 다른 사람의 차분한 독립성이 오히려 더 매력적으로 느껴지기도 해요. 서로가 상대에게서 자신에게 없는 것을 보는 관계예요. 다만 패턴을 인식하지 못하면 다가갈수록 멀어지는 순환이 생길 수 있어서, 두 사람만의 소통 방식을 함께 만들어가는 게 중요해요.',
    dynamic: '서로의 다름이 끌림이 되는 조합',
  },
  'anxious-anxious': {
    name: '깊은 공감형',
    description: '두 사람 모두 감정이 풍부하고 관계에 진심이에요. 서로의 마음을 누구보다 잘 이해하고, 상대가 힘들 때 직관적으로 알아채는 강점이 있어요. 함께할수록 깊은 정서적 유대를 쌓아갈 수 있는 조합이에요. 다만 두 사람 모두 예민해지는 순간이 겹치면 감정이 서로를 자극할 수 있으니, "지금 나 좀 힘들어"라고 먼저 말하는 습관이 큰 도움이 돼요.',
    dynamic: '누구보다 서로를 깊이 이해하는 조합',
  },
  'avoidant-avoidant': {
    name: '독립-존중형',
    description: '두 사람 모두 각자의 공간과 자율성을 중요하게 여겨요. 서로를 압박하지 않고 존중하는 분위기 속에서 갈등이 적고 편안한 관계를 유지할 수 있어요. 함께 있어도 숨이 막히지 않는다는 게 이 조합의 큰 장점이에요. 다만 두 사람 모두 먼저 속마음을 꺼내지 않는 편이라, 의도적으로 감정을 나누는 시간을 만들어주면 더욱 깊어질 수 있어요.',
    dynamic: '서로의 공간을 지켜주는 편안한 조합',
  },
  'fearful-fearful': {
    name: '깊은 이해형',
    description: '두 사람 모두 관계에서 가까워지고 싶은 마음과 두려움을 동시에 갖고 있어요. 그렇기에 상대의 복잡한 감정을 누구보다 깊이 이해할 수 있는 조합이에요. 서로의 상처에 공감하며 함께 천천히 신뢰를 쌓아가는 과정이 이 관계만의 특별한 여정이에요. 두 사람이 함께 안전한 관계를 만들어가는 연습을 할 수 있어요.',
    dynamic: '서로의 복잡한 마음을 가장 잘 아는 조합',
  },
  'fearful-secure': {
    name: '치유-성장형',
    description: '한 사람의 안정적인 존재감이 다른 사람에게 관계가 안전할 수 있다는 새로운 경험을 선물해줘요. 과거의 상처가 있어도 이 관계 안에서 조금씩 회복되는 느낌을 받을 수 있어요. 함께하는 시간이 쌓일수록 두 사람 모두 성장하는 조합이에요. 안정형도 상대의 속도를 존중하며 기다려주는 여유가 관계를 더 깊게 만들어줘요.',
    dynamic: '관계 안에서 함께 성장하고 치유하는 조합',
  },
  'secure-fearful': {
    name: '치유-성장형',
    description: '한 사람의 안정적인 존재감이 다른 사람에게 관계가 안전할 수 있다는 새로운 경험을 선물해줘요. 과거의 상처가 있어도 이 관계 안에서 조금씩 회복되는 느낌을 받을 수 있어요. 함께하는 시간이 쌓일수록 두 사람 모두 성장하는 조합이에요. 안정형도 상대의 속도를 존중하며 기다려주는 여유가 관계를 더 깊게 만들어줘요.',
    dynamic: '관계 안에서 함께 성장하고 치유하는 조합',
  },
};

function fallback(c1: AttachmentClass, c2: AttachmentClass): CoupleTypeResult {
  return {
    name: '특별한 조합',
    description: '두 사람만의 고유한 패턴을 가진 조합이에요. 서로의 다름을 이해하고 받아들이는 과정에서 이 관계만의 특별한 강점이 만들어져요.',
    dynamic: '서로에게서 배우며 함께 성장하는 조합',
  };
}

export function getCoupleType(
  anxiety1: number, avoidance1: number,
  anxiety2: number, avoidance2: number,
): CoupleTypeResult {
  const c1 = classify(anxiety1, avoidance1);
  const c2 = classify(anxiety2, avoidance2);
  const key = `${c1}-${c2}`;
  return COMBO_MAP[key] ?? fallback(c1, c2);
}

export interface AxisGapRow {
  label: string;
  score1: number;
  score2: number;
  gap: number; // 절댓값
}

function toPercent(score: number): number {
  return Math.round(((score - 1) / 6) * 100);
}

export function calcAxisGaps(
  s1: { nickname: string; ecr_anxiety: number; ecr_avoidance: number; score_trust: number | null; score_self_disclosure: number | null; score_conflict: number | null; score_rel_self_esteem: number | null },
  s2: { nickname: string; ecr_anxiety: number; ecr_avoidance: number; score_trust: number | null; score_self_disclosure: number | null; score_conflict: number | null; score_rel_self_esteem: number | null },
): AxisGapRow[] {
  const axes = [
    { label: '안정감',      v1: toPercent(8 - s1.ecr_anxiety),            v2: toPercent(8 - s2.ecr_anxiety) },
    { label: '친밀감',      v1: toPercent(8 - s1.ecr_avoidance),          v2: toPercent(8 - s2.ecr_avoidance) },
    { label: '신뢰',        v1: toPercent(s1.score_trust ?? 4),           v2: toPercent(s2.score_trust ?? 4) },
    { label: '속마음표현력', v1: toPercent(s1.score_self_disclosure ?? 4), v2: toPercent(s2.score_self_disclosure ?? 4) },
    { label: '갈등해결력',   v1: toPercent(s1.score_conflict ?? 4),        v2: toPercent(s2.score_conflict ?? 4) },
    { label: '관계자존감',   v1: toPercent(s1.score_rel_self_esteem ?? 4), v2: toPercent(s2.score_rel_self_esteem ?? 4) },
  ];
  return axes
    .map(({ label, v1, v2 }) => ({ label, score1: v1, score2: v2, gap: Math.abs(v1 - v2) }))
    .sort((a, b) => b.gap - a.gap);
}
