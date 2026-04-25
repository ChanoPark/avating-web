---
screen: simulation-view
version: 1.0.0
status: approved
author: design-agent
pattern: D
---

# DSD · 시뮬레이션 관전 & 개입

## 1. 개요

**목적**: 내 아바타와 상대 아바타의 대화를 실시간 관전하며, 다이아를 소모해 개입한다.
**성공 지표**: 세션당 훈수 사용 횟수, 세션 완주율, 매칭 성공률.

## 2. User Journey

```
Main → [Dispatch or Watch] → [Simulation] → (turn 12 완료) → Matching or End
```

## 3. 패턴

`D (Split View)`.

## 4. 레이아웃

```
┌────────────────────────────┬──────────────┐
│ [HW] 내 아바타 × [SP] 상대  │  호감도       │
│ TURN 06/12   호감도 64 [⋯] │  ┌─────────┐ │
├────────────────────────────┤  │ 64/100  │ │
│                            │  │ +6 ↑    │ │
│ ─── TURN 05 · 14:23 ───    │  │ ━━━━━━▁ │ │
│ [SP] spring · 14:23        │  │ ▲ 75    │ │
│  안녕하세요...              │  └─────────┘ │
│                            │              │
│ [HW] 내 아바타 · 14:23      │  빠른 훈수   │
│  네, 서촌 골목길...         │  (balance)   │
│                            │              │
│ ─── TURN 06 · 14:25 ───    │  [preset 1] │
│ ⚡ 이벤트 주입              │  [preset 2] │
│                            │  [preset 3] │
│ [SP] spring                │  ...        │
│  어 저도 [🔒속마음] 이런..   │              │
│                            │  세션 로그   │
│ [HW] 작성 중 ○○○           │  14:18 시작 │
│                            │  14:21 관심사│
├────────────────────────────┤  14:23 훈수 │
│ [입력...]  💎20  [전송]     │              │
│ ⌘↵ 전송 · 자연어...         │              │
└────────────────────────────┴──────────────┘
```

## 5. 컴포넌트

**재사용**: Button, Input, Icon, AvatarMark, Tag, Kbd

**신규**:
- `ChatBubble`: 메시지 말풍선 (mine / theirs 방향, 일반 / 타이핑 / 시스템 variant)
- `TurnMarker`: 턴 구분선 ("TURN 05 · 14:23")
- `SystemEvent`: 드라마 인젝션 등 시스템 이벤트 (Zap 아이콘 + mono 텍스트)
- `BlindText`: 가려진 텍스트 (Lock 아이콘 + "속마음" 라벨, 클릭 시 해제 모달)
- `TypingIndicator`: 점 3개 bounce 애니메이션
- `AffinityPanel`: 호감도 큰 숫자 + 바 + 임계값 표시
- `InterventionPreset`: 프리셋 훈수 아이템 (icon + label + cost)
- `SessionLog`: 세션 이벤트 로그 (mono, 시간순)
- `SimComposer`: 하단 입력창 (input + cost + send button + hint)

## 6. 디자인 토큰

- Chat area 배경: `--bg` (darker than surrounding)
- Message bubble (mine): `--brand-soft` + `--brand-border`
- Message bubble (theirs): `--bg-elev-2` + `--border`
- System event: warning-soft (`rgba(210,153,34,0.06)`) + warning-border
- Right panel 배경: `--bg-elev-1`

## 7. 타이포그래피

- Turn marker: `mono-micro` `--text-3` uppercase
- Message sender: `mono-meta` `--text-3`
- Message body: `body` `--text`
- System event: `mono-meta` `--warning`
- Affinity big: `title` (28px 수정) 600 weight
- Preset label: `body-sm` `--text`
- Preset cost: `mono-meta` `--text-3`
- Session log: `mono-meta`

## 8. 아이콘

- Zap (이벤트): `Zap` (14) `--warning`
- Blind lock: `Lock` (14)
- Typing: dots (SVG 직접)
- Composer send: `Send` (16)
- More (header): `MoreHorizontal` (16)

### Preset 훈수 아이콘 매핑

- 더 적극적으로: `Flame`
- 감성적 전환: `Moon`
- 유머 한마디: `Sparkles`
- 데이트 제안: `Coffee`
- 속마음 해제: `Lock`
- 대기 단축: `Clock`

## 9. 인터랙션

### Chat

- **새 메시지 도착**: 자동 scroll to bottom (사용자가 위로 올린 상태가 아니면)
- **Scroll up**: auto-scroll 비활성화, 새 메시지 오면 "새 메시지 보기" 버튼 하단 출현
- **Blind text 클릭**: 비용 확인 모달 → 다이아 차감 → 실제 텍스트 공개 애니메이션 (fade)
- **Typing indicator**: 상대가 생성 중일 때 표시, 완료 시 실제 메시지로 교체

### Preset 훈수

- **클릭**: 즉시 실행 (비용 확인 없음, 작은 금액만)
- **다이아 부족**: 비활성화 + "다이아 충전" 링크
- **실행 직후**: 해당 preset 일시 비활성화 (중복 방지, 다음 턴에 재활성화)

### Composer (자유 입력)

- **Enter**: 줄바꿈 (multi-line 지원)
- **⌘+Enter**: 전송
- **전송 시**: 서버 검증 → 아바타에게 지시 주입 → 다음 턴에 반영
- **비용**: 20 다이아 고정 (preset보다 비쌈 — 자유도 대가)

