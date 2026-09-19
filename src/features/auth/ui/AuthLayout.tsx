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
  subtitle?: string;
  /** 없으면 우측 안내 페인 없이 폼만 가운데 둔다 (가입 화면). */
  asideItems?: readonly AuthAsideItem[];
  /** 화면 맨 위에 붙는 상단 바 — 폼·안내 페인은 그 아래 남은 높이를 채운다. */
  header?: ReactNode;
  children: ReactNode;
};

// .cx-auth__mark — 마크가 아니라 워드마크다. 제품에 심볼이 없어서 여기서 지어내지 않는다.
function BrandWordmark() {
  return <div className="text-ink text-title font-bold tracking-[-0.03em]">Avating</div>;
}

function AuthAside({ items }: { items: readonly AuthAsideItem[] }) {
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
    </aside>
  );
}

export function AuthLayout({
  headingId,
  title,
  subtitle,
  asideItems,
  header,
  children,
}: AuthLayoutProps) {
  return (
    <div className="bg-canvas text-primary flex min-h-screen flex-col">
      {header}

      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-6 py-12">
          <section aria-labelledby={headingId} className="w-[400px] max-w-full">
            <BrandWordmark />

            <h1 id={headingId} className="text-lead text-ink mt-6 font-semibold">
              {title}
            </h1>
            {subtitle !== undefined && (
              <p className="text-caption text-secondary tnum mt-1">{subtitle}</p>
            )}

            <div className="mt-6 flex flex-col">{children}</div>
          </section>
        </div>

        {asideItems !== undefined && <AuthAside items={asideItems} />}
      </div>
    </div>
  );
}
