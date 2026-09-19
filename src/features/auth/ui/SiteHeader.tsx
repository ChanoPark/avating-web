import { useNavigate } from 'react-router';
import { Button } from '@shared/ui/Button';
import { cn } from '@shared/lib/cn';

// 랜딩(`/`)의 밴드 id — 내비가 가리키는 곳이라 헤더가 소유하고 랜딩이 가져다 붙인다.
export const SERVICE_INTRO_HERO_ID = 'service-intro-hero';
export const HOW_IT_WORKS_ID = 'how-it-works';

// 요금 화면은 아직 없으므로 죽은 링크가 되지 않도록 버튼이 아닌 비대화형 텍스트로 둔다.
type NavItem = { label: string; targetId?: string };
const NAV_ITEMS: readonly NavItem[] = [
  { label: '서비스 소개', targetId: SERVICE_INTRO_HERO_ID },
  { label: '작동 방식', targetId: HOW_IT_WORKS_ID },
  { label: '요금' },
];

// 정본 `.ent-word` = `.hf-word` — 20px / 700 / -0.03em. 앱 안 워드마크 5벌이 전부 같은 값이다.
function Logo() {
  return (
    <span className="flex shrink-0 items-center gap-2">
      <span aria-hidden="true" className="bg-action rounded-chip size-4.5 shrink-0" />
      <span className="text-ink text-title font-bold tracking-[-0.03em]">Avating</span>
    </span>
  );
}

type SiteHeaderProps = {
  /** 내비 클릭 — 랜딩은 같은 화면 밴드로 스크롤하고, 다른 화면은 랜딩으로 보낸다. */
  onNavigate: (targetId: string) => void;
  /** 있으면 로그인·회원가입 대신 "시작하기" 하나로 접는다 (로그인 상태). */
  onStart?: (() => void) | undefined;
};

export function SiteHeader({ onNavigate, onStart }: SiteHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="border-subtle flex h-[68px] items-center justify-between gap-4 border-b px-6 lg:px-16">
      <Logo />

      <nav
        aria-label="서비스 소개 내비게이션"
        className="text-caption hidden items-center gap-[18px] lg:flex"
      >
        {NAV_ITEMS.map((item, index) => {
          const tone = index === 0 ? 'text-primary' : 'text-secondary';
          if (item.targetId === undefined) {
            return (
              <span key={item.label} className={tone}>
                {item.label}
              </span>
            );
          }
          const targetId = item.targetId;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                onNavigate(targetId);
              }}
              className={cn(
                tone,
                'hover:text-primary cursor-pointer transition-colors duration-[var(--dur-fast)]'
              )}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* 정본에는 없는 로그인 상태 분기다 (의도된 divergence). */}
      <div className="flex items-center gap-2">
        {onStart !== undefined ? (
          <Button variant="secondary" size="sm" onClick={onStart}>
            시작하기
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void navigate('/login');
              }}
            >
              로그인
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void navigate('/signup');
              }}
            >
              회원가입
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
