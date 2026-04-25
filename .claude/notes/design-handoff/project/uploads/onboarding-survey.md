---
screen: onboarding-survey
version: 1.0.0
status: approved
author: design-agent
created: 2026-04-18
updated: 2026-04-18
pattern: C
---

# DSD · 온보딩 · 설문 (Survey)

## 1. 개요

**목적**: 사용자 성향 4대 스탯(외향성/감성/적극성/데이트 스타일)의 기초값 수집.
**사용자**: 회원가입 직후 온보딩 Step 2에 진입한 사용자.
**성공 지표**: 설문 완료율, 평균 소요 시간 (목표 2분 이내).

## 2. User Journey

```
[Step 1 Welcome] → [Step 2 Survey] → [Step 3 Connect Code] → [Step 4 Complete]
```

## 3. 레이아웃 패턴

- **패턴**: `C (Wizard)`
- **선택 이유**: 4단계 순차 진행, 진행률 가시화, 이전/다음 명확 구분.

## 4. 레이아웃 상세

```
┌──────────────────────────────────────┐
│ [━━━━━━━━━━━━━━━────────────]         │ Progress
│                                      │
│ STEP 2 / 4 · 성향 파악                │
│ 당신을 알려주세요                      │
│ 솔직하게 답할수록...                   │
│                                      │
│ Q1: 주말 저녁, 주로 어떻게?           │
│ [ ] 집에서 혼자                      │
│ [ ] 친한 몇 명과                     │
│ [ ] 왁자지껄한 모임에서               │
│ [ ] 그날 기분대로                    │
│                                      │
│ Q2: 마음에 드는 상대를 만났을 때       │
│ [●] 눈치껏 시그널                    │
│ [ ] 적극적으로 표현                  │
│ ...                                  │
│                                      │
│ [← 이전]    [↵ 다음]      [다음 →]   │
└──────────────────────────────────────┘
```

## 5. 컴포넌트

**재사용**: Button, Kbd, Icon

**신규**:
- `ProgressSteps`: shimmer 애니메이션이 있는 4단계 진행 표시
- `SurveyOption`: 라디오 선택 옵션 (radio + label, 선택 시 brand-soft 배경)

## 6. 디자인 토큰

- Form frame: `r-xl` 프레임 안
- Option 테두리: `--border-hi`, 선택 시 `--brand`
- 선택된 Option 배경: `--brand-soft`

## 7. 타이포그래피

- 진행 레이블: `mono-micro` `--text-3`
- Step 제목: `title` (24px) `--text`
- 서브: `body` `--text-2`
- 질문: `subheading` `--text`
- 옵션: `body` `--text`

## 8. 아이콘

- Step 완료: `Check` (완료된 step에 표시 검토)
- 이전/다음: `ArrowLeft` / `ArrowRight` (16)

## 9. 인터랙션

- **옵션 클릭**: 즉시 선택 상태로 전환, 다른 옵션 자동 해제 (single-select)
- **Enter**: 다음 단계로 (모든 질문에 답한 경우)
- **미답변 상태에서 Enter**: 첫 미답변 질문으로 스크롤 + highlight
- **이전 버튼**: 이전 단계로, 입력값 보존
- **페이지 새로고침**: localStorage에 답변 저장, 복원

## 10. 반응형

- Mobile: 옵션 grid 2→1열, 폰트는 유지
- Progress 바 위치 유지 (상단 고정)

## 11. 접근성

- Radio group: `role="radiogroup"`, `aria-labelledby`
- Progress: `role="progressbar"` `aria-valuenow={currentStep}`
- Keyboard: 화살표 키로 옵션 이동, Space/Enter로 선택

## 12. 카피라이팅

| 위치 | 텍스트 |
|------|--------|
| Step label | STEP 2 / 4 · 성향 파악 |
| 제목 | 당신을 알려주세요 |
| 서브 | 솔직하게 답할수록 아바타가 더 당신답게 움직입니다. 언제든 수정할 수 있어요. |
| 이전 버튼 | 이전 |
| 다음 버튼 | 다음 |
| 힌트 | ⌨ 다음 |

### 질문 (6개, 각 4-5지선다)

1. **주말 저녁, 주로 어떻게 보내나요?**
   - 집에서 혼자 콘텐츠 보기
   - 친한 몇 명과 조용히
   - 왁자지껄한 모임에서
   - 그날 기분대로

2. **마음에 드는 상대를 만났을 때**
   - 상대가 먼저 다가오길 기다린다
   - 눈치껏 시그널을 보낸다
   - 적극적으로 먼저 표현한다
   - 상황에 따라 다르다

3. **데이트 장소로 선호하는 곳은?**
   - 조용한 카페 / 책방
   - 전시 / 공연 / 영화
   - 야외 활동 / 산책
   - 맛집 탐방

4. **연락 스타일은?**
   - 짧고 간결하게
   - 길고 자세하게
   - 상대 스타일에 맞춤
   - 대면 선호

5. **갈등이 생겼을 때**
   - 시간을 두고 차분히
   - 바로 대화로 풀기
   - 상대가 먼저 말하길 기다림
   - 피하고 싶다

6. **이상형의 핵심 요소는?**
   - 대화가 잘 통함
   - 같은 취미 / 관심사
   - 안정감 있는 사람
   - 설렘을 주는 사람

## 13. 상태 머신

```
idle → answering (local state) → next step
                               → back → idle (previous step)
```

## 14. API

- `POST /api/onboarding/survey` (마지막 step 완료 시 전체 제출)
- 중간 저장: `PATCH /api/onboarding/survey/draft`

### 데이터 스키마

```ts
interface SurveyResponse {
  q1: 'solo' | 'few' | 'crowd' | 'mood';
  q2: 'wait' | 'signal' | 'active' | 'situation';
  // ... q3-q6
}
```

## 15. 엣지 케이스

- **브라우저 뒤로가기**: Step 1로 복귀
- **탭 닫기**: 자동 저장된 draft 존재, 재접속 시 복원
- **답변 변경**: 이전 step으로 돌아가 변경 가능, "변경" 표시

## 16. 참조

- `avating-design-v2.html` Section 03 · Onboarding
- 관련 DSD: `onboarding-connect.md`

---

## Design Rationale

### 결정: 질문을 **한 페이지에 2개씩** 묶기

- **이유**: 한 질문씩 보여주면 6번 클릭이 필요해 마찰 증가. 모두 한 번에 보여주면 부담. 2개씩이 균형점.
- **대안**: 한 질문씩 / 전체 한 페이지 → 기각

---

## Revision History

| 1.0.0 | 2026-04-18 | design-agent | 초기 승인 |
