import { CoupleResultCard } from '@/components/couple/CoupleResultCard';
import type { SessionRow, CoupleAnalysis } from '@/types';

// ── 현실적인 샘플 데이터 ────────────────────────────────────────────────────

const MOCK_SESSION1: SessionRow = {
  id: 'preview-1',
  nickname: '지우',
  age: 27,
  gender: 'female',
  ecr_anxiety: 4.8,
  ecr_avoidance: 2.4,
  score_trust: 4.2,
  score_self_disclosure: 3.6,
  score_conflict: 3.9,
  score_rel_self_esteem: 3.5,
  attachment_type: 'anxious',
  result: { typeName: '확인이 필요한 사람' } as never,
  result_status: 'completed',
  result_error: null,
  result_detail: null,
  result_detail_status: 'idle',
  result_detail_error: null,
  consent: true,
  created_at: '2025-01-01T00:00:00Z',
  warmup_answers: [
    {
      questionId: 'w1',
      questionText: '연인이 연락이 늦을 때 나는?',
      measures: 'anxiety',
      selectedLabel: '매우 그렇다',
      selectedText: '왜 안 받지? 혹시 나한테 화난 건 아닐까 계속 신경 쓰여요',
    },
    {
      questionId: 'w2',
      questionText: '연애할 때 나는 얼마나 자주 상대에게 감정을 표현하나요?',
      measures: 'self_disclosure',
      selectedLabel: '자주 표현하는 편',
      selectedText: '자주 표현하는 편이에요. 근데 상대가 반응이 없으면 더 불안해져요',
    },
    {
      questionId: 'w3',
      questionText: '갈등이 생겼을 때 나는 주로?',
      measures: 'conflict',
      selectedLabel: '바로 해결하고 싶다',
      selectedText: '바로 해결하고 싶어서 그 자리에서 얘기하려 해요. 찝찝하게 넘어가는 게 싫어요',
    },
    {
      questionId: 'w4',
      questionText: '상대가 나에게 거리를 두는 것 같을 때?',
      measures: 'trust',
      selectedLabel: '많이 신경 쓰인다',
      selectedText: '내가 뭘 잘못한 건지 자꾸 되짚어봐요. 솔직히 말해줬으면 좋겠어요',
    },
  ],
  quiz_details: [
    { questionText: '나는 파트너가 나를 진심으로 아껴주는지 걱정된다', score: 5 },
    { questionText: '나는 파트너에게 버림받을까봐 걱정된다', score: 5 },
    { questionText: '나는 파트너가 나만큼 나를 원하지 않을까봐 걱정된다', score: 6 },
    { questionText: '나는 파트너가 나를 떠날까봐 걱정된다', score: 5 },
    { questionText: '나는 파트너가 정말로 나를 사랑하는지 걱정된다', score: 6 },
    { questionText: '나는 파트너의 관심이 줄어들까봐 불안해진다', score: 5 },
    { questionText: '나는 파트너에게 속마음을 털어놓는 것이 편하다', score: 5 },
    { questionText: '나는 파트너와 가까이 있는 것이 편하다', score: 6 },
    { questionText: '나는 파트너에게 의존하는 것이 어렵지 않다', score: 5 },
    { questionText: '나는 파트너가 나에게 너무 가까이 다가오면 불편하다', score: 2 },
    { questionText: '나는 파트너에게 나의 감정을 보여주기가 불편하다', score: 2 },
    { questionText: '나는 파트너와 가까워질수록 불편함을 느낀다', score: 2 },
    { questionText: '나는 파트너를 믿을 수 있다고 생각한다', score: 4 },
    { questionText: '나는 파트너가 나에게 솔직하다고 믿는다', score: 4 },
    { questionText: '나는 파트너가 나를 배려한다고 느낀다', score: 4 },
    { questionText: '나는 파트너의 행동을 예측할 수 있다', score: 3 },
    { questionText: '나는 파트너가 어려울 때 나를 도와줄 것이라 믿는다', score: 5 },
    { questionText: '나는 파트너가 나를 실망시키지 않을 것이라 생각한다', score: 4 },
    { questionText: '나는 파트너가 무슨 생각을 하는지 알고 싶어한다', score: 2 },
    { questionText: '나는 파트너에게 나의 하루를 이야기하는 것이 좋다', score: 3 },
    { questionText: '나는 파트너에게 나의 걱정을 털어놓는다', score: 4 },
    { questionText: '나는 파트너와 깊은 대화를 즐긴다', score: 4 },
    { questionText: '나는 파트너에게 나의 비밀을 말할 수 있다', score: 4 },
    { questionText: '나는 파트너에게 솔직하게 나를 드러낸다', score: 3 },
    { questionText: '갈등이 생기면 나는 상대의 입장을 먼저 이해하려 한다', score: 4 },
    { questionText: '나는 갈등 상황에서 타협점을 찾으려 한다', score: 4 },
    { questionText: '나는 갈등이 생기면 피하거나 넘어가려 한다', score: 3 },
    { questionText: '나는 갈등 상황에서 내 주장을 강하게 밀어붙인다', score: 3 },
    { questionText: '나는 갈등보다 관계 유지가 더 중요하다고 생각한다', score: 5 },
    { questionText: '나는 다툼 이후 빨리 화해하고 싶다', score: 6 },
    { questionText: '나는 연애 관계에서 내가 충분히 사랑받을 자격이 있다고 느낀다', score: 3 },
    { questionText: '나는 파트너가 나를 좋아하는 이유를 잘 모르겠다', score: 4 },
    { questionText: '나는 연애 관계에서 나 자신이 부족하다고 느낀 적이 있다', score: 4 },
    { questionText: '나는 파트너가 더 나은 사람을 만날 수 있다고 생각한다', score: 3 },
    { questionText: '나는 연애에서 나의 존재가 상대에게 중요하다고 느낀다', score: 3 },
    { questionText: '나는 파트너에게 내 감정을 부담 주지 않으려 한다', score: 5 },
    { questionText: '나는 파트너가 나를 진심으로 이해해준다고 느낀다', score: 3 },
    { questionText: '나는 파트너와 함께 있을 때 나 자신을 편하게 표현할 수 있다', score: 4 },
    { questionText: '나는 파트너와 오래 함께하고 싶다', score: 6 },
    { questionText: '나는 파트너가 나의 감정 변화를 잘 알아챈다고 느낀다', score: 3 },
  ],
  chat_history: [
    { role: 'assistant', content: '지우님, 연애에서 가장 마음이 힘들었던 순간이 있었나요? 어떤 상황이었는지 떠오르는 게 있으면 편하게 얘기해주세요.' },
    { role: 'user', content: '남자친구가 바빠서 연락이 뜸할 때요. 이해는 하는데... 읽씹 당하면 갑자기 내가 뭘 잘못한 건지 자꾸 생각하게 돼요. 괜히 불안해지고.' },
    { role: 'assistant', content: '읽씹 하나에 내가 잘못한 건지 되짚게 된다는 게, 그 순간 얼마나 마음이 바빴을지 느껴져요. 그 불안함이 주로 어떤 생각으로 이어지던가요?' },
    { role: 'user', content: '나를 덜 좋아하게 된 건 아닐까, 아니면 내가 뭔가 말을 잘못했나, 이런 생각들이요. 그래서 결국 제가 먼저 연락하게 되더라고요. 아 물어보기 싫은데 하면서도.' },
    { role: 'assistant', content: '"물어보기 싫은데"라는 말이 마음에 걸려요. 확인하고 싶은 마음이랑, 확인하는 내가 부담스러울 것 같다는 마음이 동시에 있는 것 같아요.' },
    { role: 'user', content: '맞아요. 너무 자주 확인하면 애가 지칠 것 같고, 그렇다고 안 하면 저 혼자 계속 신경 쓰이고. 그냥 말 안 해도 알아줬으면 좋겠다는 생각도 해요.' },
    { role: 'assistant', content: '말하지 않아도 알아줬으면 하는 마음, 연애에서 계속 그런 바람을 갖게 된 건 언제부터였을까요?' },
    { role: 'user', content: '첫 연애 때부터인 것 같아요. 그 사람이 제 감정에 별로 반응을 안 해줬거든요. 말해도 "왜 그런 거 신경 써"라는 식이라서, 표현 자체가 부담스러운 게 됐나봐요.' },
    { role: 'assistant', content: '그 경험이 지금도 영향을 주고 있군요. 그럼에도 지우님이 원하는 관계는 어떤 모습인가요?' },
    { role: 'user', content: '그냥 내가 불안하다고 말했을 때 "왜 그래"가 아니라 "그랬구나" 한 마디만 해줘도 충분할 것 같아요. 크게 바라는 게 아닌데 그게 잘 안 되더라고요.' },
    { role: 'assistant', content: '"그랬구나" 한 마디. 되게 작고 따뜻한 바람이에요. 그 말 하나가 지우님한테 얼마나 큰 안정감인지 느껴져요.' },
    { role: 'user', content: '네, 근데 그게 왜 이렇게 어렵죠. 하하.' },
  ],
};