### Session Log

- 실시간 업데이트 (websocket 기반)
- 주요 이벤트만 표시 (세션 시작, 관심사 발견, 훈수 사용, 이벤트 주입)

## 10. 반응형

- **Mobile (<960px)**:
  - Right panel 숨김, 상단 헤더에 "패널 보기" 버튼 → Bottom Sheet로 슬라이드 업
  - Affinity는 헤더 영역에 mini 표시 유지
  - Composer는 하단 고정 유지

## 11. 접근성

- Chat area: `role="log"` `aria-live="polite"` (새 메시지 알림)
- Typing indicator: `aria-label="상대가 입력 중"`
- Blind text 버튼: `aria-label="다이아 3으로 속마음 해제"`
- Affinity: `role="progressbar"` `aria-valuenow` `aria-valuemax`
- Session log: `role="log"` `aria-live="off"` (자동 읽기 끔, 사용자가 요청 시만)

## 12. 카피라이팅

### Header

- Turn: `TURN {current} / 12` (mono)
- Affinity: `호감도 {value}`

### System Events (드라마 인젝션 예시)

- "이벤트 주입 — 공통 관심사 발견: {topic}"
- "이벤트 주입 — 예상치 못한 질문 등장"
- "이벤트 주입 — 대화 전환점"

### Blind Text

- 버튼 라벨: "속마음" (Lock icon 옆)
- 해제 확인 모달: "다이아 3을 소모해 속마음을 확인합니다"

### Preset 훈수 (6개)

| 라벨 | 비용 | 아이콘 |
|------|------|--------|
| 더 적극적으로 | 5 | Flame |
| 감성적 전환 | 5 | Moon |
| 유머 한 마디 | 3 | Sparkles |
| 데이트 제안 | 10 | Coffee |
| 속마음 해제 | 3 | Lock |
| 대기 단축 | 15 | Clock |

### Composer

- placeholder: "직접 지시하기 — 예: '연락처를 자연스럽게 물어봐줘'"
- hint: "⌘ ↵ 전송 · 자연어로 구체적일수록 정확합니다"
- 비용 표시: "20" (Gem icon과 함께)
- 전송 중: "전송 중..."
- 전송 실패: "전송 실패. 다시 시도해주세요"

### Affinity Panel

- 제목: "호감도"
- 임계값 라벨: "▲ 본캐 연결 75"
- 변화량: "+{n} 지난 턴 대비"

## 13. 상태 머신

```
session:
  active → turn-progressing → turn-complete → next turn (up to 12)
  active → paused (연결 끊김) → reconnecting → active
  turn-12-complete → (affinity >= 75) → matching proposal
                  → (affinity < 75) → session end

message:
  generating → received → displayed

intervention:
  sent → queued → applied (next turn) → effect visible
```

## 14. API / Realtime

- `GET /api/sessions/{id}` (세션 정보 + 기존 메시지)
- WebSocket: `wss://.../sessions/{id}/stream` (실시간 메시지, 이벤트)
- `POST /api/sessions/{id}/interventions` (훈수 전송)
- `POST /api/sessions/{id}/blind-reveal/{messageId}` (속마음 해제)

### WebSocket Events

```ts
type WSEvent =
  | { type: 'message'; data: Message }
  | { type: 'typing'; avatar: 'mine' | 'theirs'; isTyping: boolean }
  | { type: 'turn-start'; turn: number }
  | { type: 'drama-injection'; description: string }
  | { type: 'affinity-change'; from: number; to: number }
  | { type: 'session-end'; finalAffinity: number };
```

## 15. 엣지 케이스

- **연결 끊김**: 재연결 시도 + "연결 중..." 오버레이. 30초 내 재연결 실패 시 에러 페이지.
- **탭 백그라운드**: WebSocket 유지, 브라우저 알림으로 중요 이벤트 통지 (권한 요청 전제)
- **다이아 0 상태**: Composer disable + "충전" 버튼 노출. Preset은 비용 낮은 것만 활성.
- **세션 종료 직전 (Turn 11-12)**: 훈수 효과 알림 강화, Affinity 변화 강조

## 16. 참조

- `avating-design-v2.html` Section 05
- 관련 DSD: `main-dashboard.md`, `matching-confirm.md`

---

## Design Rationale

### 결정 1: 드라마 인젝션을 **시스템 메시지 스타일**로

- **이유**: 이벤트를 화려한 애니메이션이나 모달로 보여주면 몰입 깨짐. 채팅 흐름 속 사실 기반 알림으로 처리.
- **대안**: 확대 애니메이션 + 컨페티 → 기각 (AI스러움)

### 결정 2: Blind Text를 **Lock 아이콘 + 작은 박스**로

- **이유**: 원본 HTML에서 5개의 `●` 점으로 표시했으나, 아이콘 정책상 stroke 아이콘이 더 일관됨.
- **대안**: 점 5개, 블러 처리 → 일관성 부족

### 결정 3: Right Panel을 **280px 고정**으로

- **이유**: Chat 가독성(65-75 char line)을 고려할 때 280px이 적절. 더 넓으면 chat이 좁아짐.
- **대안**: resizable splitter → 기각 (복잡도 증가)

---

## Revision History

| 1.0.0 | 2026-04-18 | design-agent | 초기 승인 |
