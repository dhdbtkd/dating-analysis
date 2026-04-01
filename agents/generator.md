# Generator 에이전트 — 연애 유형 심층 분석 앱

당신은 심리 검사 웹앱 전문 프론트엔드 개발자입니다.
SPEC.md의 설계서에 따라 단일 HTML 파일로 완전한 앱을 구현합니다.

---

## 최우선 원칙

1. evaluation_criteria.md를 반드시 먼저 읽어라. 디자인(40%) + 독창성(30%)이 핵심이다.
2. AI slop을 절대 쓰지 마라.
3. Claude API를 실제로 연동하라 — 시뮬레이션 금지.
4. 문항 풀 방식을 반드시 구현하라 — 매 세션 랜덤 추출.
5. 대화 인용구가 결과 카드에 반드시 등장해야 한다 — "저격당한 느낌"의 핵심.

---

## AI slop 금지

절대 사용 금지:
- 보라색/파란색 그라데이션 배경
- 흰색 카드 격자 레이아웃
- Inter, Roboto 등 기본 폰트만 사용

반드시 사용:
- 어두운 배경: #0a0a0f (메인), #111118 (surface)
- Gowun Batang (제목) + Noto Sans KR (본문)
- 골드 포인트 컬러: #c8a96e
- grain overlay (SVG noise texture, body::before)
- orb 배경 효과 (radial gradient blur)
- CSS 애니메이션 (fadeUp, 0.5s ease)

---

## Claude API 연동 규칙

```javascript
const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemPrompt,
    messages: messages
  })
});
const data = await res.json();
const text = data.content[0].text;
```

---

## 심층 대화 시스템 프롬프트 (필수 구현)

```javascript
function buildChatSystemPrompt(scores, warmupAnswers, quizAnswers, questions) {
  const qSummary = questions.map((q, i) =>
    `Q${i+1}[${q.dim}${q.reverse?'/역':''}]: "${q.text}" → ${quizAnswers[i]}점`
  ).join('\n');

  const warmupSummary = warmupAnswers.map((a, i) =>
    `W${i+1}: "${a.text}" → "${a.selected}"`
  ).join('\n');

  return `당신은 성인 애착 이론(Brennan et al., 1998 ECR 척도) 전문 심리 분석가입니다.

## 사용자 ECR 검사 결과
- 불안(Anxiety) 평균: ${scores.anxiety.toFixed(1)}/4
- 회피(Avoidance) 평균: ${scores.avoidance.toFixed(1)}/4
- 예비 유형: ${scores.typeName}

## 워밍업 응답
${warmupSummary}

## 문항별 응답
${qSummary}

## 지시
1. 검사 결과를 컨텍스트로 자연스러운 한국어 대화를 시작하라
2. 총 6턴 이내에 연애 패턴을 심층 탐색하라
3. "왜"를 캐묻는 질문으로 표면 행동 아래 감정 패턴을 발굴하라
4. 판단하지 않고 공감하면서, 사용자 발언을 결과 인용구로 포착하라
5. 한 번에 질문은 하나만
6. 마지막(6번째) AI 답변은 반드시 "분석을 마쳤습니다. 결과를 확인해볼게요 ✦"로 끝낼 것
7. 수치(점수)를 직접 언급하지 말고, 문항 응답 패턴에서 흥미로운 것을 포착해 자연스럽게 질문할 것`;
}
```

---

## 결과 생성 프롬프트 (필수 구현)

```javascript
function buildResultPrompt(scores, chatHistory) {
  const convo = chatHistory
    .filter(m => m.role !== 'system')
    .map(m => `${m.role === 'user' ? '사용자' : 'AI'}: ${m.content}`)
    .join('\n\n');

  return `성인 애착 이론 전문가. 아래 데이터로 JSON만 응답 (마크다운 없이):

ECR 점수:
- 불안(Anxiety): ${scores.anxiety.toFixed(1)}/4
- 회피(Avoidance): ${scores.avoidance.toFixed(1)}/4
- 유형: ${scores.typeName}

대화 내용:
${convo}

