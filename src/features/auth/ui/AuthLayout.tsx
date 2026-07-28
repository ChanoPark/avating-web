import type { ReactNode } from 'react';
import { Card } from '@shared/ui/Card';

/**
 * 가입(S-01-02) · 로그인(S-01-03) 공통 2단 셸.
 * 정본: `.claude/design/2026-07-26-wireframe-v2/wf/wf-s1-entry.jsx` 의 `ScreenSignup` ·
 * `ScreenSignin` · `AuthAside`. 좌 폼 페인 flex 1 (padding 48/56, 가운데 정렬) +
 * 우 AuthAside 340 고정. 정본 아트보드는 1440 데스크톱 전용이라 모바일 규격이 없어,
 * 좁은 폭에서는 두 페인을 세로로 접기만 한다 (가로 스크롤 0).
 */

export type AuthAsideItem = {
  readonly title: string;
  readonly description: string;
};

type AuthLayoutProps = {
  /** 폼 카드 제목의 id — 폼 섹션과 aria-labelledby 로 연결된다. */
  headingId: string;
  title: string;
  subtitle: string;
  asideItems: readonly AuthAsideItem[];
  /** AuthAside 하단 각주 — 정본에 있는 화면에서만 전달한다. */
  asideNote?: string;
  /** 폼 카드 아래 각주 — 정본에 있는 화면에서만 전달한다. */
  footnote?: string;
  children: ReactNode;
};

// 로고 마크 — 정사각 19, radius = 19 × 0.28. 워드마크 = 19 × 0.78, weight 500,
// letterSpacing -0.4px (LAYOUT-NUMBERS § 카드 · 데이터 부품).
function BrandLogo() {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden="true" className="bg-primary h-[19px] w-[19px] shrink-0 rounded-[5.32px]" />
      <span className="text-ink text-[14.82px] font-medium tracking-[-0.4px]">Avating</span>
    </span>
  );
}

// AuthAside — 폭 340 고정, padding 48/36, bg-surface + 좌측 hairline.
// 항목 = 26px 사각 번호 + 제목(t-caption/500) + 설명(t-micro t-mute, padding-left 34).
function AuthAside({ items, note }: { items: readonly AuthAsideItem[]; note?: string }) {
  return (
    <aside
      aria-label="이용 안내"
      className="border-hairline bg-surface flex w-full shrink-0 flex-col gap-4 border-t px-9 py-12 lg:w-[340px] lg:border-t-0 lg:border-l"
    >
      <span className="text-micro-cap text-ink-mute uppercase">HOW IT WORKS</span>

      {items.map((item, index) => (
        <div key={item.title} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="border-hairline bg-canvas-soft text-ink-mute text-micro tnum flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md border">
              {`0${String(index + 1)}`}
            </span>
            <span className="text-caption text-ink font-medium">{item.title}</span>
          </div>
          <p className="text-micro text-ink-mute tnum pl-[34px]">{item.description}</p>
        </div>
      ))}

      {note !== undefined && (
        <p className="text-micro text-ink-mute tnum mt-auto leading-[1.5]">{note}</p>
      )}
    </aside>
  );
}

export function AuthLayout({
  headingId,
  title,
  subtitle,
  asideItems,
  asideNote,
  footnote,
  children,
}: AuthLayoutProps) {
  return (
    <div className="bg-canvas text-ink flex min-h-screen flex-col lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-6 py-12 lg:px-14">
        <section aria-labelledby={headingId} className="w-full max-w-[460px]">
          {/* 폼 카드 — padding 38px 44px 34px, 내부 gap 20 */}
          <Card className="flex flex-col gap-5 px-6 pt-9.5 pb-8.5 sm:px-11">
            <BrandLogo />

            <div className="flex flex-col gap-1.5">
              <h1 id={headingId} className="text-heading-lg text-ink">
                {title}
              </h1>
              <p className="text-body-sm text-ink-mute tnum">{subtitle}</p>
            </div>

            {children}
          </Card>
        </section>

        {footnote !== undefined && (
          <p className="text-micro text-ink-mute mt-4 w-full max-w-[460px]">{footnote}</p>
        )}
      </div>

      <AuthAside items={asideItems} {...(asideNote === undefined ? {} : { note: asideNote })} />
    </div>
  );
}