const MOCK_SESSION2: SessionRow = {
  id: 'preview-2',
  nickname: '민준',
  age: 29,
  gender: 'male',
  ecr_anxiety: 2.6,
  ecr_avoidance: 4.5,
  score_trust: 5.1,
  score_self_disclosure: 2.8,
  score_conflict: 4.4,
  score_rel_self_esteem: 4.8,
  attachment_type: 'avoidant',
  result: { typeName: '거리를 두는 사람' } as never,
  result_status: 'completed',
  result_error: null,
  result_detail: null,
  result_detail_status: 'idle',
  result_detail_error: null,
  consent: true,
  created_at: '2025-01-01T00:00:00Z',
  warmup_answers: [
    {
      questionId: 'w1',
      questionText: '연인이 연락이 늦을 때 나는?',
      measures: 'anxiety',
      selectedLabel: '별로 신경 안 쓴다',
      selectedText: '바쁘겠지 싶어요. 딱히 신경 안 써요. 저도 답장 느린 편이라서.',
    },
    {
      questionId: 'w2',
      questionText: '연애할 때 나는 얼마나 자주 상대에게 감정을 표현하나요?',
      measures: 'self_disclosure',
      selectedLabel: '표현이 적은 편',
      selectedText: '많이 표현하는 편은 아니에요. 행동으로 보여주면 되지 않나 싶어서요',
    },
    {
      questionId: 'w3',
      questionText: '갈등이 생겼을 때 나는 주로?',
      measures: 'conflict',
      selectedLabel: '감정 가라앉은 후 얘기',
      selectedText: '감정이 좀 가라앉으면 얘기하고 싶어요. 달아오른 상태에서 얘기하면 더 커지더라고요',
    },
    {
      questionId: 'w4',
      questionText: '혼자만의 시간이 필요할 때 파트너에게?',
      measures: 'avoidance',
      selectedLabel: '말 없이 혼자 있는다',
      selectedText: '딱히 말 안 해요. 그냥 혼자 있다가 연락하는 편이에요',
    },
  ],
  quiz_details: [
    { questionText: '나는 파트너가 나를 진심으로 아껴주는지 걱정된다', score: 2 },
    { questionText: '나는 파트너에게 버림받을까봐 걱정된다', score: 2 },
    { questionText: '나는 파트너가 나만큼 나를 원하지 않을까봐 걱정된다', score: 3 },
    { questionText: '나는 파트너가 나를 떠날까봐 걱정된다', score: 2 },
    { questionText: '나는 파트너가 정말로 나를 사랑하는지 걱정된다', score: 2 },
    { questionText: '나는 파트너의 관심이 줄어들까봐 불안해진다', score: 3 },
    { questionText: '나는 파트너에게 속마음을 털어놓는 것이 편하다', score: 3 },
    { questionText: '나는 파트너와 가까이 있는 것이 편하다', score: 3 },
    { questionText: '나는 파트너에게 의존하는 것이 어렵지 않다', score: 3 },
    { questionText: '나는 파트너가 나에게 너무 가까이 다가오면 불편하다', score: 5 },
    { questionText: '나는 파트너에게 나의 감정을 보여주기가 불편하다', score: 5 },
    { questionText: '나는 파트너와 가까워질수록 불편함을 느낀다', score: 4 },
    { questionText: '나는 파트너를 믿을 수 있다고 생각한다', score: 5 },
    { questionText: '나는 파트너가 나에게 솔직하다고 믿는다', score: 5 },
    { questionText: '나는 파트너가 나를 배려한다고 느낀다', score: 5 },
    { questionText: '나는 파트너의 행동을 예측할 수 있다', score: 5 },
    { questionText: '나는 파트너가 어려울 때 나를 도와줄 것이라 믿는다', score: 6 },
    { questionText: '나는 파트너가 나를 실망시키지 않을 것이라 생각한다', score: 5 },
    { questionText: '나는 파트너가 무슨 생각을 하는지 알고 싶어한다', score: 3 },
    { questionText: '나는 파트너에게 나의 하루를 이야기하는 것이 좋다', score: 3 },
    { questionText: '나는 파트너에게 나의 걱정을 털어놓는다', score: 2 },
    { questionText: '나는 파트너와 깊은 대화를 즐긴다', score: 3 },
    { questionText: '나는 파트너에게 나의 비밀을 말할 수 있다', score: 3 },
    { questionText: '나는 파트너에게 솔직하게 나를 드러낸다', score: 2 },
    { questionText: '갈등이 생기면 나는 상대의 입장을 먼저 이해하려 한다', score: 4 },
    { questionText: '나는 갈등 상황에서 타협점을 찾으려 한다', score: 4 },
    { questionText: '나는 갈등이 생기면 피하거나 넘어가려 한다', score: 4 },
    { questionText: '나는 갈등 상황에서 내 주장을 강하게 밀어붙인다', score: 3 },
    { questionText: '나는 갈등보다 관계 유지가 더 중요하다고 생각한다', score: 4 },
    { questionText: '나는 다툼 이후 빨리 화해하고 싶다', score: 3 },
    { questionText: '나는 연애 관계에서 내가 충분히 사랑받을 자격이 있다고 느낀다', score: 5 },
    { questionText: '나는 파트너가 나를 좋아하는 이유를 잘 모르겠다', score: 2 },
    { questionText: '나는 연애 관계에서 나 자신이 부족하다고 느낀 적이 있다', score: 2 },
    { questionText: '나는 파트너가 더 나은 사람을 만날 수 있다고 생각한다', score: 2 },
    { questionText: '나는 연애에서 나의 존재가 상대에게 중요하다고 느낀다', score: 5 },
    { questionText: '나는 파트너에게 내 감정을 부담 주지 않으려 한다', score: 5 },
    { questionText: '나는 파트너가 나를 진심으로 이해해준다고 느낀다', score: 5 },
    { questionText: '나는 파트너와 함께 있을 때 나 자신을 편하게 표현할 수 있다', score: 3 },
    { questionText: '나는 파트너와 오래 함께하고 싶다', score: 5 },
    { questionText: '나는 파트너가 나의 감정 변화를 잘 알아챈다고 느낀다', score: 3 },
  ],
  chat_history: [
    { role: 'assistant', content: '민준님, 연애에서 가장 기억에 남는 순간이 있으면 얘기해주세요. 좋은 기억이든 힘든 기억이든요.' },
    { role: 'user', content: '음... 전 여자친구가 너무 자주 연락하고 확인하는 스타일이었는데, 그게 좀 버거웠어요. 혼자 있고 싶을 때도 계속 무슨 생각 하냐고 물어봐서.' },
    { role: 'assistant', content: '혼자 있고 싶은데 계속 물어봐서 버거웠다는 거, 그 상황이 민준님한테 어떤 느낌이었어요?' },
    { role: 'user', content: '숨이 좀 막히는 느낌? 나쁜 의도는 없다는 거 아는데... 나는 좀 혼자 정리할 시간이 필요하거든요. 말로 다 꺼내는 게 익숙하지 않아서요.' },
    { role: 'assistant', content: '말로 다 꺼내는 게 익숙하지 않다는 게 인상적이에요. 민준님은 감정을 주로 어떻게 처리하는 편이에요?' },
    { role: 'user', content: '그냥 혼자 생각하다 보면 정리가 돼요. 굳이 말 안 해도 나는 다 괜찮은데, 상대방은 내가 뭔가 숨기는 것 같다고 느끼는 것 같더라고요.' },
    { role: 'assistant', content: '민준님은 괜찮은데, 상대는 숨기는 것 같다고 느끼는 그 간극이 반복됐겠네요. 그런 상황이 오면 민준님은 어떻게 했어요?' },
    { role: 'user', content: '설명하려고 했는데... 설명하는 것도 에너지가 들잖아요. 그냥 좀 있으면 돌아올 텐데 왜 자꾸 확인하지, 이런 생각도 했고요.' },
    { role: 'assistant', content: '"좀 있으면 돌아올 텐데"라는 말이 와닿아요. 민준님 입장에선 잠깐 충전하고 돌아오는 건데, 상대는 그게 멀어지는 것처럼 느껴졌을 수도 있겠네요.' },
    { role: 'user', content: '그런 것 같아요. 근데 그걸 매번 설명하는 것도 관계가 피곤해지는 것 같고... 그냥 서로 이해하면 좋겠다 싶죠.' },
    { role: 'assistant', content: '그럼 민준님이 편하게 충전하면서도 상대가 안심할 수 있는 관계가 있다면 어떤 모습일 것 같아요?' },
    { role: 'user', content: '서로 각자 시간도 있고, 근데 만나면 진짜 좋은 관계? 붙어있지 않아도 신뢰가 있는 그런 거요. 말 안 해도 기다려줄 수 있는 사람이면 좋겠어요.' },
  ],
};

