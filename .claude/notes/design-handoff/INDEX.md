# Avating — Claude Design Handoff (archived reference, v2)

이 디렉터리는 `claude.ai/design` 에서 전달받은 핸드오프 번들의 **원본 사본**이다. 개발 중에 디자인 의도와 토큰을 확인할 때 단일 근거로 사용한다.

## 핵심 파일

- `README.md` — 핸드오프 번들 개요 (코딩 에이전트용 지침).
- `chats/chat1.md` — 디자이너↔사용자 대화 로그. 카피·플로우 변경 이력의 단일 근거.
- `project/Avating Wireframe.html` — 와이어프레임 (Babel/React 인라인). 데이터 구조와 컴포넌트 뼈대.
- `project/design-canvas.jsx` — 공통 캔버스 뷰어 (참고용, 실서비스 미사용).
- `project/uploads/*.md` — 디자인 규약 (foundations · color · typography · spacing/radius/shadow · iconography · components · patterns) + 화면별 상세 스펙.

## 토큰 매핑

CSS 변수는 `src/app/styles/tokens.css` 에 **단일 소스**로 정의하며, Tailwind 4 의 `@theme` 는 `src/app/styles/index.css` 에서 해당 변수를 참조한다. 핸드오프의 `02-color.md` / `03-typography.md` / `04-spacing-radius-shadow.md` 와 **1:1** 매칭.

## v2에서 추가된 화면/규칙

| 섹션 | 화면 | 비고 |
|------|------|------|
| **05** | Session Result · Chat History | 종료 후 요약 + 결과 검색/필터 |
| **06** | Real Chat List · Real Chat | 매칭 후 실제 1:1 대화 |
| **07** | After Request Send · Sent · Received | 첫 인사 메시지 필드 포함 |
| **09** | Validation States · Toast Notifications | 와이어프레임 외 별도 섹션 |
| 03 (modal) | 매칭 불가 안내 | 진행 중 매칭 있을 때 |

### 카피·용어 규약

- **"파견" → "매칭"** 으로 통일 (전 화면).
- **"본캐 연결" → "에프터 연결"** 으로 통일.
- 기본 와이어프레임은 **정상 입력 상태** 가 기본. 에러/포커스/도움말 등은 09 섹션에서만 표시.
- 토스트는 **제목(1줄) + 부제(1줄)** 구조, 우하단 고정.

### 사이드바 아이콘 (Lucide)

| 항목 | 아이콘 |
|------|--------|
| 대시보드 | `LayoutGrid` |
| 아바타 탐색 | `Compass` |
| 관전중 | `Eye` |
| 매칭/연결 | `Heart` |
| 실제 대화 | `MessageCircle` |
| 내 아바타 | `User` |
| 다이아 | `Gem` |
| 설정 | `Settings` |

## 작업 원칙

- **시각 결과만** 재현. 핸드오프의 인라인 스타일 구조를 그대로 옮기지 않는다.
- 새 화면은 `src/pages/<domain>/` 에 페이지를, `src/features/<domain>/` 에 기능 로직을 둔다.
- 디자인 시스템 컴포넌트(Toast/Modal/Input 등)는 모두 `src/shared/ui/` 에서 단일 소스 관리.
