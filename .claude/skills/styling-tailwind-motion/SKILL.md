---
name: styling-tailwind-motion
description: Tailwind CSS 4 (Lightning CSS) + Motion + Lucide React — 디자인 토큰, 컴포넌트 변형(cva), 접근성 모션, 다크모드
version: 2.0.0
source:
  - CLAUDE.md#기술-스택(스타일)
  - CLAUDE.md#개발-규칙(접근성)
scope: avating-web
authority: MUST
maintainer: design-system
---

# Tailwind CSS 4 + Motion + Lucide

## 1. 방침

- **유틸리티 퍼스트** — 컴포넌트 전용 CSS 모듈/styled-components 사용 금지.
- **디자인 토큰 단일화** — 컬러/간격/라운드/섀도/모션 지속시간은 모두 `@theme` CSS 변수.
- **접근성 우선** — `prefers-reduced-motion`, 포커스 가시성, WCAG AA 대비.
- **애니메이션 라이브러리**: `motion` (Motion One 계열의 React 바인딩). `framer-motion` 과 동일 저자, 새 엔트리.
- **아이콘**: `lucide-react` 단일화. 아이콘 픽셀 크기/두께 일관.

## 2. Install

```bash
pnpm add tailwindcss@^4 @tailwindcss/vite motion lucide-react clsx tailwind-merge class-variance-authority
pnpm add -D prettier-plugin-tailwindcss
```

- `clsx` + `tailwind-merge` 로 조건부 className 조합.
- `class-variance-authority`(cva): 컴포넌트 variant 정의의 업계 표준(shadcn/ui, Radix UI 생태계 기본).

## 3. Vite 연동

```ts
// vite.config.ts (발췌)
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ plugins: [tailwindcss()] });
```

- v4 는 **PostCSS 설정 불필요**. `@tailwindcss/vite` 가 Lightning CSS 기반 파이프라인을 담당.
- `tailwind.config.{js,ts}` **생성 금지** — v4 는 CSS-native `@theme` 로 토큰 정의.

## 4. Root CSS — `@theme` 토큰

```css
/* src/app/styles/index.css */
@import 'tailwindcss';

/* === Design Tokens === */
@theme {
  /* Color — OKLCH 로 채도 유지하며 가독성 대비 확보 */
  --color-brand-50:  oklch(0.97 0.02 325);
  --color-brand-400: oklch(0.80 0.15 325);
  --color-brand-500: oklch(0.72 0.20 325);
  --color-brand-600: oklch(0.62 0.22 325);
  --color-brand-700: oklch(0.50 0.22 325);

  --color-surface:        oklch(0.99 0 0);
  --color-surface-muted:  oklch(0.96 0 0);
  --color-surface-invert: oklch(0.18 0 0);
  --color-foreground:     oklch(0.20 0 0);
  --color-foreground-muted: oklch(0.45 0 0);

  --color-success: oklch(0.74 0.18 150);
  --color-warning: oklch(0.82 0.16  85);
  --color-danger:  oklch(0.64 0.22  25);

  /* Typography */
  --font-sans: 'Pretendard Variable', ui-sans-serif, system-ui;
  --font-mono: ui-monospace, 'SF Mono', 'Menlo', monospace;

  /* Radius */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  /* Shadow */
  --shadow-card: 0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px rgb(0 0 0 / 0.06);
  --shadow-focus: 0 0 0 3px oklch(0.72 0.20 325 / 0.45);

  /* Motion */
  --ease-emphasized: cubic-bezier(0.2, 0.8, 0.2, 1);
  --duration-fast: 120ms;
  --duration-base: 200ms;
  --duration-slow: 320ms;
}

/* === Dark Mode === */
@media (prefers-color-scheme: dark) {
  :root {
    --color-surface: oklch(0.18 0 0);
    --color-surface-muted: oklch(0.22 0 0);
    --color-foreground: oklch(0.96 0 0);
    --color-foreground-muted: oklch(0.70 0 0);
  }
}

/* 사용자 토글 — html.dark 클래스 오버라이드 */
@custom-variant dark (&:where(.dark, .dark *));

/* === Base Resets === */
@layer base {
  html { -webkit-text-size-adjust: 100%; }
  body { @apply bg-surface text-foreground antialiased; }
  :focus-visible { outline: none; box-shadow: var(--shadow-focus); }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

### 토큰 원칙
1. **숫자가 아닌 의미 있는 이름** (`brand-500` 은 허용, `pink-300` 은 금지).
2. **OKLCH 우선** — 지각적 균형, 다크모드 전환 용이.
3. **간격(spacing) 은 Tailwind 기본** 사용. 커스텀 간격은 매우 예외적.
4. `!important` 금지 — utility 특이성으로 해결.

## 5. 컴포넌트 변형 — `cva` 패턴

```tsx
// src/shared/ui/Button/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

