# 설문 기반 아바타 생성 플로우 (Survey → Avatar Create)

> 이 문서는 PR 리뷰 참조용 설계 명세입니다.
> 구현: `src/features/persona-survey/`, `src/pages/onboarding/`

## 설계 결정 사항

### 1. 질문 1페이지 1항목 표시 (페이지네이션 UX)

**결정**: 설문 질문을 한 번에 모두 보여주는 대신 질문 하나씩 넘기는 방식으로 구현.

**근거**:

- 질문이 많아질 경우 스크롤 피로 방지
- 현재 질문에만 집중하게 해 응답 완료율 향상
- "다음" 버튼 활성화 조건 = 현재 질문에 응답 → 자연스러운 진행 유도

**플로우**:

```
[질문 0] → (답변 선택 후 "다음") → [질문 1] → ... → [질문 N-1] → [아바타 이름 입력] → "아바타 생성" 제출
```

**최종 페이지** (아바타 이름 입력):

- `avatarName`: 필수, 최대 50자 (RHF + Zod 검증)
- `description`: 선택, 최대 200자 — UI에 "(선택)" 레이블 표시, 미입력 시 빈 문자열로 전송 (백엔드 `description` 필드 빈 문자열 허용)

### 2. 진입 가드

- `onboardingProgress !== 'welcome'` 이면 현재 진행 상태 경로로 redirect
- 이미 connect/complete 단계인 사용자가 설문 페이지로 직접 접근하는 것을 차단

### 3. 임시 저장 (Draft)

- 답변 선택/이름 입력 시 300ms debounce 후 localStorage에 저장 (`avating:survey:draft`)
- 페이지 재방문 시 draft를 복원, 질문 카탈로그와 교차 검증 후 stale 답변 제거
- 아바타 생성 성공 시 draft 즉시 삭제

### 4. 에러 처리

- 질문 로드 실패: `refetch` CTA 노출 (`role="alert"`)
- 제출 실패: 폼 하단 `role="alert"` 에러 메시지 표시
- ZodError: "입력 데이터를 다시 확인해주세요." 전용 메시지 (네트워크 오류와 구분)

## API 계약

| 엔드포인트                      | 메서드 | 설명                                         |
| ------------------------------- | ------ | -------------------------------------------- |
| `/api/persona/survey/questions` | GET    | 설문 질문 목록 (queryCount 파라미터)         |
| `/api/avatars/survey/`          | POST   | 아바타 생성 (후행 슬래시 — DRF APPEND_SLASH) |

### POST `/api/avatars/survey/` 요청 바디

```json
{
  "avatarName": "string (1–50자)",
  "description": "string (0–200자, 빈 문자열 허용)",
  "answers": [
    {
      "questionId": "string",
      "questionType": "SINGLE_CHOICE_5",
      "answerId": "string"
    }
  ]
}
```

### POST `/api/avatars/survey/` 응답

```json
{
  "data": {
    "avatarId": "string"
  }
}
```

생성된 아바타 ID는 응답에서 반환되며, 온보딩 다음 단계(connect)로 이동 시 사용.
