# 06 · Components Catalog

확정된 공용 컴포넌트 목록. 구현 코드는 `implementation/components/` 참조.

## 카탈로그 요약

| 컴포넌트 | Variants | 상태 | 파일 |
|----------|----------|------|------|
| Button | primary / secondary / ghost | default / hover / loading / disabled | `Button.tsx` |
| Input | - | default / focus / error / disabled | `Input.tsx` |
| Tag | default / brand / success / warning / danger | - | `Tag.tsx` |
| AvatarMark | 24 / 28 / 32 / 36 / 44 | off / online / busy | `AvatarMark.tsx` |
| StatBar | default / compact | - | `StatBar.tsx` |
| Kbd | - | - | `Kbd.tsx` |
| Icon | sm / default / lg / xl | - | `Icon.tsx` |

---

## Button

### Variants

| Variant | 배경 | 테두리 | 텍스트 | 용도 |
|---------|------|--------|--------|------|
| `primary` | `--brand` | `--brand` | `#fff` | 주요 CTA (한 화면에 1개만) |
| `secondary` | `--bg-elev-2` | `--border-hi` | `--text` | 보조 액션 |
| `ghost` | transparent | transparent | `--text-2` | 취소, 삭제, 미묘한 액션 |

### Sizes

| Size | Padding | Font Size |
|------|---------|-----------|
| `sm` | `6px 10px` | 12px |
| `default` | `8px 14px` | 13px |
| `lg` | `10px 18px` | 14px |
| `icon` | `8px` (32×32 정사각형) | - |

### Props

```ts
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  isLoading?: boolean;
  disabled?: boolean;
  leadingIcon?: LucideIcon;
  trailingIcon?: LucideIcon;
  children?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}
```

### 규칙

- **한 화면에 `primary` 버튼은 최대 1개.** 주요 액션이 여러 개면 설계를 다시 검토.
- 아이콘은 항상 16px (버튼 크기와 무관하게).
- `block` prop 대신 Tailwind `w-full`로 제어.

---

## Input

### 상태

| 상태 | 테두리 | 배경 |
|------|--------|------|
| default | `--border-hi` | `--bg` |
| hover | `--text-3` | `--bg` |
| focus | `--brand` + focus ring | `--bg` |
| error | `--danger` | `--bg` |
| disabled | `--border` | `--bg-elev-2` |

### Props

```ts
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leadingIcon?: LucideIcon;
  trailingSlot?: React.ReactNode;  // 버튼, 아이콘 등
}
```

### 규칙

- `label`은 반드시 `for`/`id` 연결.
- `errorMessage`가 있으면 `aria-invalid`, `aria-describedby` 자동 처리.
- `helperText`와 `errorMessage`는 동시에 표시하지 않는다 (error가 우선).

---

## Tag

```ts
interface TagProps {
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'danger';
  children?: React.ReactNode;
  leadingIcon?: LucideIcon;
}
```

### 규칙

- **radius는 `r-sm` 고정** (pill 형태 금지).
- 크기 variant 없음 — 11px 고정.
- Tag 안에 이모지 금지.
- 동일한 `variant`로 여러 개를 나열하는 것은 OK (필터 칩, 태그 리스트).

---

## AvatarMark

실제 사진이 아닌 **이니셜 기반 마크**. 개인정보 노출 최소화 철학.

```ts
interface AvatarMarkProps {
  initials: string;      // 2글자 대문자 (e.g., "HW")
  size?: 24 | 28 | 32 | 36 | 44;
  status?: 'offline' | 'online' | 'busy';
  shape?: 'square' | 'circle';  // 28px 이하만 circle 허용
}
```

### 규칙

- **이니셜은 2글자 고정**. 한글인 경우 최대 2글자 (e.g., "현우").
- 배경은 `--bg-elev-3`, 테두리는 `--border-hi` (단일 톤).
- **상태 점**은 `status !== 'offline'`일 때만 표시.
- 28px 초과면 `shape='square'` 고정 (원형 큰 아바타 금지).

---

## StatBar

아바타 스탯(외향성, 감성 등) 및 호감도 표시용.

```ts
interface StatBarProps {
  label: string;
  value: number;          // 0-100
  icon?: LucideIcon;
  variant?: 'default' | 'compact';
  color?: 'brand' | 'success' | 'warning';  // 기본 brand
}
```

### 규칙

- **값은 0-100 범위**. 다른 단위(0-10, 0-1000) 사용 시 별도 컴포넌트로 분리.
- 색상은 기본 `--brand`. 호감도가 낮을 때 warning 등 **의미 있는 신호일 때만** 변경.
- 애니메이션: 초기 렌더 시 0%→타겟%로 `400ms` 전환. 그 외 업데이트는 `200ms`.

---

## Kbd

키보드 단축키 표시.

```tsx
<kbd>⌘</kbd><kbd>K</kbd>
```

### 규칙

- **하나의 키 = 하나의 `<kbd>` 요소**. 여러 키를 한 `<kbd>`로 묶지 않는다.
- 기호 표기: `⌘`, `⌥`, `⌃`, `⇧`, `↵`, `⎋`, `⇥` 사용.
- OS별 다른 키 표시를 위해 (Mac: ⌘ / Win: Ctrl) 플랫폼 감지 훅과 함께 사용 권장.

---

## Icon

`05-iconography.md` 참조.

---

## 미정의 컴포넌트 요청 시

위 카탈로그에 없는 컴포넌트가 필요하면:

1. **먼저 카탈로그의 기존 컴포넌트로 조합 가능한지 검토**
2. 조합 불가능하면 design-agent에게 신규 컴포넌트 설계 요청
3. 설계는 이 카탈로그의 규약을 준수해야 함
4. 승인 후 `implementation/components/`에 추가, 본 문서에 등록

**임의로 새 컴포넌트를 만들지 않는다.**
