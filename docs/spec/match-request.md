# Match Request Flow (v4)

> 사용자가 다른 사용자의 아바타에게 **매칭(소개팅)을 요청**하고, 상대 사용자가 수락/거절을 결정하는 양방향 플로우.

- **단일 출처**: 디자인 — `.claude/design/v4/project/Avating Wireframe v4.html` (S03 / N01–N07)
- **연관 디자인 사양**: `.claude/design/v4/project/uploads/matching-confirm.md`, `simulation-view.md`, `avatar-detail.md`
- **로드맵 / 기술 분해**: `.claude/plans/v4-match-request-flow.md`

## 1. 목적

기존 `DispatchModal`(아바타 단방향 파견 == 시뮬레이션 즉시 시작)을 **양방향 요청·수락 모델**로 전환한다. v3 까지는 사용자 A 가 상대 아바타 B 를 선택하면 곧바로 시뮬레이션이 시작됐지만, v4 에서는

1. A 가 B 의 사용자에게 **요청을 보내고**
2. B 의 사용자가 A 의 아바타 정보를 검토한 뒤
3. **수락하면** 두 아바타가 채팅을 시작
4. **거절하면** 익명 사유와 함께 A 에게 통보

이 4 단계를 거친다. 매칭 티켓(◇) 차감은 **상대 수락 시점**에만 발생하므로 일방적인 결제 부담을 제거한다.

## 2. 대상 사용자 상태

| 행위자   | 진입 상태                                        | 결과 상태                                            |
| -------- | ------------------------------------------------ | ---------------------------------------------------- |
| 요청자 A | `READY` (아바타 보유 + 매칭 가능)                | `WAITING` → 수락 시 `WATCHING`, 거절 시 `READY` 복귀 |
| 수신자 B | `READY` 또는 `WATCHING` (다른 세션 중일 수 있음) | 수락 시 `WATCHING`, 거절 시 변화 없음                |

용어 정의는 `CLAUDE.md > 사용자 상태` 참고.

## 3. 화면 구성

`.claude/design/v4/project/Avating Wireframe v4.html` 기준 7 개 신규 화면.

| ID  | 컴포넌트                    | 패턴                     | 행위자 | 진입점                             |
| --- | --------------------------- | ------------------------ | ------ | ---------------------------------- |
| N01 | `ScreenMatchRequestSend`    | E (Modal 420×560)        | A      | Avatar Detail "매칭 요청" 버튼     |
| N02 | `ScreenRequestDetail`       | B (App Shell, 560×560)   | B      | 받은 요청 목록 행 클릭 / 푸시 알림 |
| N03 | `ScreenRejectReason`        | E (Modal 380×460)        | B      | N02 "거절" 버튼                    |
| N04 | `ScreenMatchAcceptedNotice` | E (Modal 420×460)        | A·B    | 수락 직후 양측에 표시              |
| N05 | `ScreenTurnContinueModal`   | E (Modal 420×520)        | A·B    | 시뮬레이션 1차(약 10분) 종료 시점  |
| N06 | `ScreenMatchEnded`          | C (Wizard-style 420×460) | A·B    | 호감도 0% 또는 자연 마무리         |
| N07 | `ScreenRejectedNotice`      | E (Modal 420×440)        | A      | 거절 사유 수신 시                  |

> N04 / N05 / N06 은 매칭 진행(In Progress) 단계. 본 스펙은 **N01·N02·N03·N07** (요청·수락/거절 분기) 을 우선 다루고, 진행·종료 분기 (N04·N05·N06) 는 별도 시뮬레이션 스펙에서 다룬다.

## 4. 요청자 (A) 플로우 — N01 Match Request Send

### 4.1 진입

- Avatar Detail 화면(`/avatars/:id`)에서 **"매칭 요청"** CTA 클릭.
- 상대가 차단/탈퇴 상태이면 CTA 비활성화 + 사유 툴팁.
- 상대가 이미 응답 대기 중인 요청이 있으면 CTA → "이미 요청 보냄" 표시.

### 4.2 입력

| 필드                | 타입   | 필수 | 검증                                                   |
| ------------------- | ------ | ---- | ------------------------------------------------------ |
| `partnerAvatarId`   | string | ✅   | URL params 에서 자동 주입                              |
| `requesterAvatarId` | string | ✅   | 본인이 보유한 아바타 중 1 개 선택, `status !== 'busy'` |
| `greeting`          | string | ❌   | 0–100 자, 비우면 아바타가 자율 인사                    |

### 4.3 부수 정보 (참고 표시)

