import type { ReactNode } from 'react';

/**
 * 정본 아트보드가 1440 데스크톱 전용이라 모바일 규격이 없다 — 좁은 폭에서는
 * 두 페인을 세로로 접기만 한다.
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

// .cx-auth__mark — 마크가 아니라 워드마크다. 제품에 심볼이 없어서 여기서 지어내지 않는다.
function BrandWordmark() {
  return (
    <div className="text-ink text-[22px] leading-[30px] font-bold tracking-[-0.01em]">Avating</div>
  );
}

function AuthAside({ items, note }: { items: readonly AuthAsideItem[]; note?: string }) {
  return (
    <aside
      aria-label="이용 안내"
      className="border-subtle bg-canvas flex w-full shrink-0 flex-col gap-4 border-t px-9 py-12 lg:w-[340px] lg:border-t-0 lg:border-l"
    >
      <span className="text-label text-secondary uppercase">HOW IT WORKS</span>

      {items.map((item, index) => (
        <div key={item.title} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="border-subtle bg-surface text-secondary text-meta tnum rounded-card flex h-[26px] w-[26px] shrink-0 items-center justify-center border">
              {`0${String(index + 1)}`}
            </span>
            <span className="text-caption text-primary font-medium">{item.title}</span>
          </div>
          <p className="text-meta text-secondary tnum pl-[34px]">{item.description}</p>
        </div>
      ))}

      {note !== undefined && (
        <p className="text-meta text-secondary tnum mt-auto leading-[1.5]">{note}</p>
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
    <div className="bg-canvas text-primary flex min-h-screen flex-col lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-6 py-12">
        <section aria-labelledby={headingId} className="w-[400px] max-w-full">
          <BrandWordmark />

          <h1 id={headingId} className="text-lead text-ink mt-6 font-semibold">
            {title}
          </h1>
          <p className="text-caption text-secondary tnum mt-1">{subtitle}</p>

          <div className="mt-6 flex flex-col">{children}</div>
        </section>

        {footnote !== undefined && (
          <p className="text-meta text-secondary mt-4 w-[400px] max-w-full">{footnote}</p>
        )}
      </div>

      <AuthAside items={asideItems} {...(asideNote === undefined ? {} : { note: asideNote })} />
    </div>
  );
}
