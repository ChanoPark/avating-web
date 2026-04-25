---
screen: real-chat
version: 1.0.0
status: approved
author: design-agent
pattern: D (수정) or new variant
---

# DSD · 본캐 연결 후 실제 채팅

## 1. 개요

**목적**: 본캐 연결이 완료된 두 사용자가 실제로 대화하는 채팅 화면. 아바타 시뮬레이션과 시각적으로 구별되어야 한다.
**사용자**: 양측 매칭 승낙 + 본인 인증 완료한 사용자.
**성공 지표**: 첫 메시지 교환율, 7일 후 지속 대화율, 실제 만남 성사율 (assumption).

## 2. User Journey

```
Matching Confirm (양측 수락) → [Real Chat] → 대화 지속 / 대화 종료 / 차단·신고
```

## 3. 패턴

`D (Split View)`의 변형. 시뮬레이션 화면과 유사하지만 **훈수 패널이 없음** — 실제 사람의 대화이므로 개입 불가.

## 4. 레이아웃

```
┌──────────────────────────────────┬──────────┐
│ [SP] spring              [●online]│ 상대 정보│
│ 본캐 연결 · 3일 전 시작           │          │
│                         [⋯]       │ [SP]     │
├──────────────────────────────────┤ spring   │
│                                  │ @spring  │
│ ── 오늘 ──                       │          │
│ [SP] spring · 14:23              │ 아바타   │
│  안녕하세요 처음 뵙는데...        │ 원본 프로│
│                                  │ 필 보기 →│
│ [me] 나 · 14:24                  │          │
│  네 반갑습니다!                   │          │
│                                  │ 대화 이력│
│ ── 어제 ──                       │ • 시작: 3│
│ [SP] spring · 09:15              │   일 전  │
│  좋은 아침!                      │ • 총 47  │
│                                  │   메시지 │
├──────────────────────────────────┤          │
│ [이미지] [메시지 입력...] [전송]  │ [차단·신고]│
└──────────────────────────────────┴──────────┘
```

## 5. 컴포넌트

**재사용**: Button, Input, Tag, AvatarMark, Icon

**신규**:
- `RealMessageBubble`: 시뮬레이션의 `ChatBubble`과 구분되는 variant. **Blind text 기능 없음**, **훈수 연관 표시 없음**.
- `DateSeparator`: "오늘", "어제", "{날짜}" 구분선.
- `RealChatComposer`: 이미지 첨부 버튼 포함 (이미지 업로드는 실제 대화의 핵심).
- `ChatInfoPanel`: 우측 메타 패널 (아바타 프로필 링크, 대화 이력 요약, 차단/신고).

## 6. 디자인 토큰

시뮬레이션과 시각적으로 구별하기 위한 차별화:
- **전체 배경**: `--bg-elev-1` (시뮬레이션은 `--bg` 어두운 톤) — 살짝 밝게
- **Me 메시지 버블**: `--brand-soft` + `--brand-border` (시뮬레이션과 동일)
- **Partner 메시지 버블**: `--bg-elev-2` + `--border` (시뮬레이션과 동일)
- **상단 헤더 배경**: `--bg` (구분감)

## 7. 타이포그래피

- 헤더 이름: `subheading`
- 메타 (본캐 연결 · N일 전): `mono-meta` `--text-3`
- Date separator: `mono-micro` uppercase `--text-3`
- 메시지 sender: `mono-meta` `--text-3`
- 메시지 body: `body` `--text`

## 8. 아이콘

| 위치 | Lucide |
|------|--------|
| 온라인 점 (헤더) | (dot, 아이콘 아님) |
| 더보기 | `MoreHorizontal` |
| 이미지 첨부 | `Image` |
| 전송 | `Send` |
| 차단 | `UserX` |
| 신고 | `AlertTriangle` |
| 원본 프로필 링크 | `ArrowUpRight` |

## 9. 인터랙션

### 메시지 전송

- **Enter**: 줄바꿈
- **⌘+Enter**: 전송
- **이미지 첨부**: 파일 피커 → 이미지 미리보기 → 전송 (여러 장 지원)
- **타이핑 중 표시**: 상대에게 전송되는 indicator

### 스크롤

- 새 메시지 도착 시 자동 scroll (사용자가 위로 스크롤 중이 아니면)
- 위로 스크롤 → Infinite scroll로 과거 메시지 로드
- "새 메시지 {n}개" 플로팅 버튼 (사용자가 위로 있을 때 아래서 새 메시지 오면)

### 안전 기능

- **신고 클릭** → 모달 (신고 사유 선택 + 설명)
- **차단 클릭** → 확인 모달 ("상대와의 모든 대화 기록이 숨겨지고, 향후 매칭 대상에서 제외됩니다")

### 원본 아바타 프로필 링크

- 우측 패널의 "아바타 원본 프로필 보기" → 이 사용자가 소개팅 당시 사용한 아바타의 프로필 열기 (그때의 스탯/태그)
- **지금의 실시간 아바타 상태는 표시하지 않음** (매칭 당시 상태가 의사결정 근거)

## 10. 반응형

- Mobile: 우측 Info Panel 숨김 → 헤더 우측 "⋯" 메뉴로 통합
- Date separator 위치 유지
- 이미지 메시지는 메시지 폭의 60%로 제한

## 11. 접근성

- 메시지 영역: `role="log"` `aria-live="polite"`
- 이미지 첨부: `alt` 텍스트 입력 유도 (선택) — "이미지 설명" 필드
- 신고/차단 버튼은 명확한 `aria-label`
- 타이핑 indicator: `aria-label="상대가 입력 중"`

## 12. 카피라이팅

### 헤더