// ── 하드코딩 분석 (llm=0 기본값) ──────────────────────────────────────────

const MOCK_ANALYSIS: CoupleAnalysis = {
  summary:
    '지우님은 관계가 흔들릴까봐 자주 확인하고, 민준님은 가까워지면 숨이 막혀 거리를 둡니다. 한 사람이 다가올수록 다른 사람이 물러서는 추격-도피 패턴이 두 사람 사이에 반복됩니다.',
  conflictPattern:
    '지우님이 "요즘 나한테 신경 안 쓰는 것 같아"라고 말을 꺼내면, 민준님은 "왜 또 그래, 나 그냥 좀 쉬고 싶었을 뿐이야"라며 자리를 피합니다. 지우님은 더 불안해져 더 강하게 반응하고, 민준님은 더 닫힙니다.',
  eachPersonsCore: [
    { name: '지우', core: '나를 떠나지 않을 거라는 확신. 말하지 않아도 옆에 있어주는 것.' },
    { name: '민준', core: '압박 없이 자신의 페이스대로 있을 공간. 관계 안에서도 혼자만의 시간.' },
  ],
  coupleStrengths:
    '지우님의 풍부한 감수성이 민준님이 쉽게 지나치는 감정들을 붙잡아주고, 민준님의 침착함이 지우님의 감정 파도를 잠재워줄 수 있습니다.',
  communicationTips: [
    '지우님에게: 확인하고 싶은 마음이 들 때, "요즘 나 많이 신경 쓰여?" 한 마디로 먼저 물어보세요.',
    '민준님에게: 혼자 있고 싶을 때 "오늘 좀 충전이 필요해, 내일 연락할게" 한 문장이면 충분해요.',
    '두 사람 함께: 싸움이 시작될 것 같을 때 "우리 30분만 쉬었다 얘기하자"는 규칙을 미리 만들어두세요.',
  ],
  crisisScript: '나 지금 네가 필요한 게 아니라, 네가 괜찮은지 알고 싶어.',
  compatibilityNote: '가장 다른 두 사람이 가장 깊이 배울 수 있는 조합.',
  axisGaps: [
    {
      axis: '안정감',
      gap: '지우님(35)이 민준님(77)보다 낮아요. 지우님이 불안을 행동으로 표현할수록 민준님은 오히려 더 닫히는 악순환이 생길 수 있어요.',
    },
    {
      axis: '속마음표현력',
      gap: '지우님(43)이 민준님(26)보다 높아요. 민준님이 속마음을 잘 꺼내지 않아 지우님 입장에선 알 수 없어 답답하게 느껴집니다.',
    },
  ],
  growthEdge:
    '이번 주 각자 "내가 관계에서 힘들었던 순간 한 가지"를 메모해두고, 주말에 밥 먹으면서 한 가지씩 꺼내보세요.',
  coreFearsCollision:
    '지우님의 "결국 혼자 남겨질 것 같다"는 두려움이 확인 행동으로 표출될 때, 민준님의 "옭아매질 것 같다"는 두려움이 자극되어 더 멀어지는 악순환이 반복됩니다.',
  redFlags: [
    '지우님이 연속으로 확인 메시지를 보낼 때 민준님이 읽씹으로 응답하면, 두 사람 모두 자신의 두려움 모드로 진입한 신호예요.',
    '민준님이 "나는 원래 이래"라고 말하며 변화 가능성을 닫기 시작하면 관계의 성장 동력이 멈추는 시점일 수 있어요.',
    '싸운 뒤 둘 다 먼저 말 걸기를 기다리는 침묵이 3일 이상 지속되면 감정이 굳기 전에 작은 신호라도 먼저 보내세요.',
  ],
};