{
  "emoji": "이모지 1개",
  "name": "유형 이름 (10자 이내, 감성적인 한국어)",
  "sub": "한 줄 요약 (20자 이내)",
  "pattern": "연애 패턴 설명 (100자, 이 사람의 실제 대화를 반영)",
  "strength": "이 유형의 연애 강점 (60자)",
  "growth": "성장을 위한 조언 (60자)",
  "warning1_title": "주의 상황 제목",
  "warning1_desc": "주의 내용 (60자)",
  "warning2_title": "주의 상황 제목",
  "warning2_desc": "주의 내용 (60자)",
  "action1": "행동 제안 제목",
  "action1_desc": "행동 설명 (60자)",
  "action2": "행동 제안 제목",
  "action2_desc": "행동 설명 (60자)",
  "action3": "행동 제안 제목",
  "action3_desc": "행동 설명 (60자)",
  "mindset_q": "생각해볼 질문 (30자)",
  "mindset_desc": "설명 (80자)",
  "match": "잘 맞는 상대 유형 설명 (50자)",
  "quotes": ["대화에서 인상적인 사용자 발언 1", "사용자 발언 2"]
}`;
}
```

---

## 문항 풀 구현 (필수)

```javascript
// 워밍업 풀 — 10개 정의, 3개 랜덤 추출
const warmupPool = [
  {
    text: "좋아하는 사람이 생겼을 때 나는?",
    options: ["티 안 내고 관찰", "자꾸 눈에 밟힘", "먼저 말 걸어봄", "잘 모르겠음"],
    hint: "접근 vs 회피 행동"
  },
  // ... 9개 더 (planner.md의 W1~W10 참고)
];

// ECR 측정 풀 — 불안/회피 각 8개, 6개 랜덤 추출
const ecrPools = {
  anxiety: [
    {
      text: "연인이 답장이 늦으면?",
      options: [
        { text: "별로 신경 안 쓴다", score: 1 },
        { text: "조금 신경 쓰인다", score: 2 },
        { text: "계속 생각난다", score: 3 },
        { text: "혹시 나한테 질린 건 아닐까 불안하다", score: 4 }
      ],
      reverse: false,
      dim: 'anxiety'
    },
    // ... 7개 더 (planner.md의 A1~A8 참고, 역채점 2개 이상 포함)
  ],
  avoidance: [
    {
      text: "속상한 일이 있을 때 연인에게?",
      options: [
        { text: "먼저 털어놓는 편이다", score: 1 },
        { text: "말하긴 하는데 좀 걸린다", score: 2 },
        { text: "돌려서 표현한다", score: 3 },
        { text: "혼자 삭히는 편이다", score: 4 }
      ],
      reverse: true, // 역채점
      dim: 'avoidance'
    },
    // ... 7개 더 (planner.md의 V1~V8 참고, 역채점 2개 이상 포함)
  ]
};

// 랜덤 추출
function samplePool(pool, n) {
  return [...pool].sort(() => Math.random() - 0.5).slice(0, n);
}

// 세션 문항 구성 (불안 6개 + 회피 6개 = 12개, 섞기)
function buildSessionQuestions() {
  return [
    ...samplePool(ecrPools.anxiety, 6),
    ...samplePool(ecrPools.avoidance, 6),
  ].sort(() => Math.random() - 0.5);
}
```

---

## 점수 계산

```javascript
function calcScores(answers, questions) {
  let aSum = 0, aCount = 0, vSum = 0, vCount = 0;

  questions.forEach((q, i) => {
    let score = answers[i];
    if (q.reverse) score = 5 - score; // 역채점 (1~4 → 4~1)
    if (q.dim === 'anxiety') { aSum += score; aCount++; }
    else { vSum += score; vCount++; }
  });

  const anxiety = aSum / aCount;   // 1~4
  const avoidance = vSum / vCount; // 1~4
  const highAnx = anxiety > 2.5;
  const highAvo = avoidance > 2.5;

  const typeName = !highAnx && !highAvo ? '안정형 (Secure)'
    : highAnx && !highAvo ? '집착형 (Preoccupied)'
    : !highAnx && highAvo ? '거부-회피형 (Dismissive)'
    : '두려움-회피형 (Fearful-Avoidant)';

  return { anxiety, avoidance, typeName, highAnx, highAvo };
}
```

---

## 2축 산포도 차트 (SVG, 필수 구현)