- 이름: {상대 이름} (실명은 노출하지 않음 — 닉네임만)
- 상태: 본캐 연결 · {N}일 전 시작
- online/offline 표시

### Info Panel

- 제목: 상대 정보
- 원본 프로필 링크: 아바타 원본 프로필 보기 →
- 대화 이력 제목: 대화 이력
- 대화 이력 항목: 시작: {N}일 전 · 총 {N} 메시지
- 안전 섹션: 차단·신고

### Composer

- placeholder: 메시지 입력...
- 이미지 첨부 버튼 tooltip: 이미지 추가
- 전송 실패 시: 전송 실패. 다시 시도하려면 클릭하세요.

### Date separator

- 오늘 · 어제 · {요일} · {M월 D일}

### 시스템 메시지 (특별한 경우)

- 매칭 직후 첫 입장: "본캐 연결이 성사되어 대화가 시작됐습니다. 서로를 존중하며 대화해주세요."
- 상대가 차단/탈퇴: "상대가 더 이상 대화할 수 없습니다."
- 신고 접수: "신고가 접수되었습니다. 검토 후 처리됩니다."

### 차단 확인 모달

- 제목: {상대 이름} 차단
- 본문: 차단하면 모든 대화 기록이 숨겨지고, 향후 매칭에서 제외됩니다. 이 작업은 되돌릴 수 있습니다.
- 확인: 차단
- 취소: 취소

### 신고 모달

- 제목: {상대 이름} 신고
- 사유 선택 (radio):
  - 부적절한 언어
  - 스팸/광고
  - 허위 프로필
  - 개인정보 요구
  - 성적 콘텐츠
  - 기타
- 설명 (optional textarea)
- 확인: 신고
- 안내: 신고 내용은 비공개로 검토되며, 허위 신고는 제재 대상입니다.

## 13. 상태 머신

```
connecting → connected → active
active → (send message) → optimistic-update → confirmed/failed
active → (receive message) → render
active → (block) → confirm-dialog → blocked (redirect out)
active → (report) → report-modal → submitted
active → (partner-deleted) → read-only mode
```

## 14. API / Realtime

- `GET /api/real-chats/{id}` — 채팅방 정보 + 초기 메시지 (최신 50개)
- WebSocket `wss://.../real-chats/{id}/stream` — 실시간 메시지
- `POST /api/real-chats/{id}/messages` — 메시지 전송
- `POST /api/real-chats/{id}/images` — 이미지 업로드 후 메시지 전송
- `POST /api/users/{partnerId}/block` — 차단
- `POST /api/reports` — 신고

### 스키마

```ts
interface RealChatMessage {
  id: string;
  senderId: string;
  timestamp: string;
  type: 'text' | 'image' | 'system';
  content: string;
  imageUrl?: string;
  read?: boolean;
}

interface RealChatInfo {
  id: string;
  partnerHandle: string;
  partnerInitials: string;
  partnerOnline: boolean;
  partnerAvatarProfileId: string;   // 매칭 당시 아바타 스냅샷 id
  startedAt: string;                // 본캐 연결 시작일
  messageCount: number;
}
```

## 15. 엣지 케이스

- **상대 탈퇴**: read-only 모드, "상대가 서비스를 탈퇴했습니다" 배너. 대화 내역은 유지 (사용자 선택으로 삭제 가능).
- **상대 차단당함** (내가 차단된 경우): "대화할 수 없는 상대입니다" 메시지. 차단 사실은 고지하지 않음 (상대 프라이버시).
- **연결 끊김**: WebSocket 재연결 시도, 30초 이상 실패 시 "연결이 끊겼습니다. 새로고침해주세요." 배너.
- **이미지 업로드 실패**: 실패한 메시지에 재시도 버튼.
- **부적절한 메시지 자동 필터링** (opt-in): AI 모더레이션 적용 시 경고 표시 → 사용자 확인 후 전송.
- **스크린샷 경고**: (iOS/Android 네이티브 연동 시) 상대가 스크린샷 찍으면 알림 (동의한 경우만).

## 16. 참조

- 관련 DSD: `matching-confirm.md` (진입점), `simulation-view.md` (시각적 대비 참조)

---

## Design Rationale

### 결정: 시뮬레이션 화면과 **시각적으로 차별화**

- **이유**: 실제 대화와 AI 대화는 책임과 영향이 완전히 다르다. 사용자가 "지금 누구와 말하고 있는지" 즉각 인지해야 함.
- **방법**: 배경 톤 미묘하게 변경 + 훈수 패널 제거 + "본캐 연결" 메타 정보 헤더 표시
- **대안**: 동일한 UI 재사용 → 기각 (혼동 위험, 모더레이션 책임 회피)

### 결정: 훈수/블라인드 텍스트 기능 **완전 제거**

- **이유**: 실제 사람과의 대화에 AI 개입은 기만. 실제 대화는 "있는 그대로".
- **대안**: 번역/교정 도구 제공 → 향후 고려 가능하나 Phase 1은 순수 채팅만.

### 결정: 원본 아바타 프로필을 **매칭 당시 스냅샷**으로 고정

- **이유**: 매칭은 그 시점의 아바타 기반 결정이었음. 현재 아바타 상태를 보여주면 혼란 유발.
- **대안**: 실시간 아바타 상태 표시 → 기각

### 결정: 이미지 첨부 허용, 음성/영상 Phase 2

- **이유**: 텍스트 + 이미지가 MVP. 음성·영상은 모더레이션·대역폭·프라이버시 이슈가 커서 별도 기획.
- **대안**: 텍스트만 → 기각 (실제 대화에 이미지는 필수적 요소)

---

## Revision History

| 1.0.0 | 2026-04-18 | design-agent | 초기 승인 |
