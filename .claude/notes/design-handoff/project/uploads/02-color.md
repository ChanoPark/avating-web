# 02 · Color

## 설계 원칙

- **단일 포인트 컬러**: 브랜드 인디고 하나만 강조색으로 사용한다.
- **기능 색상은 신호로만**: success/warning/danger는 "상태를 알려야 할 때"만 쓴다.
- **다크 모드 우선**: 라이트 모드는 Phase 2로 후순위.
- **색상은 CSS 변수로**: Tailwind 유틸리티도 CSS 변수를 통해 참조한다.

## Palette

### Background (4단계 엘리베이션)

| 토큰 | Hex | 용도 |
|------|-----|------|
| `--bg` | `#0A0E1A` | 페이지 배경 (최하단) |
| `--bg-elev-1` | `#0F1420` | 카드 표면 |
| `--bg-elev-2` | `#161C2C` | 카드 내부 중첩 표면, 입력 배경 |
| `--bg-elev-3` | `#1E2538` | Hover/Active 상태 |

### Border (2단계)

| 토큰 | Hex | 용도 |
|------|-----|------|
| `--border` | `#1F2638` | 기본 구분선, 카드 테두리 |
| `--border-hi` | `#2A3349` | 입력 필드, 강조된 경계 |
| `--border-focus` | `#3B5BDB` | 포커스 링 (브랜드 계열) |

### Text (4단계)

| 토큰 | Hex | 용도 | 대비율 (vs `--bg`) |
|------|-----|------|-------------------|
| `--text` | `#E4E7EF` | 본문, 주요 정보 | 13.8:1 ✅ AAA |
| `--text-2` | `#A1A8BC` | 보조 텍스트, 라벨 | 7.2:1 ✅ AAA |
| `--text-3` | `#6B7490` | 메타 정보, 타임스탬프 | 4.1:1 ✅ AA |
| `--text-4` | `#434D67` | 비활성화 | 2.4:1 (비활성 전용) |

### Brand (단일 포인트 컬러)

| 토큰 | Hex | 용도 |
|------|-----|------|
| `--brand` | `#5170FF` | Primary 버튼, 링크, 포커스, 활성 상태 |
| `--brand-hover` | `#6781FF` | Primary 호버 |
| `--brand-soft` | `rgba(81, 112, 255, 0.12)` | Primary 배경 (Tag, 선택된 옵션) |
| `--brand-border` | `rgba(81, 112, 255, 0.25)` | Brand 계열 테두리 |

### Functional (기능 신호)

| 토큰 | Hex | 용도 |
|------|-----|------|
| `--success` | `#3FB950` | 성공, 온라인, 긍정적 수치 증가 |
| `--warning` | `#D29922` | 주의, Busy 상태, 중간 수치 |
| `--danger` | `#F85149` | 오류, 필수 필드, 부정적 변화 |

## 색상 사용 규칙

### ✅ 해도 되는 것

- Primary 버튼에만 `--brand` 배경 사용
- 링크 텍스트에 `--brand` 색상
- 성공 메시지에 `--success`
- 에러 메시지에 `--danger`
- 스탯바/차트에 `--brand`

### ❌ 하지 말아야 할 것

- 여러 컴포넌트에 각기 다른 강조색 사용 (무조건 `--brand` 하나)
- 기능 색상(success/warning/danger)을 장식용으로 사용
- 아이콘을 기능 색상으로 항상 표시 (아이콘 기본은 `--text-3`)
- `--text-4`를 비활성화 외 용도로 사용

## 사용 예시

### 카드

```tsx
<div className="bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-lg p-4">
  <h3 className="text-[var(--text)]">카드 제목</h3>
  <p className="text-[var(--text-2)]">설명 텍스트</p>
  <span className="text-[var(--text-3)] font-mono text-xs">2026-04-18</span>
</div>
```

### 상태 태그

```tsx
{/* 성공: 인증된 회원 */}
<span className="bg-[rgba(63,185,80,0.1)] text-[#4AC464] border border-[rgba(63,185,80,0.2)]">
  인증
</span>

{/* 주의: Busy 상태 */}
<span className="bg-[rgba(210,153,34,0.1)] text-[#E0A93A] border border-[rgba(210,153,34,0.2)]">
  소개팅 중
</span>
```

### 숫자 변화 표시

```tsx
{/* 증가 */}
<span className="text-[var(--success)]">+6</span>

{/* 감소 */}
<span className="text-[var(--danger)]">-3</span>

{/* 변화 없음 */}
<span className="text-[var(--text-3)]">-</span>
```

## 다크 모드 전환 대응 (Phase 2)

라이트 모드는 후순위 작업이지만 설계 시 고려한다.

```css
:root[data-theme='light'] {
  --bg: #ffffff;
  --bg-elev-1: #f9fafb;
  --bg-elev-2: #f3f4f6;
  /* ... */
}
```

하지만 **Phase 1에서는 다크 모드 고정**으로 개발한다.
