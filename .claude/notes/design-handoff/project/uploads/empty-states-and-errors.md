---
screen: empty-states-and-errors
version: 1.0.0
status: approved
author: design-agent
pattern: (패턴 모음)
---

# DSD · 빈 상태 & 에러 페이지 패턴

여러 화면에서 반복적으로 나타나는 비정상/특수 상태의 디자인 규약. 화면별 DSD에서 "빈 상태" 섹션은 이 문서를 참조한다.

## 1. 공통 원칙

- **일러스트 사용 금지** — 이모지, 캐릭터, 장식 그림 사용 안 함. 순수 텍스트 + 아이콘(옵션)
- **사실 기반 카피** — 무엇이 없는지 + 무엇을 할 수 있는지 명확히
- **CTA는 선택적** — 강제 action 유도 금지. 사용자가 스스로 판단할 수 있게 정보 제공
- **중앙 정렬 최소화** — 리스트 영역에 "빈 상태"가 표시될 때, 페이지 전체를 채우지 않고 그 영역에만 표시

## 2. 패턴 · Empty State (빈 리스트)

### 구조

```
┌──────────────────────────────────────┐
│                                      │
│              [Icon, 24]               │
│                                      │
│           {Title}                    │
│                                      │
│         {Description}                │
│                                      │
│         [Optional CTA]               │
│                                      │
└──────────────────────────────────────┘
```

### 시각

- 아이콘: Lucide 24px, `--text-3`
- 제목: `heading` `--text-2`
- 설명: `body-sm` `--text-3`
- CTA: `Button variant="ghost"` (강조하지 않음)
- padding: `space-12` (48px) vertical
- 텍스트 정렬: 중앙

### 예시 매핑

| 화면 | 아이콘 | 제목 | 설명 | CTA |
|------|--------|------|------|-----|
| 아바타 리스트 (필터로 0건) | `Compass` | 조건에 맞는 아바타 없음 | 필터를 조정하거나 잠시 후 다시 확인해주세요 | 필터 초기화 |
| 관전 중 (없음) | `Eye` | 관전 중인 세션 없음 | 내 아바타가 파견되면 여기에 표시됩니다 | — |
| 매칭 (없음) | `Heart` | 아직 매칭 없음 | 호감도 75 이상 달성 시 매칭 제안을 받게 됩니다 | — |
| 거래 내역 (없음) | `Clock` | 거래 내역 없음 | 첫 구매 시 여기에 기록됩니다 | 상점 보기 |
| 태그 (편집 중, 0개) | `Tag` | 태그 없음 | 관심사를 추가하면 호환도 매칭이 정확해집니다 | — |
| 대화방 (메시지 0개) | `MessageSquare` | 아직 메시지 없음 | 첫 메시지를 보내 대화를 시작해보세요 | — |

## 3. 패턴 · Error (페이지 레벨)

### 404 Not Found

```
┌──────────────────────────────────────┐
│                                      │
│             [AlertTriangle, 24]       │
│                                      │
│     페이지를 찾을 수 없습니다          │
│                                      │
│    요청한 페이지가 존재하지 않거나    │
│    이동되었을 수 있습니다.            │
│                                      │
│    [← 이전] [홈으로]                   │
│                                      │
│    ERROR_CODE: 404                   │  ← mono, --text-3
│                                      │
└──────────────────────────────────────┘
```

### 500 Internal Error

- 아이콘: `AlertTriangle`
- 제목: 일시적인 오류가 발생했습니다
- 설명: 잠시 후 다시 시도해주세요. 계속되면 문의해주세요.
- CTA: [다시 시도] [문의하기]
- Error code: `ERROR_CODE: 500 · REQUEST_ID: {id}` (문의 시 사용할 수 있도록)

### 403 Forbidden

- 아이콘: `Lock`
- 제목: 접근 권한이 없습니다
- 설명: 이 페이지를 보려면 로그인이 필요하거나 권한이 필요합니다.
- CTA: [로그인] or [이전 페이지]

### Offline (네트워크 없음)

- 아이콘: `WifiOff`
- 제목: 인터넷 연결이 끊겼습니다
- 설명: 연결 상태를 확인하고 다시 시도해주세요.
- CTA: [다시 시도]
- **자동 재시도**: 3초 간격, 최대 5회. 재시도 중에는 CTA 대신 "재연결 시도 중... (3/5)" 표시.

## 4. 패턴 · Maintenance (계획된 점검)

```
┌──────────────────────────────────────┐
│              [Settings, 24]            │
│                                      │
│       서비스 점검 중입니다             │
│                                      │
│    {YYYY-MM-DD HH:mm} - {HH:mm}      │
│    약 {duration}분 소요 예정          │
│                                      │
│    점검 내용: {brief}                 │
│                                      │
│    STATUS_PAGE →                     │  ← link to status page
└──────────────────────────────────────┘
```