- 상대 아바타 카드 (이니셜·이름·인증·관심사 태그 2 개·`online` 상태)
- 비용 안내: `매칭 요청 비용 · 상대 수락 시 채팅 시작` + `◇ 30`

### 4.4 액션

- **취소**: 모달 닫기. 라우터 변경 없음.
- **요청 보내기**: `POST /api/match-requests` 호출 → 성공 시 토스트 "요청을 보냈어요" + 모달 닫기 + `WAITING` 상태 전이. 실패 시 인라인 에러.

### 4.5 검증·에러

| 상황                   | UI                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| 내 아바타 미선택       | "사용할 아바타를 선택해주세요" — Submit 버튼 disable                                                          |
| 본인 아바타 0 개       | 모달 내 안내 표시("아바타를 먼저 만들어주세요. 매칭 요청에는 최소 1개의 아바타가 필요해요.") + Submit disable |
| 모든 아바타 busy       | 모달 내 안내 표시("현재 매칭에 사용할 수 있는 아바타가 없어요…") + Submit disable                             |
| 인사말 100 자 초과     | textarea 하단 카운터 빨강 + Submit disable                                                                    |
| 다이아 부족 (402)      | 인라인 알림 "다이아가 부족해요" + 충전 링크                                                                   |
| 상대가 차단/탈퇴 (409) | 모달 닫고 토스트 "이 사용자에게는 요청을 보낼 수 없어요"                                                      |
| 네트워크 오류          | 토스트 "잠시 후 다시 시도해주세요" — 재시도 버튼 활성                                                         |

## 5. 수신자 (B) 플로우 — N02·N03·N07

### 5.1 N02 Request Detail

`/match-requests/received/:requestId` 에서 받은 요청 1 건의 풀 정보 검토.

표시 항목:

- 요청 메타 (수신 시각, 응답 마감 카운트다운 24h)
- 요청자 ↔ 내 아바타 페어 (양측 이니셜·이름·타입)
- 요청자 아바타 풀 정보 — `HexRadar` 6 축 스탯, 6 개 ProgressBar, 관심사 태그
- 요청자가 보낸 첫 인사말 (있을 때만)
- 예상 대화 틀 (아바타 톤·관심사 겹침 요약 — 호환도% 표기 금지)

액션:

- **나중에**: 라우터 push `/match-requests/received` (목록 복귀)
- **거절**: N03 모달 오픈
- **수락**: `POST /api/match-requests/:id/accept` → N04 화면 → 시뮬레이션 시작

### 5.2 N03 Reject Reason

거절 사유 라디오 5 개:

1. 관심사가 달라요
2. 대화 스타일이 안 맞아 보여요
3. 지금은 매칭이 부담돼요
4. 아바타가 너무 적극적이에요
5. 직접 입력 (textarea 0–200 자)

`POST /api/match-requests/:id/reject` payload: `{ reason: string }` (라디오 라벨 또는 직접 입력 본문).

### 5.3 N07 Rejected Notice — A 측 알림

A 의 알림 센터·인박스에서 진입. 내용:

- 거절 메타 (요청·응답 일시, 사용 아바타)
- 익명 거절 사유 (텍스트만, 사용자 신상 비공개)
- "매칭 티켓은 차감되지 않았습니다" 안내
- CTA: 요청 이력 / 다른 아바타 보기

## 6. 데이터 모델

### 6.1 `MatchRequest`

```ts
type MatchRequestStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

interface MatchRequest {
  id: string;
  requesterUserId: string;
  requesterAvatarId: string;
  partnerUserId: string;
  partnerAvatarId: string;
  greeting: string | null; // 0–100자
  status: MatchRequestStatus;
  rejectionReason: string | null; // status === 'rejected' 일 때만
  createdAt: string; // ISO
  respondedAt: string | null;
  expiresAt: string; // createdAt + 24h
}
```

### 6.2 API

| 메서드 | 경로                             | 용도                                                                      |
| ------ | -------------------------------- | ------------------------------------------------------------------------- |
| `POST` | `/api/match-requests`            | A 가 요청 생성. body: `{ partnerAvatarId, requesterAvatarId, greeting? }` |
| `GET`  | `/api/match-requests/received`   | B 의 받은 요청 목록                                                       |
| `GET`  | `/api/match-requests/sent`       | A 의 보낸 요청 목록                                                       |
| `GET`  | `/api/match-requests/:id`        | 단건 상세                                                                 |
| `POST` | `/api/match-requests/:id/accept` | B 의 수락                                                                 |
| `POST` | `/api/match-requests/:id/reject` | B 의 거절. body: `{ reason }`                                             |
| `GET`  | `/api/me/avatars`                | A 의 본인 아바타 목록 (busy 포함, FE 가 `busy` 플래그로 비활성화)         |

