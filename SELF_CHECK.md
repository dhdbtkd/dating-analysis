# 자체 점검 — 연애 유형 심층 분석 앱

## SPEC 기능 체크
- [x] 기능 1 — 인트로 화면: 서비스명, 한 줄 설명, 논문 출처 배지 3개, 예상 소요시간, LLM 선택 + API 키 UI, CTA 버튼
- [x] 기능 2 — 워밍업 문항 (10개 풀 중 3개 랜덤): 4지선다, 진행 바
- [x] 기능 3 — ECR-S 측정 (불안 8개 풀 중 6개 + 회피 8개 풀 중 6개 = 12개): 7점 리커트, 역채점, 진행 바
- [x] 기능 4 — 불안/회피 점수 계산 + 4유형 판별 (기준선 4.0): 감성 유형명 사용
- [x] 기능 5 — LLM 심층 대화 6턴: ECR 결과 + 워밍업 컨텍스트 시스템 프롬프트 주입
- [x] 기능 6 — 결과 JSON 생성: JSON 파싱 + 정규식 폴백 + 기본값 폴백
- [x] 기능 7 — 결과 카드: 유형명, 태그라인, 2축 산포도 SVG, 패턴/핵심상처/행동팁/마인드셋/인용구
- [x] 기능 8 — 바이럴 공유: Web Share API + 클립보드 fallback, 상대방 초대 링크
- [x] 기능 9 — LLM API 전환: Claude / OpenAI 토글, 엔드포인트/헤더 분기

## LLM API 연동
- [x] Claude 엔드포인트: https://api.anthropic.com/v1/messages (claude-opus-4-5)
- [x] Claude 헤더: x-api-key, anthropic-version, anthropic-dangerous-client-allow-browser
- [x] OpenAI 엔드포인트: https://api.openai.com/v1/chat/completions (gpt-4o)
- [x] extractText(data, provider) 공통 파싱 함수 구현
- [x] 심층 대화: system 프롬프트에 ECR 점수 + 워밍업 + 문항별 응답 포함
- [x] 결과 생성: JSON 파싱 + 정규식 폴백 + buildFallbackResult() 처리
- [x] 대화 인용구: quotes 배열 → 결과 카드 표시, 폴백 시 chat history에서 발췌
- [x] API 오류 시 한국어 오류 메시지 표시

## ECR 문항 풀 체크
- [x] 불안 풀 8개 (A1~A8)
- [x] 회피 풀 8개 (V1~V8)
- [x] 역채점 문항 — 불안: 2개 (A7, A8), 회피: 3개 (V5, V6, V7)
- [x] 매 세션 랜덤 추출: samplePool() + buildSessionQuestions()
- [x] 역채점 로직: score = 8 - rawScore (1~7 범위)
- [x] 워밍업 풀 10개 중 3개 랜덤

## 바이럴 체크
- [x] 공유 버튼: Web Share API → 클립보드 복사 fallback
- [x] 공유 텍스트: 유형명 + 부제 + URL 자동 생성
- [x] 상대방 초대 링크 복사 버튼

## 2축 산포도
- [x] SVG 직접 구현 (외부 라이브러리 없음)
- [x] x축: 회피, y축: 불안 (각 1~7)
- [x] 4사분면 배경 컬러 (투명도 낮게)
- [x] 유명인/캐릭터 12개 좌표 표시 (SPEC.md 데이터 기반)
- [x] 사용자 좌표 골드 원형 마커 + "나" 레이블
- [x] 사분면 레이블 표시

## 디자인 자체 평가
- AI slop 패턴: 없음
  - 보라/파란 그라데이션: 없음
  - 흰색 카드 격자: 없음
  - Inter/Roboto 기본 폰트: 없음
- 독창적 요소:
  - grain overlay (SVG feTurbulence noise texture)
  - 3개 orb 배경 (radial-gradient blur, 개별 animation)
  - 대화 버블 UI (메신저 스타일)
  - likert 버튼 선택 시 골드 하이라이트 + 자동 다음 문항
  - 인용구 블록 (왼쪽 골드 보더, 대형 따옴표 장식)
  - 결과 카드 분리 섹션 구조
- 배경 색상: #0a0a0f (메인), #111118 (surface), #18181f (surface2)
- 골드 포인트: #c8a96e
- 폰트: Gowun Batang (제목/섹션헤더) + Noto Sans KR (본문)

## 기술 완성도
- [x] 반응형: max-width 620px, clamp() 폰트, 모바일 2col→1col 미디어쿼리
- [x] fadeUp 0.5s ease 화면 전환 애니메이션
- [x] chat-window scrollTop 자동 스크롤
- [x] 로딩 텍스트 setInterval 순환 (5가지)
- [x] typing indicator (3-dot animation)
- [x] API 오류 에러 메시지 표시/5초 후 숨김
- [x] sessionStorage API 키 저장
- [x] 논문 출처 3개 결과 화면 하단 명시
