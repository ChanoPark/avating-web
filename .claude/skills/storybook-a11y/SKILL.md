---
name: storybook-a11y
description: Storybook 8 + a11y addon + Vite builder — 디자인 시스템 카탈로그, variant 매트릭스, 인터랙션 테스트, MSW/Query 데코레이터
version: 2.0.0
source:
  - CLAUDE.md#기술-스택(카탈로그)
  - CLAUDE.md#개발-규칙(접근성)
scope: avating-web
authority: MUST
maintainer: design-system
---

# Storybook 8 + Accessibility

## 1. 범위

- **MUST 스토리 작성 대상**: `src/shared/ui/**` 의 모든 프리미티브(Button, Modal, Toast, Field, Skeleton…).
- **SHOULD 스토리 작성 대상**: 피처 경계 컴포넌트(MatchingSessionCard, InterventionPanel 등) — 핵심 상태별 1개 이상(빈/로딩/에러/성공/권한부족).
- **SHOULD NOT**: 페이지 전체(Playwright 책임), 일회성 presentational.

## 2. Install

```bash
pnpm dlx storybook@^8 init --builder=vite
pnpm add -D @storybook/addon-a11y @storybook/addon-essentials @storybook/addon-interactions \
  @storybook/test @storybook/addon-themes @storybook/addon-viewport msw-storybook-addon
```

## 3. 주요 설정 파일

### 3.1 `.storybook/main.ts`
```ts
import type { StorybookConfig } from '@storybook/react-vite';
import path from 'node:path';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  framework: { name: '@storybook/react-vite', options: {} },
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
    '@storybook/addon-themes',
    '@storybook/addon-viewport',
    'msw-storybook-addon',
  ],
  typescript: { reactDocgen: 'react-docgen-typescript' },
  docs: { autodocs: 'tag', defaultName: 'Docs' },
  staticDirs: ['../public'],
  viteFinal: async (cfg) => {
    cfg.resolve = cfg.resolve ?? {};
    cfg.resolve.alias = {
      ...(cfg.resolve.alias ?? {}),
      '@':         path.resolve(__dirname, '../src'),
      '@app':      path.resolve(__dirname, '../src/app'),
      '@pages':    path.resolve(__dirname, '../src/pages'),
      '@features': path.resolve(__dirname, '../src/features'),
      '@entities': path.resolve(__dirname, '../src/entities'),
      '@shared':   path.resolve(__dirname, '../src/shared'),
    };
    return cfg;
  },
};
export default config;
```

### 3.2 `.storybook/preview.ts`
```ts
import type { Preview } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { withThemeByClassName } from '@storybook/addon-themes';
import '../src/app/styles/index.css';

initialize({ onUnhandledRequest: 'bypass' });

const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

const preview: Preview = {
  loaders: [mswLoader],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'surface' },
    a11y: {
      options: { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] } },
      manual: false,
    },
    controls: { expanded: true, sort: 'requiredFirst' },
    docs: { source: { type: 'code' } },
    viewport: {
      viewports: {
        iphone14: { name: 'iPhone 14', styles: { width: '390px', height: '844px' } },
        ipadMini: { name: 'iPad Mini', styles: { width: '768px', height: '1024px' } },
        desktop:  { name: 'Desktop',   styles: { width: '1280px', height: '800px' } },
      },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
    }),
    (Story) => (
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
  tags: ['autodocs'],
};
export default preview;
```

## 4. 스토리 작성 표준

### 4.1 Primitive (Button)
```tsx
// src/shared/ui/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within, fn } from '@storybook/test';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
  args: { children: '매칭 시작', onClick: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary','secondary','ghost','danger'] },
    size:    { control: 'inline-radio', options: ['sm','md','lg'] },
  },
  parameters: { layout: 'centered', docs: { subtitle: '기본 버튼 컴포넌트' } },
};
export default meta;
type S = StoryObj<typeof meta>;

export const Primary: S = { args: { variant: 'primary' } };
export const Secondary: S = { args: { variant: 'secondary' } };
export const Danger: S = { args: { variant: 'danger', children: '매칭 종료' } };
export const Disabled: S = { args: { disabled: true } };

export const Matrix: S = {
  render: (args) => (
    <div className="grid grid-cols-4 gap-3">
      {(['primary','secondary','ghost','danger'] as const).flatMap((v) =>
        (['sm','md','lg'] as const).map((s) => (
          <Button key={`${v}-${s}`} {...args} variant={v} size={s}>{v}/{s}</Button>
        ))
      )}
    </div>
  ),
};

export const ClickInteraction: S = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button'));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
```

