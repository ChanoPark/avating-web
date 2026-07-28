import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi } from 'vitest';
import { ServiceIntroPage } from '../ServiceIntroPage';

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ServiceIntroPage />
    </MemoryRouter>
  );
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
