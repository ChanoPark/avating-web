import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { server } from '@shared/mocks/server';
import { primaryAvatarHandlers } from '@shared/mocks/handlers/primaryAvatar';
import { avatarKeys } from '@entities/avatar';
import { useAuthStore } from '@entities/auth/store';
import { renderWithProviders } from '@/test/renderWithProviders';
import { ServiceIntroPage } from '../ServiceIntroPage';

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

// 로그인 상태에서 대표 아바타를 조회하므로 QueryClient 가 필요하다.
function renderPage() {
  return renderWithProviders(<ServiceIntroPage />);
}

function authenticate() {
  useAuthStore.setState({
    status: 'authenticated',
    accessToken: 'a',
    expiresAt: Date.now() + 1000,
  });
}

/** 대표 아바타 조회가 끝날 때까지 기다린다 — 판정 전 클릭은 목적지가 다르다. */
async function waitForCompletionResolved(queryClient: {
  getQueryState: (key: readonly unknown[]) => { status: string } | undefined;
}) {
  await waitFor(() => {
    expect(queryClient.getQueryState(avatarKeys.primary())?.status).not.toBe('pending');
  });
}

describe('ServiceIntroPage', () => {
  describe('마케팅 상단 바', () => {
    it('Avating 로고가 헤더에 렌더된다', () => {
      renderPage();
      expect(screen.getByRole('banner')).toHaveTextContent('Avating');
    });

    it('내비 3항목(서비스 소개·작동 방식·요금)이 렌더된다', () => {
      renderPage();
      const banner = screen.getByRole('banner');
      expect(within(banner).getByText('서비스 소개')).toBeInTheDocument();
      expect(within(banner).getByText('작동 방식')).toBeInTheDocument();
      expect(within(banner).getByText('요금')).toBeInTheDocument();
    });

    it('활성 내비 항목만 text-ink 이고 나머지는 text-ink-mute 다', () => {
      renderPage();
      const banner = screen.getByRole('banner');
      expect(within(banner).getByText('서비스 소개')).toHaveClass('text-ink');
      expect(within(banner).getByText('작동 방식')).toHaveClass('text-ink-mute');
      expect(within(banner).getByText('요금')).toHaveClass('text-ink-mute');
    });

    it('상단 바에 "로그인" ghost 와 "회원가입" secondary 가 함께 있다', () => {
      renderPage();
      const banner = screen.getByRole('banner');
      expect(within(banner).getByRole('button', { name: '로그인' })).toBeInTheDocument();
      expect(within(banner).getByRole('button', { name: '회원가입' })).toBeInTheDocument();
    });

    it('상단 바에 채워진 파란 CTA 는 없다 (밴드당 1개 규칙 — 히어로가 갖는다)', () => {
      renderPage();
      const banner = screen.getByRole('banner');
      expect(within(banner).getByRole('button', { name: '로그인' })).not.toHaveClass('bg-primary');
      expect(within(banner).getByRole('button', { name: '회원가입' })).not.toHaveClass(
        'bg-primary'
      );
    });

    it('헤더 "로그인" 버튼 클릭 시 /login 으로 이동한다', async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(within(screen.getByRole('banner')).getByRole('button', { name: '로그인' }));
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('헤더 "회원가입" 버튼 클릭 시 /signup 으로 이동한다', async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(
        within(screen.getByRole('banner')).getByRole('button', { name: '회원가입' })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/signup');
    });
  });

  describe('히어로', () => {
    it('BETA 배지가 테두리 없는 틴트 pill 로 렌더된다', () => {
      renderPage();
      const badge = screen.getByText(/BETA · 인터랙티브 소셜 게임/);
      expect(badge).toHaveClass('bg-primary-wash');
      expect(badge).toHaveClass('text-primary-press');
      // 틴트 채움 + 같은 색 테두리 금지 (v2.1)
      expect(badge.className).not.toMatch(/border-primary/);
    });

    it('메인 헤드카피가 display-lg 로 렌더되고 weight 를 덮어쓰지 않는다', () => {
      renderPage();
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/귀찮은 밀당은 아바타가/);
      expect(heading).toHaveTextContent(/결정은 당신이/);
      expect(heading).toHaveClass('text-display-lg');
      // display 티어의 weight 300 은 `--text-display-lg--font-weight` 가 정한다.
      // font-* 유틸을 덧붙이면 `--tw-font-weight` 가 그 값을 덮어써 시그니처가 깨진다.
      expect(heading.className).not.toMatch(/\bfont-(thin|light|normal|medium|semibold|bold)\b/);
    });

    it('서브카피가 정본 문안으로 렌더된다', () => {
      renderPage();
      expect(screen.getByText(/나를 닮은 AI 아바타가 먼저 대화를 나눕니다/)).toBeInTheDocument();
    });

    it('히어로 CTA 는 "무료로 시작하기" primary 와 "작동 방식 보기" ghost 다', () => {
      renderPage();
      const cta = screen.getByRole('button', { name: '무료로 시작하기' });
      expect(cta).toHaveClass('bg-primary');
      expect(screen.getByRole('button', { name: '작동 방식 보기' })).not.toHaveClass('bg-primary');
    });

    it('"무료로 시작하기" 버튼 클릭 시 /signup 으로 이동한다', async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole('button', { name: '무료로 시작하기' }));
      expect(mockNavigate).toHaveBeenCalledWith('/signup');
    });

    it('"작동 방식 보기" 는 라우트 이동 없이 HOW IT WORKS 섹션으로만 스크롤한다', async () => {
      // jsdom 은 scrollIntoView 를 구현하지 않는다 (실제 브라우저에는 항상 존재).
      const scrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoView;
      const user = userEvent.setup();
      renderPage();
      mockNavigate.mockClear();

      try {
        await user.click(screen.getByRole('button', { name: '작동 방식 보기' }));

        expect(mockNavigate).not.toHaveBeenCalled();
        expect(scrollIntoView).toHaveBeenCalledOnce();
        expect(document.getElementById('how-it-works')).not.toBeNull();
      } finally {
        // @ts-expect-error — jsdom 원상복구: 원래 정의되지 않은 프로퍼티다.
        delete Element.prototype.scrollIntoView;
      }
    });
  });

  describe('HOW IT WORKS', () => {
    it('eyebrow 와 3단계 카드가 정본 문안으로 렌더된다', () => {
      renderPage();
      expect(screen.getByText('HOW IT WORKS')).toBeInTheDocument();
      expect(screen.getByText('아바타를 만들어요')).toBeInTheDocument();
      expect(screen.getByText('아바타끼리 대화해요')).toBeInTheDocument();
      expect(screen.getByText('호감도가 넘으면 연결')).toBeInTheDocument();
    });

    it('단계 번호 01·02·03 이 tabular-nums 로 렌더된다', () => {
      renderPage();
      for (const num of ['01', '02', '03']) {
        expect(screen.getByText(num)).toHaveClass('tnum');
      }
    });
  });

  describe('푸터', () => {
    it('이용약관·개인정보·문의가 렌더된다', () => {
      renderPage();
      const footer = screen.getByRole('contentinfo');
      expect(within(footer).getByText('이용약관')).toBeInTheDocument();
      expect(within(footer).getByText('개인정보')).toBeInTheDocument();
      expect(within(footer).getByText('문의')).toBeInTheDocument();
    });

    // 사용자 지시로 푸터 로고를 제거했다 (상단 바 로고와 중복). 정본
    // wf-s1-entry.jsx:34 은 좌측에 `<Logo size={16} />` 을 두므로 의도적 divergence 다.
    it('로고를 렌더하지 않는다', () => {
      renderPage();
      const footer = screen.getByRole('contentinfo');
      expect(footer).not.toHaveTextContent('Avating');
    });
  });

  // 로그인한 사용자에게 가입·로그인 폼을 다시 들이밀면 세션이 풀린 것처럼 읽힌다.
  // 2026-08-18 사용자 지시로, 로그인 상태의 헤더는 두 버튼 대신 "시작하기" 하나만 둔다
  // (정본 wf-kit.jsx:187 MktTop 에는 로그인 상태 분기가 없다 — 의도된 divergence).
  describe('로그인 상태 진입 CTA', () => {
    beforeEach(() => {
      useAuthStore.setState({ status: 'anonymous', accessToken: null, expiresAt: null });
    });

    it('비로그인이면 헤더에 로그인·회원가입이 그대로 있고 "시작하기" 는 없다', () => {
      renderPage();
      const banner = screen.getByRole('banner');

      expect(within(banner).getByRole('button', { name: '로그인' })).toBeInTheDocument();
      expect(within(banner).getByRole('button', { name: '회원가입' })).toBeInTheDocument();
      expect(within(banner).queryByRole('button', { name: '시작하기' })).not.toBeInTheDocument();
    });

    // 비로그인 방문자에게 조회가 나가면 토큰 없이 401 을 받아 refresh 인터셉터가 돌고,
    // 랜딩을 보기만 해도 세션이 정리되는 부작용이 생긴다.
    it('비로그인이면 대표 아바타를 조회하지 않는다', () => {
      const { queryClient } = renderPage();

      // 꺼진 쿼리도 캐시에는 올라가므로 "요청이 나갔는가" 로 본다 — `idle` 이면 안 나간 것이다.
      expect(queryClient.getQueryState(avatarKeys.primary())?.fetchStatus).toBe('idle');
    });

    it('로그인 상태면 헤더가 "시작하기" 한 개로 바뀐다', () => {
      authenticate();
      renderPage();
      const banner = screen.getByRole('banner');

      expect(within(banner).getByRole('button', { name: '시작하기' })).toBeInTheDocument();
      expect(within(banner).queryByRole('button', { name: '로그인' })).not.toBeInTheDocument();
      expect(within(banner).queryByRole('button', { name: '회원가입' })).not.toBeInTheDocument();
    });

    it('"시작하기" 도 채워진 파란 CTA 가 아니다 (밴드당 1개 규칙 — 히어로가 갖는다)', () => {
      authenticate();
      renderPage();

      expect(
        within(screen.getByRole('banner')).getByRole('button', { name: '시작하기' })
      ).not.toHaveClass('bg-primary');
    });

    it('온보딩을 마쳤으면(대표 아바타 보유) 대시보드로 간다', async () => {
      authenticate();
      server.use(primaryAvatarHandlers.success);
      const user = userEvent.setup();
      const { queryClient } = renderPage();
      await waitForCompletionResolved(queryClient);

      await user.click(
        within(screen.getByRole('banner')).getByRole('button', { name: '시작하기' })
      );

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('온보딩이 안 끝났으면(대표 아바타 없음) 아바타 생성 온보딩으로 간다', async () => {
      authenticate();
      server.use(primaryAvatarHandlers.none);
      const user = userEvent.setup();
      const { queryClient } = renderPage();
      await waitForCompletionResolved(queryClient);

      await user.click(
        within(screen.getByRole('banner')).getByRole('button', { name: '시작하기' })
      );

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
    });

    // "확인해보니 없다"(404) 와 "확인을 못 했다"(500) 는 다르다. 판정 실패만으로 온보딩에
    // 밀어넣으면 서버가 잠깐 흔들릴 때마다 완료한 회원이 온보딩으로 되돌아간다.
    it('판정에 실패하면 온보딩이 아니라 대시보드로 간다', async () => {
      authenticate();
      server.use(primaryAvatarHandlers.serverError);
      const user = userEvent.setup();
      const { queryClient } = renderPage();
      await waitForCompletionResolved(queryClient);

      await user.click(
        within(screen.getByRole('banner')).getByRole('button', { name: '시작하기' })
      );

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('비로그인이면 "무료로 시작하기" 가 가입으로 간다', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: /무료로 시작하기/ }));

      expect(mockNavigate).toHaveBeenCalledWith('/signup');
    });

    // 같은 화면의 두 진입 버튼이 서로 다른 곳으로 가면 안 된다 — 히어로 CTA 도 같은 판정을 쓴다.
    it('로그인 상태에서 히어로 CTA 도 온보딩 판정을 거친다', async () => {
      authenticate();
      server.use(primaryAvatarHandlers.none);
      const user = userEvent.setup();
      const { queryClient } = renderPage();
      await waitForCompletionResolved(queryClient);

      await user.click(screen.getByRole('button', { name: /무료로 시작하기/ }));

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
    });
  });

  describe('v2 금지 규칙', () => {
    it('문자 글리프(→ ✕ ✓ ◇)를 쓰지 않는다', () => {
      const { container } = renderPage();
      expect(container.textContent ?? '').not.toMatch(/[→✕✓◇▲]/);
    });

    it('본문에 text-ink-faint 를 쓰지 않는다', () => {
      const { container } = renderPage();
      expect(container.querySelectorAll('.text-ink-faint')).toHaveLength(0);
    });
  });
});