export const buttonStyles = cva(
  'inline-flex items-center justify-center gap-1.5 font-medium rounded-md transition-[background,color,box-shadow] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none',
  {
    variants: {
      variant: {
        primary:  'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700',
        secondary:'bg-surface-muted text-foreground hover:bg-surface-muted/80',
        ghost:    'bg-transparent text-foreground hover:bg-surface-muted',
        danger:   'bg-danger text-white hover:bg-danger/90',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-5 text-base',
      },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonStyles> & { as?: 'button' | 'a' };

export function Button({
  className,
  variant,
  size,
  fullWidth,
  ref,
  ...rest
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <button
      ref={ref}
      className={twMerge(clsx(buttonStyles({ variant, size, fullWidth }), className))}
      {...rest}
    />
  );
}
```

### `cn` 헬퍼
```ts
// src/shared/lib/cn.ts
import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

**규칙**:
- 모든 shared/ui 컴포넌트는 `cva` + `VariantProps` 기반.
- 직접 className 가드는 **`cn(...)`** 로 결합. 템플릿 리터럴 금지(트리셰이킹/prettier 정렬 깨짐).
- 스토리북에서 **모든 variant × size** 를 스토리화(→ `storybook-a11y`).

## 6. Motion — `motion/react`

```tsx
import { motion, AnimatePresence, LazyMotion, domAnimation } from 'motion/react';

// 번들 최적화 — 필요한 feature만 동적 로드
<LazyMotion features={domAnimation} strict>
  <AnimatePresence mode="popLayout">
    {items.map((it) => (
      <motion.li
        key={it.id}
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      />
    ))}
  </AnimatePresence>
</LazyMotion>
```

### 모션 규칙
1. **모든 모션은 토큰 duration/ease 참조** — 매직 넘버 금지.
2. **`prefers-reduced-motion` 감지**:
   ```tsx
   const reduce = useReducedMotion();
   <motion.div transition={{ duration: reduce ? 0 : 0.2 }} />
   ```
3. **리스트 재정렬**은 `layout` + `AnimatePresence mode="popLayout"`.
4. **상태 전이 애니메이션**(모달 open/close) 은 `AnimatePresence` + `initial={false}`.
5. **드래그 / 제스처**: `dragConstraints`, `dragElastic`, `whileTap` 으로 햅틱-like 피드백.
6. **스크롤 연동**은 `useScroll` + `useTransform` — IntersectionObserver 우선 고려.

## 7. Lucide Icons

```tsx
import { Heart, Diamond, Sparkles, X } from 'lucide-react';

// 의미 있는 아이콘
<Heart aria-label="좋아요" size={20} strokeWidth={1.75} />

// 장식용
<Sparkles aria-hidden size={16} strokeWidth={1.5} className="text-brand-500" />
```

**규칙**:
- 크기 단위: 16/20/24 만 허용. 다른 값은 디자인 시스템 확장 후 추가.
- `strokeWidth` 는 1.5(정보) / 1.75(컨트롤) / 2(강조) 3단계.
- 트리셰이킹: **named import 만** 사용(`import { Heart } from 'lucide-react'`). default import 금지.
- 사용 빈도 낮은 아이콘 수십 개 일괄 import 금지 — 번들 체크.

## 8. 다크 모드 전략

1. 기본은 **`prefers-color-scheme`** 에 따른 자동 감지.
2. 사용자 토글은 `<html class="dark">` 추가/제거 + `localStorage` 에 preference 저장.
3. 다크 전용 값은 `dark:` variant 또는 `@custom-variant dark` 를 이용한 토큰 스위치.
4. 이미지는 `<picture>` + `prefers-color-scheme` 쿼리로 제공.

```tsx
<button className="bg-surface text-foreground dark:bg-surface-invert dark:text-foreground">...</button>
```

## 9. 접근성 체크리스트

- [ ] 모든 인터랙티브 요소 키보드 접근 가능, 탭 순서 자연스러움.
- [ ] `:focus-visible` 스타일(글로벌 shadow-focus) 보존.
- [ ] 텍스트 명도 대비 WCAG AA (`<=` 4.5:1 본문, 3:1 대형 텍스트).
- [ ] 색만으로 상태 전달 금지 — 텍스트/아이콘 병용.
- [ ] 모션 축소 환경에서 애니메이션 단축 또는 제거.
- [ ] 스크린리더용 텍스트는 `sr-only` 유틸리티 사용.

## 10. 성능 고려

- Tailwind v4 의 Lightning CSS 는 매우 빠르지만, 컴포넌트에 **수십 개 variant**를 cva 로 생성 시 클래스 크기 증가 → hash 기반 재사용 활용.
- 글로벌 CSS 최소화. `@layer` 구분 준수.
- Font: Pretendard variable 하나만 self-host, `preload` + `font-display: swap`.
- 이미지: `loading="lazy"`, 적절한 `sizes`, AVIF/WebP.

## 11. Lint/Format

- `prettier-plugin-tailwindcss` 로 className 자동 정렬.
- `eslint-plugin-tailwindcss`:
  - `no-contradicting-classname` on.
  - `classnames-order` on (prettier 와 중복되므로 plugin 규칙 조정).
- 팀 관례: **한 줄에 너무 많은 유틸(>120 chars)** 이면 `cn(...)` 배열 스타일로 분리.

## 12. 안티패턴

- 인라인 `style={{ ... }}` — 토큰 기반 유틸로 대체.
- `@apply` 남용 — 컴포넌트 수준에서는 className 직접 조합.
- `!important` — 특이성 해결은 유틸 덧쓰기로.
- `framer-motion` 직접 의존 — Motion v11+ 는 `motion/react` 가 권장 엔트리.
- CSS-in-JS 라이브러리(styled-components/emotion) 추가.
- 하드코딩된 색/간격/섀도 값 — 반드시 토큰 참조.

## 13. References

- [Tailwind CSS v4 docs](https://tailwindcss.com/docs/v4-beta) (CSS-first config)
- [Motion (formerly Framer Motion) — React](https://motion.dev/docs/react-quick-start)
- [class-variance-authority](https://cva.style/docs)
- [shadcn/ui patterns](https://ui.shadcn.com/docs)
- [MDN — OKLCH color](https://developer.mozilla.org/docs/Web/CSS/color_value/oklch)
- 내부: [storybook-a11y](../storybook-a11y/SKILL.md), [vite-react19](../vite-react19/SKILL.md)