### 4.2 데이터 의존 컴포넌트 (MSW)
```tsx
// src/features/matching/ui/SessionCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { SessionCard } from './SessionCard';

const meta: Meta<typeof SessionCard> = {
  component: SessionCard,
  tags: ['autodocs'],
};
export default meta;
type S = StoryObj<typeof meta>;

export const Loading: S = {
  parameters: {
    msw: { handlers: [
      http.get('/api/sessions/:id', async () => { await new Promise(r => setTimeout(r, 60_000)); return HttpResponse.json({}); }),
    ] },
  },
};
export const Loaded: S = {
  parameters: { msw: { handlers: [ http.get('/api/sessions/:id', () => HttpResponse.json(sessionFixture)) ] } },
};
export const Error: S = {
  parameters: { msw: { handlers: [ http.get('/api/sessions/:id', () => HttpResponse.json({ code:'NETWORK' }, { status: 503 })) ] } },
};
```

## 5. 접근성 게이트

- **a11y addon violations 0 이 배포 조건**.
- Disable 은 기본 금지. 불가피 시 **스토리 파라미터 레벨**로 한정 + 사유 주석.
  ```ts
  parameters: { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false, reason: 'brand logo only' }] } } }
  ```
- 키보드 내비게이션 인터랙션 테스트 1개 이상(`Tab`/`Enter`/`Escape`).

## 6. Interaction 테스트 (`@storybook/test`)

- `play` 함수에 `userEvent` + `expect` 사용.
- 네트워크 의존 스토리는 MSW 핸들러 파라미터화.
- Vitest 와 동일한 어서션 API 로 학습 비용 제로.

## 7. Docs (MDX)

- 각 카테고리 루트에 `*.mdx` 로 **개요 + 사용 원칙** 기록.
- 토큰 참조: `docs/tokens.mdx` 에 디자인 토큰과 사용 예.
- `autodocs` 태그로 컴포넌트 스토리에서 자동 docs 생성.

## 8. 정적 배포 / Visual Regression

- `pnpm storybook build` → `storybook-static/` → S3 + CloudFront 의 별도 서브도메인 `design.avating.com` 배포(운영 외).
- Visual regression 은 **Chromatic** 연결 시 Storybook 스토리 그대로 캡처. (도입 시 ADR 별도)

## 9. 성능 / 번들

- Storybook 자체 번들은 운영 번들과 분리 — 운영 앱 번들에 영향 없음.
- 스토리 수가 많아지면 `--webpack-stats-json` 대신 Vite 빌더 그대로 사용, `--no-open`.
- CI 캐시: `storybook-static/` 업로드.

## 10. 팀 규칙 체크리스트

- [ ] 신규 `shared/ui/*` 는 스토리 없이는 머지 불가.
- [ ] variant × size × state 매트릭스 스토리 1개.
- [ ] 접근성 addon violations 0.
- [ ] 주요 인터랙션 `play` 테스트 1개 이상.
- [ ] 다크 테마 스토리 포함.

## 11. 안티패턴

- `args` 에 실제 서비스 PII 사용.
- 스토리에서 글로벌 상태 직접 조작(전역 Zustand `setState`) — mock 데코레이터로 주입.
- 네트워크 호출을 MSW 없이 실제 서버로.
- 스토리 당 지나치게 많은 variant 를 `render` 하나에 모음 → Matrix 스토리로 분리.
- 접근성 위반을 스토리 전체 `disable` 로 숨김.

## 12. References

- [Storybook docs](https://storybook.js.org/docs)
- [addon-a11y](https://storybook.js.org/addons/@storybook/addon-a11y)
- [@storybook/test (interactions + play)](https://storybook.js.org/docs/writing-tests/component-testing)
- [msw-storybook-addon](https://github.com/mswjs/msw-storybook-addon)
- 내부: [styling-tailwind-motion](../styling-tailwind-motion/SKILL.md), [mocking-msw](../mocking-msw/SKILL.md)
