import { Link, Outlet, useLocation } from 'react-router';
import { cn } from '@shared/lib/cn';

const TABS = [
  { label: '목록', to: '/sim' },
  { label: '채팅', to: '/sim/chat' },
];

function SimulationTabs() {
  const { pathname } = useLocation();
  const current = pathname === '/sim' ? '/sim' : '/sim/chat';

  return (
    <nav
      aria-label="시뮬레이션 보기"
      className="border-subtle flex shrink-0 gap-5 border-b px-7 pt-4"
    >
      {TABS.map(({ label, to }) => {
        const active = to === current;
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'text-body ease-standard relative pb-3 transition-colors duration-[var(--dur-fast)]',
              active
                ? 'text-ink after:bg-ink font-semibold after:absolute after:inset-x-0 after:-bottom-px after:h-0.5'
                : 'text-secondary hover:text-primary font-medium'
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

// 목록과 채팅이 같은 자리의 탭을 쓰도록 둘을 한 틀에 담는다. 채팅이 높이를 꽉 채워야 해서 셸 여백을 걷는다.
export function SimulationLayout() {
  return (
    <section data-shell-flush className="flex min-h-0 flex-1 flex-col">
      <SimulationTabs />
      <Outlet />
    </section>
  );
}
