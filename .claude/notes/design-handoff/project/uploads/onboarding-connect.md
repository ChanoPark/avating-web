---
screen: onboarding-connect
version: 1.0.0
status: approved
author: design-agent
pattern: C
---

# DSD · 온보딩 · Connect Code

## 1. 개요

**목적**: Custom GPT 연동을 위한 1회용 코드 발급 및 안내.
**성공 지표**: GPT 연동 완료율, 코드 만료율.

## 2. User Journey

```
[Survey] → [Connect Code] → [Complete]
```

## 3. 패턴

`C (Wizard)` Step 3.

## 4. 레이아웃

```
┌──────────────────────────────────────┐
│ [━━━━━━━━━━━━━━━━━━━━━━━━━────]      │
│ STEP 3 / 4 · GPT 연결                 │
│ Avating GPT와 연결                    │
│ ...                                  │
│                                      │
│ ┌─────────────────────────────────┐  │
│ │ ONE-TIME CODE                   │  │
│ │ AVT · 7X2K · M9       [복사]    │  │
│ └─────────────────────────────────┘  │
│                                      │
│ ● 유효 시간 09:47 남음                │
│                                      │
│ ── 연결 방법 ──                       │
│ 01 ChatGPT에서 Avating GPT 검색       │
│ 02 위 코드를 채팅창에 붙여넣기          │
│ 03 10분간 자연스러운 대화              │
│ 04 자동으로 다음 단계로                │
│                                      │
│ [← 이전]  연결 대기중... [GPT로 이동 →]│
└──────────────────────────────────────┘
```

## 5. 컴포넌트

**재사용**: Button, Icon, Kbd

**신규**:
- `CodeBlock`: 코드 + 복사 버튼. 모노스페이스, 2px dashed border
- `Countdown`: 남은 시간 표시, 1분 단위로 색상 변화 (>5min neutral / ≤5min warning / ≤1min danger)
- `InstructionList`: 번호 매겨진 단계 리스트 (mono 스타일 번호)

## 6. 디자인 토큰

- Code 배경: `--bg`, border `--border-hi` dashed
- Countdown dot: `--success` (active pulse)
- Instruction 배경: `--bg`, border `--border`

## 7. 타이포그래피

- Code value: `font-mono` 22px 500 weight, letter-spacing 4px
- Code label: `mono-micro` uppercase `--text-3`
- Instruction 번호: `mono-meta` `--text-3`
- Instruction 본문: `mono-meta` `--text-2`

## 8. 아이콘

- 복사: `Copy` (14)
- 시계: `Clock` (14)
- 외부 이동: `ArrowUpRight` (16) — "GPT로 이동" 버튼
- 책 (연결 방법 제목): `Book` (16) `--brand`

## 9. 인터랙션

- **복사 버튼**: 클립보드 복사 + 버튼이 "복사됨" 1초간 표시
- **GPT로 이동**: 새 탭에서 `https://chat.openai.com/g/avating` 열기
- **Countdown**: 10:00부터 실시간 감소, 00:00 도달 시 "만료" 상태로 전환
- **Polling**: 15초마다 백엔드에 연결 완료 여부 확인, 완료 시 자동으로 Step 4로 전환

## 10. 반응형

- 모바일: Code value 글자 크기 18px로 축소, letter-spacing 3px

## 11. 접근성

- Code value: `aria-label="연결 코드 AVT 7X2K M9"`
- Countdown: `aria-live="polite"` 1분 단위 업데이트 (매초는 과도함)
- 만료 시: `role="alert"`

## 12. 카피라이팅

| 위치 | 텍스트 |
|------|--------|
| Step label | STEP 3 / 4 · GPT 연결 |
| 제목 | Avating GPT와 연결 |
| 서브 | ChatGPT의 Avating GPT에 아래 코드를 입력하면, 대화를 통해 성향을 더 깊이 학습합니다. 10분 내 사용해주세요. |
| Code label | ONE-TIME CODE |
| Countdown | 유효 시간 **MM:SS** 남음 |
| Instruction 제목 | 연결 방법 |
| 단계 01 | ChatGPT에서 **Avating GPT** 검색 |
| 단계 02 | 위 코드를 채팅창에 붙여넣기 |
| 단계 03 | 10분간 자연스러운 대화 (질문 6–8개) |
| 단계 04 | 자동으로 이 화면이 다음 단계로 전환 |
| 하단 힌트 | 연결 대기 중... |
| 복사 버튼 | 복사 |
| 복사 완료 | 복사됨 |
| GPT 이동 | GPT로 이동 |
| 코드 만료 | 코드가 만료되었습니다. [재발급] |

## 13. 상태 머신

```
active → (polling...) → connected → Step 4
active → (timer) → expired → regenerate → active
```

## 14. API

- `POST /api/onboarding/connect-code` (발급/재발급)
- `GET /api/onboarding/connect-status` (polling, 15초 간격)

### 스키마

```ts
interface ConnectCode {
  code: string;           // "AVT-7X2K-M9"
  expiresAt: string;      // ISO 8601
  status: 'active' | 'connected' | 'expired';
}
```

## 15. 엣지 케이스

- **탭 백그라운드**: polling 중단, 복귀 시 즉시 1회 확인 후 재개
- **복사 실패** (권한 거부 등): Fallback으로 수동 선택 안내
- **만료 직전 (1분 이하)**: warning 색상으로 변경, "재발급" 옵션 표시

## 16. 참조

- `avating-design-v2.html` Section 03
- 관련 DSD: `onboarding-survey.md`, `onboarding-complete.md` (미작성)

---

## Revision History

| 1.0.0 | 2026-04-18 | design-agent | 초기 승인 |
