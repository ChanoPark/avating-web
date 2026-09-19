import type { ReactNode } from 'react';

/**
 * 가입·로그인 공용 셸 — 상단 바 아래 남은 높이 가운데에 폼 카드 하나만 둔다.
 * 정본의 우측 안내 페인은 사용자 지시(2026-09-19)로 두 화면 모두에서 걷어냈다.
 */

type AuthLayoutProps = {
  /** 폼 카드 제목의 id — 폼 섹션과 aria-labelledby 로 연결된다. */
  headingId: string;
  title: string;
  subtitle?: string;
  /** 화면 맨 위에 붙는 상단 바 — 폼은 그 아래 남은 높이를 채운다. */
  header: ReactNode;
  children: ReactNode;
};

// .cx-auth__mark — 마크가 아니라 워드마크다. 제품에 심볼이 없어서 여기서 지어내지 않는다.
function BrandWordmark() {
  return <div className="text-ink text-title font-bold tracking-[-0.03em]">Avating</div>;
}

export function AuthLayout({ headingId, title, subtitle, header, children }: AuthLayoutProps) {
  return (
    <div className="bg-canvas text-primary flex min-h-screen flex-col">
      {header}

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
    </div>
  );
}