응답 envelope: `{ data: T }` (기존 컨벤션과 동일).

> **API 계약 출처**: `.claude/api/openapi.yaml` 는 BE springdoc 자동 생성 결과를 동기화하는 로컬 캐시이며 `.gitignore` 로 차단되어 있다(IP 보호). BE 가 본 엔드포인트를 구현하기 전까지는 본 스펙(`docs/spec/match-request.md`) 이 FE 측 contract 단일 출처이고, MSW 핸들러(`src/shared/mocks/handlers/matchRequest.ts`) 와 Zod 스키마(`src/entities/match-request/model.ts`) 가 본 표를 따른다.

### 6.3 에러 코드

| HTTP | code                | 의미                  |
| ---- | ------------------- | --------------------- |
| 402  | `INSUFFICIENT_GEMS` | 다이아 부족           |
| 409  | `PARTNER_BLOCKED`   | 차단/탈퇴된 사용자    |
| 409  | `DUPLICATE_REQUEST` | 이미 응답 대기 중     |
| 404  | `AVATAR_NOT_FOUND`  | 상대/본인 아바타 부재 |
| 410  | `REQUEST_EXPIRED`   | 24h 경과              |

## 7. 라우팅

| 경로                           | 페이지                                                        | 가드        |
| ------------------------------ | ------------------------------------------------------------- | ----------- |
| `/avatars/:id`                 | Avatar Detail (기존 placeholder → 본 스펙은 매칭 CTA 만 추가) | `AuthGuard` |
| `/match-requests/received`     | Received Requests 목록                                        | `AuthGuard` |
| `/match-requests/received/:id` | Request Detail (N02)                                          | `AuthGuard` |
| `/match-requests/sent`         | Sent Requests 목록                                            | `AuthGuard` |

요청 보내기 모달 (N01) 은 별도 라우트가 아니라 Avatar Detail 의 컴포넌트 상태로 관리한다. (`?action=request` 쿼리로 딥링크 가능하도록 향후 확장 여지만 둠.)

## 8. 접근성 / 반응형

- 모달 N01·N03 → `role="dialog"` `aria-modal="true"` `aria-labelledby` 설정, 첫 포커스 = 폼 첫 필드(아바타 라디오), ESC / 배경 클릭 = `취소`.
- 모바일: 모달 풀 스크린 + 하단 sticky 액션. 디자인 토큰 `r-xl` 상단만 유지.
- 키보드: 라디오 그룹 ↑/↓ 이동, Enter 로 Submit, Tab 트랩.
- 스크린 리더: 비용 안내(`매칭 요청 비용 · 상대 수락 시 채팅 시작`) 는 `aria-describedby` 로 Submit 에 연결.

## 9. 카피 / 톤 (Anti-AI)

- 이모지 금지 (디자인 시스템 규약).
- "운명의 상대" / "매직" 등 과장 카피 금지.
- 거절 통보 (N07) 는 부드러운 톤 — `"moonlit이 요청을 거절했어요"` + `"매칭 티켓은 차감되지 않았습니다"`.
- 종료 화면 (N06) 컬러는 brand/success — danger 금지 (chat11 사용자 결정).

## 10. 메트릭

- `match_request.send.success` / `.fail.{code}`
- `match_request.accept.success` (B → A 응답 시간)
- `match_request.reject.{reason_id}`
- `match_request.expire`
- 요청 → 수락 전환율 / 거절 사유 분포

Amplitude 이벤트 스키마는 `observability-sentry-amplitude` 스킬 컨벤션 따름.

## 11. 보안 / 개인정보

- 거절 사유는 익명 전달. 응답자 사용자 ID·실명·연락처 절대 미노출 (B → A 응답 페이로드에서 마스킹).
- 본인 아바타 목록 응답에는 `personaSeed` 등 민감 필드 제외.
- 요청 만료 24 h: 서버측에서 강제, 클라이언트 카운트다운은 UX 보조용.

## 12. 마이그레이션

- 기존 `DispatchModal` (Dashboard 의 즉시 매칭) 은 v4 까지 유지. 점진적으로 "매칭 요청" 모델로 통합 — Dashboard CTA 도 `MatchRequestModal` 호출로 교체할 예정.
- 기존 `/api/sessions` (즉시 시뮬레이션 시작) 는 deprecated 되지 않고, **수락 시 서버가 호출**하는 내부 흐름이 된다.

## 13. 변경 이력

| 버전  | 일자       | 변경                                   |
| ----- | ---------- | -------------------------------------- |
| 1.0.0 | 2026-05-06 | v4 와이어프레임 기반 초안 (Author: AI) |
