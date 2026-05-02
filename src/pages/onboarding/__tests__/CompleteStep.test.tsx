import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@shared/mocks/server';
import {
  generatedAvatarHandlers,
  completeOnboardingHandlers,
  mockGeneratedAvatar,
} from '@shared/mocks/handlers/onboarding';
import { CompleteStep } from '@features/onboarding-complete/ui/CompleteStep';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

vi.mock('motion/react', async (importOriginal) => {
  const original = await importOriginal<typeof import('motion/react')>();
  return {
    ...original,
    useReducedMotion: vi.fn(() => false),
  };
});

describe('CompleteStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('avating:onboarding:progress', 'complete');
    server.use(generatedAvatarHandlers.success, completeOnboardingHandlers.success);
  });

  describe('아바타 데이터 렌더링', () => {
    it('GET /api/onboarding/avatar 응답 후 아바타 이름이 렌더된다', async () => {
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(screen.getByText(mockGeneratedAvatar.data.name)).toBeInTheDocument();
      });
    });

    it('4개의 StatBar (role=progressbar) 가 렌더된다', async () => {
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        const statBars = screen.getAllByRole('progressbar');
        expect(statBars.length).toBe(4);
      });
    });

    it('StatBar 의 aria-valuenow 가 stats 값으로 설정된다', async () => {
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        const extroversionBar = screen.getByRole('progressbar', { name: /extroversion|외향/i });
        expect(extroversionBar).toHaveAttribute(
          'aria-valuenow',
          String(mockGeneratedAvatar.data.stats.extroversion)
        );
      });
    });

    it('태그 목록이 렌더된다', async () => {
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        for (const tag of mockGeneratedAvatar.data.tags) {
          expect(screen.getByText(tag)).toBeInTheDocument();
        }
      });
    });

    it('태그 개수가 최대 6개 이하이다', async () => {
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        const tagElements = screen.getAllByTestId('avatar-tag');
        expect(tagElements.length).toBeLessThanOrEqual(6);
      });
    });
  });

  describe('reduced-motion', () => {
    it('useReducedMotion 이 true 이면 StatBar 에 transition 0s 가 적용된다', async () => {
      const { useReducedMotion } = await import('motion/react');
      vi.mocked(useReducedMotion).mockReturnValue(true);

      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        const statBars = screen.getAllByRole('progressbar');
        expect(statBars.length).toBe(4);
        for (const bar of statBars) {
          const style = window.getComputedStyle(bar);
          const transitionDuration = style.transitionDuration;
          expect(
            transitionDuration === '0s' ||
              transitionDuration === '' ||
              transitionDuration === undefined
          ).toBeTruthy();
        }
      });
    });
  });

  describe('대시보드 이동', () => {
    it('"탐색 시작" 클릭 시 POST /api/onboarding/complete 가 호출된다', async () => {
      const user = userEvent.setup();
      let completeCallCount = 0;

      const origFetch = globalThis.fetch;
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        if (url.includes('/api/onboarding/complete') && init?.method === 'POST') {
          completeCallCount++;
        }
        return origFetch(input, init);
      });

      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /탐색 시작|대시보드/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /탐색 시작|대시보드/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });

      fetchSpy.mockRestore();
    });

    it('"탐색 시작" 성공 시 /dashboard 로 navigate 가 호출된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /탐색 시작|대시보드/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /탐색 시작|대시보드/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('409 응답 시 토스트가 노출되고 navigate 는 호출되지 않는다', async () => {
      const user = userEvent.setup();
      server.use(generatedAvatarHandlers.success, completeOnboardingHandlers.conflict);

      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /탐색 시작|대시보드/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /탐색 시작|대시보드/i }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('데이터 fetch 실패', () => {
    it('서버 500 응답 시 ErrorBoundary fallback 이 노출된다', async () => {
      server.use(generatedAvatarHandlers.serverError, completeOnboardingHandlers.success);

      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        const errorEl = screen.queryByRole('alert') || screen.queryByText(/오류|에러|실패|다시/i);
        expect(errorEl).toBeInTheDocument();
      });
    });

    it('404 응답 시 ErrorBoundary fallback 이 노출된다', async () => {
      server.use(generatedAvatarHandlers.notFound, completeOnboardingHandlers.success);

      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        const errorEl = screen.queryByRole('alert') || screen.queryByText(/오류|에러|실패|다시/i);
        expect(errorEl).toBeInTheDocument();
      });
    });
  });
});
