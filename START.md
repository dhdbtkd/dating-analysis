# 연애 유형 심층 분석 앱 — 실행 방법

## 프로젝트 구조

```
love-harness/
├── CLAUDE.md                      ← 오케스트레이터 (Claude Code가 자동으로 읽음)
├── agents/
│   ├── evaluation_criteria.md     ← 공용 평가 기준
│   ├── planner.md                 ← Planner 지시서 (연애 유형 앱 특화)
│   ├── generator.md               ← Generator 지시서 (ECR + Claude API 연동)
│   └── evaluator.md               ← Evaluator 지시서 (연애 유형 앱 특화)
├── output/                        ← 생성 결과물 저장 폴더
├── SPEC.md                        ← Planner가 생성
├── SELF_CHECK.md                  ← Generator가 생성
├── QA_REPORT.md                   ← Evaluator가 생성
└── START.md                       ← 지금 이 파일
```

---

## 실행 방법

### 1단계: 이 폴더에서 Claude Code를 실행합니다

```bash
cd love-harness
claude
```

### 2단계: 프롬프트를 입력합니다

```
연애 유형 심층 분석 웹앱을 만들어줘
```

자동으로:
1. Planner가 SPEC.md를 생성합니다
2. Generator가 output/index.html을 생성합니다
3. Evaluator가 QA_REPORT.md로 검수합니다
4. 불합격이면 Generator가 피드백 반영 후 재작업합니다
5. 합격이면 완료 보고가 나옵니다

### 3단계: 결과를 확인합니다

```bash
open output/index.html
```

---

## 이 앱이 만드는 것

**"당신도 몰랐던 나의 연애 패턴"**

UX 흐름:
1. **인트로** — 논문 출처 배지 + 예상 시간 (총 10분)
2. **워밍업** — 상황 기반 객관식 3문항 (풀 10개 중 랜덤)
3. **ECR 측정** — 12문항 (불안/회피 풀 각 8개 중 6개 랜덤)
4. **Claude 심층 대화** — 6턴, ECR 결과를 컨텍스트로 "왜"를 탐색
5. **로딩** — 분석 중 메시지
6. **결과 카드**:
   - 유형명 + 2축 산포도 (유명인/캐릭터 비교)
   - 연애 패턴 / 강점 / 성장 포인트
   - ⚠️ 주의 상황 2개
   - 💡 행동 제안 3개
   - 🧠 마인드셋 질문
   - 💬 대화에서 발견된 나 (인용구) ← 저격 포인트
7. **공유** — 결과 텍스트 복사 + 상대방 초대 링크

---

## 학술 기반

- **Brennan, Clark & Shaver (1998)** — ECR(Experiences in Close Relationships) 척도
  - 불안(Anxiety) × 회피(Avoidance) 2차원 측정
- **Bartholomew & Horowitz (1991)** — 4유형 애착 모델
  - 안정형 / 집착형 / 거부-회피형 / 두려움-회피형
- **Wei et al. (2007)** — ECR-S 12문항 단축형
  - 신뢰도: 불안 α=.91, 회피 α=.94

---

## 프롬프트 변형 예시

```
연애 유형 심층 분석 앱을 만들어줘. 커플이 함께 하는 버전으로.
```

```
연애 유형 심층 분석 앱을 만들어줘. 더 밝고 따뜻한 톤으로.
```

```
연애 유형 심층 분석 앱을 만들어줘. MZ세대 감성 + 밈 요소 포함해서.
```

agents/ 수정 없이 프롬프트만 바꾸면 됩니다.
디자인 기준을 바꾸려면 agents/evaluation_criteria.md만 수정하세요.

---

## 소비 심리 검사 앱과의 차이점

| | 연애 유형 앱 | 소비 심리 앱 |
|---|---|---|
| 측정 이론 | ECR (Brennan et al., 1998) | KMSI (Klontz et al., 2011) |
| 차원 수 | 2축 (불안 × 회피) | 2축 (불안 × 욕망) |
| 분위기 | 다크 / 밤 감성 | 따뜻한 오프화이트 |
| 폰트 | Gowun Batang + Noto Sans KR | Nanum Myeongjo + Pretendard |
| 차트 | 2축 산포도 (단일) | 2축 매트릭스 + 레이더 탭 |
| 바이럴 훅 | 궁합 초대 링크 | 공유 카드 |