// ── 페이지 ─────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ llm?: string }>;
}

export default async function CouplePreviewPage({ searchParams }: PageProps) {
  const { llm } = await searchParams;
  const useLLM = llm === '1';

  let analysis = MOCK_ANALYSIS;
  let llmError: string | null = null;

  if (useLLM) {
    try {
      const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/couple/preview-analyze`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ session1: MOCK_SESSION1, session2: MOCK_SESSION2 }),
        cache: 'no-store',
      });
      if (res.ok) {
        analysis = await res.json() as CoupleAnalysis;
      } else {
        const err = await res.json() as { error?: string };
        llmError = err.error ?? 'LLM 분석 실패';
      }
    } catch (e) {
      llmError = e instanceof Error ? e.message : 'LLM 분석 실패';
    }
  }

  return (
    <div className="min-h-[100dvh] px-4 py-12" style={{ backgroundColor: '#f7f9fb' }}>
      <div className="max-w-lg mx-auto">
        <div className="mb-6 rounded-2xl px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: useLLM ? '#dbeafe' : '#fef9c3' }}>
          <span className="text-xs font-semibold" style={{ color: useLLM ? '#1e40af' : '#92400e' }}>
            {useLLM ? '🤖 LLM 생성 결과' : '📋 하드코딩 예시 데이터'}
          </span>
          <a
            href={useLLM ? '/couple/preview' : '/couple/preview?llm=1'}
            className="text-xs font-semibold underline"
            style={{ color: useLLM ? '#1e40af' : '#92400e' }}
          >
            {useLLM ? '예시 데이터로 보기' : 'LLM으로 생성하기'}
          </a>
        </div>

        {llmError && (
          <div className="mb-4 rounded-2xl px-4 py-3 text-xs" style={{ backgroundColor: '#ffdad5', color: '#ba1a1a' }}>
            오류: {llmError}
          </div>
        )}

        <CoupleResultCard
          coupleId="preview"
          session1={MOCK_SESSION1}
          session2={MOCK_SESSION2}
          analysis={analysis}
        />
      </div>
    </div>
  );
}