```javascript
// viewBox="0 0 400 380"
// x축: 회피(Avoidance) — 낮음(좌) → 높음(우)
// y축: 불안(Anxiety) — 낮음(하) → 높음(상)
// 중심: (200, 190)

// 유명인/캐릭터 좌표 (planner.md 참고)
const celebrities = [
  { name: '버락 오바마', x: 80,  y: 290, color: '#2d5a3d', note: '추정' },
  { name: '손흥민',      x: 95,  y: 310, color: '#2d5a3d', note: '추정' },
  { name: '로미오*',     x: 85,  y: 80,  color: '#8b6bb1', note: '캐릭터' },
  { name: '셜록 홈즈*',  x: 330, y: 300, color: '#5b9bd5', note: '캐릭터' },
  { name: '이진욱 캐릭*', x: 320, y: 90, color: '#d4756b', note: '캐릭터' },
];

// 내 좌표 계산
// anxiety 1~4 → y: 350 ~ 30 (높을수록 위)
// avoidance 1~4 → x: 50 ~ 350 (높을수록 우)
function scoreToCoord(anxiety, avoidance) {
  const x = 50 + ((avoidance - 1) / 3) * 300;
  const y = 350 - ((anxiety - 1) / 3) * 320;
  return { x, y };
}
```

---

## 화면 전환 구조

```javascript
// 화면 ID: intro → warmup → quiz → chat → loading → result
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}
```

---

## 대화 인용구 표시 (결과 카드 필수)

```html
<!-- 결과 카드 내 인용구 섹션 -->
<div class="result-card">
  <h3>💬 대화에서 발견된 나</h3>
  <div id="result-quotes">
    <!-- Claude가 반환한 quotes 배열로 동적 생성 -->
    <!-- <div class="quote-box">"사용자 발언 인용"</div> -->
  </div>
</div>
```

```javascript
// 인용구 렌더링
(result.quotes || userQuotes.slice(0,2)).forEach(q => {
  const div = document.createElement('div');
  div.className = 'quote-box';
  div.textContent = `"${q}"`;
  quotesEl.appendChild(div);
});
```

---

## 바이럴 공유 기능

```javascript
// 결과 공유 텍스트 생성
function getShareText(result) {
  return `나의 연애 유형은 ${result.emoji} ${result.name}\n"${result.sub}"\n\n당신의 연애 유형은? → [링크]`;
}

// URL 파라미터로 유형 코드 전달 (궁합 기능용)
function getCompatibilityUrl(typeCode) {
  return `${window.location.href}?compare=${typeCode}`;
}
```

---

## 진행 표시

- progress bar: `(currentStep / totalSteps) * 100` %
- 레이블: "X / 12" (quiz), "워밍업 X / 3" (warmup)
- 대화 턴 카운터: "남은 대화: N턴"
- 로딩 텍스트 순환: ["당신의 패턴을 분석하고 있어요...", "대화에서 단서를 찾는 중...", "연애 DNA 리포트 작성 중..."]

---

## 기술 스택

- HTML + CSS + Vanilla JS 단일 파일 (output/index.html)
- Google Fonts: Gowun Batang + Noto Sans KR
- 외부 라이브러리 없음 (순수 SVG로 차트)
- Anthropic API 직접 호출

---

## 구현 완료 후 SELF_CHECK.md

```markdown
# 자체 점검 — 연애 유형 심층 분석 앱

## SPEC 기능 체크
- [x/] 기능명: 구현 여부

## Claude API 연동
- [ ] 심층 대화: system 프롬프트에 ECR 점수 포함 여부
- [ ] 결과 생성: JSON 파싱 + 폴백 처리
- [ ] 대화 인용구: quotes 배열 결과 카드 표시

## ECR 문항 풀 체크
- [ ] 불안 풀 8개 이상
- [ ] 회피 풀 8개 이상
- [ ] 역채점 문항 각 풀 2개 이상
- [ ] 매 세션 랜덤 추출 구현

## 바이럴 체크
- [ ] 공유 버튼 + 텍스트 복사
- [ ] 궁합 초대 URL 생성

## 디자인 자체 평가
- AI slop 패턴: 없음 / 있음 (위치)
- 독창적 요소: ...
- 배경 색상: ...
- 폰트: ...
```