- 아이콘: `Settings`
- 예정 시간은 `font-mono`
- 사용자 액션 불가 (재시도 버튼 없음)

## 5. 패턴 · Inline Error (폼 필드)

폼 제출 실패 시 페이지 이동 대신 인라인 표시:

### 필드별 에러
- Input 컴포넌트의 `errorMessage` prop 사용 (`02-color.md` 참조)
- 색상: `--danger`
- 폰트: `mono-meta`

### 전역 에러 (폼 최상단)
```tsx
<div role="alert" className="
  bg-danger-soft border border-danger-border
  rounded-md p-3
  flex items-start gap-2
">
  <Icon icon={AlertTriangle} size={16} className="text-danger mt-0.5" />
  <div className="flex-1">
    <div className="text-ui-label text-danger">저장에 실패했습니다</div>
    <div className="text-body-sm text-text-2 mt-0.5">{상세 메시지}</div>
  </div>
</div>
```

## 6. 패턴 · Toast (일시적 알림)

### 구조

- 화면 우상단 (desktop) / 하단 (mobile) 고정
- 3초 후 자동 소멸 (hover/focus 시 일시정지)
- 최대 3개 스택, 오래된 것부터 소멸

### Variants

| Variant | 배경 | 아이콘 | 용도 |
|---------|------|--------|------|
| success | `--success-soft` + `--success-border` | `Check` | 저장 완료, 결제 성공 |
| error | `--danger-soft` + `--danger-border` | `AlertTriangle` | 작업 실패 |
| info | `--bg-elev-2` + `--border` | `Info` | 정보성 알림 |

### 예시

```tsx
<div role="status" aria-live="polite" className="
  flex items-center gap-2
  bg-success-soft border border-success-border
  rounded-md px-4 py-2.5
  shadow-2
">
  <Icon icon={Check} size={16} className="text-success" />
  <span className="text-body text-text">저장되었습니다</span>
  <button aria-label="닫기">
    <Icon icon={X} size={14} className="text-text-3" />
  </button>
</div>
```

## 7. 패턴 · Skeleton (로딩 상태)

### 규칙

- 단색 `--bg-elev-2` 배경 + shimmer 애니메이션
- **스피너(원형 회전) 대신 skeleton 우선** — 레이아웃을 미리 예측할 수 있어 인지 부하 낮음
- 실제 콘텐츠와 동일한 크기/위치 유지

### 예시 (Avatar list 로딩)

```tsx
<div className="avatar-row animate-shimmer">
  <div className="w-9 h-9 bg-bg-3 rounded-sm" />  {/* 아바타 자리 */}
  <div className="h-3 w-24 bg-bg-3 rounded-sm" /> {/* 이름 자리 */}
  <div className="h-3 w-16 bg-bg-3 rounded-sm" /> {/* 유형 자리 */}
  {/* ... */}
</div>
```

### 예외: 스피너 허용

Skeleton이 맞지 않는 경우(버튼 내부, 작은 영역):
- Lucide `Loader2` 아이콘 + `animate-spin`
- 크기는 주변 요소와 같게

## 8. 패턴 · Confirmation (위험 액션)

되돌릴 수 없는 액션은 Modal (Pattern E) 사용 + 추가 저항:

### Level 1 — 단순 확인
- 체크박스 없음, 단순 "확인" / "취소" 버튼
- 예: 로그아웃

### Level 2 — 체크박스 확인
- "이 작업은 되돌릴 수 없음을 이해했습니다" 체크박스
- 체크 시 Primary 버튼 활성화
- 예: 거래 취소

### Level 3 — 타이핑 확인
- 특정 문구 (예: 닉네임, 이메일, "DELETE") 입력 요구
- 정확히 일치할 때만 Primary 활성화
- 예: 아바타 초기화, 계정 삭제

## 9. 화면별 적용

각 화면의 DSD에서 "빈 상태" 섹션을 채울 때 이 문서의 매핑 테이블을 참조한다. 새 빈 상태가 필요하면:

1. 이 문서의 "예시 매핑" 테이블에 추가
2. 변경 이력 기록
3. 화면 DSD에서 이 문서 참조

## 10. 카피라이팅 규약

- ❌ "아직 아무것도 없어요 😢" → ✅ "아직 데이터 없음"
- ❌ "오류가 발생했어요!" → ✅ "오류가 발생했습니다 · ERROR_CODE: ..."
- ❌ "잠시만요..." → ✅ "불러오는 중" (혹은 skeleton으로 대체)
- ❌ "완료!" → ✅ "저장되었습니다"

---

## Revision History

| 1.0.0 | 2026-04-18 | design-agent | 초기 승인 |
