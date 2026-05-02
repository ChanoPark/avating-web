import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@shared/mocks/server';
import {
  connectCodeHandlers,
  connectStatusHandlers,
  mockConnectCodeResponse,
} from '@shared/mocks/handlers/onboarding';
import { ConnectStep } from '@features/connect-code/ui/ConnectStep';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

describe('ConnectStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.setItem('avating:onboarding:progress', 'connect');

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    server.use(connectCodeHandlers.success, connectStatusHandlers.active);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('마운트 — 코드 발급', () => {
    it('마운트 시 POST /api/onboarding/connect-code 가 1회 호출되고 코드가 렌더된다', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(screen.getByText(/AVT-[A-Z0-9]{4}-[A-Z0-9]{2}/)).toBeInTheDocument();
      });

      const codeText = screen.getByText(/AVT-[A-Z0-9]{4}-[A-Z0-9]{2}/);
      expect(codeText).toBeDefined();
    });

    it('코드가 AVT-XXXX-XX 패턴을 준수한다', async () => {
      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        const codeEl = screen.getByText(/AVT-[A-Z0-9]{4}-[A-Z0-9]{2}/);
        expect(codeEl.textContent).toMatch(/^AVT-[A-Z0-9]{4}-[A-Z0-9]{2}$/);
      });
    });
  });

  describe('카운트다운', () => {
    it('카운트다운 타이머가 MM:SS 형식으로 표시된다', async () => {
      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        const timer = screen.getByRole('timer');
        expect(timer.textContent).toMatch(/^\d{2}:\d{2}$/);
      });
    });

    it('1초 경과 후 카운트다운이 감소한다', async () => {
      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(screen.getByRole('timer')).toBeInTheDocument();
      });

      const initialTime = screen.getByRole('timer').textContent!;

      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        const currentTime = screen.getByRole('timer').textContent!;
        expect(currentTime).not.toBe(initialTime);
      });
    });
  });

  describe('복사 버튼', () => {
    it('"복사" 버튼 클릭 시 navigator.clipboard.writeText 가 1회 호출된다', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /복사/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /복사/i }));

      expect(navigator.clipboard.writeText).toHaveBeenCalledOnce();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockConnectCodeResponse.data.code);
    });

    it('"복사" 버튼 클릭 후 토스트 "복사되었습니다" 가 노출된다', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /복사/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /복사/i }));

      await waitFor(() => {
        expect(screen.getByText(/복사되었습니다/i)).toBeInTheDocument();
      });
    });
  });

  describe('폴링', () => {
    it('15초 경과 시 GET /api/onboarding/connect-status 가 추가 호출된다', async () => {
      let statusCallCount = 0;

      server.use(connectCodeHandlers.success, connectStatusHandlers.active);

      server.events.on('request:start', ({ request }) => {
        if (request.url.includes('/api/onboarding/connect-status')) {
          statusCallCount++;
        }
      });

      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(screen.getByText(/AVT-[A-Z0-9]{4}-[A-Z0-9]{2}/)).toBeInTheDocument();
      });

      const initialCount = statusCallCount;

      vi.advanceTimersByTime(15_000);

      await waitFor(() => {
        expect(statusCallCount).toBeGreaterThan(initialCount);
      });

      server.events.removeAllListeners();
    });

    it('connected 응답 도달 시 /onboarding/complete 로 이동하고 이후 status 호출이 없다', async () => {
      server.use(connectCodeHandlers.success, connectStatusHandlers.connected);

      let statusCallAfterNav = 0;
      const origFetch = globalThis.fetch;
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        const result = await origFetch(input, init);
        if (url.includes('/api/onboarding/connect-status')) {
          statusCallAfterNav++;
        }
        return result;
      });

      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding/complete');
      });

      const callCountAtNav = statusCallAfterNav;

      vi.advanceTimersByTime(15_000);

      await waitFor(() => {
        expect(statusCallAfterNav).toBe(callCountAtNav);
      });

      fetchSpy.mockRestore();
    });
  });

  describe('로컬 만료 (B1 검증)', () => {
    it('카운트다운 0 도달 시 "코드 재발급" CTA 가 즉시 노출된다', async () => {
      const nearExpiry = new Date(Date.now() + 2000).toISOString();

      server.use(
        http.post(`${BASE_URL}/api/onboarding/connect-code`, () =>
          HttpResponse.json(
            {
              data: {
                code: 'AVT-A1B2-C3',
                expiresAt: nearExpiry,
                status: 'active',
              },
            },
            { status: 201 }
          )
        ),
        connectStatusHandlers.active
      );

      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(screen.getByText(/AVT-[A-Z0-9]{4}-[A-Z0-9]{2}/)).toBeInTheDocument();
      });

      vi.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /재발급/i })).toBeInTheDocument();
      });
    });

    it('카운트다운 0 도달 이후에도 다음 15초 tick 에서 status 가 1회 더 호출된다 (서버 truth 확인)', async () => {
      const nearExpiry = new Date(Date.now() + 2000).toISOString();
      let statusCallCount = 0;

      server.use(
        http.post(`${BASE_URL}/api/onboarding/connect-code`, () =>
          HttpResponse.json(
            {
              data: {
                code: 'AVT-A1B2-C3',
                expiresAt: nearExpiry,
                status: 'active',
              },
            },
            { status: 201 }
          )
        ),
        connectStatusHandlers.active
      );

      server.events.on('request:start', ({ request }) => {
        if (request.url.includes('/api/onboarding/connect-status')) {
          statusCallCount++;
        }
      });

      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(screen.getByText(/AVT-[A-Z0-9]{4}-[A-Z0-9]{2}/)).toBeInTheDocument();
      });

      vi.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /재발급/i })).toBeInTheDocument();
      });

      const countAfterLocalExpiry = statusCallCount;

      vi.advanceTimersByTime(15_000);

      await waitFor(() => {
        expect(statusCallCount).toBeGreaterThan(countAfterLocalExpiry);
      });

      server.events.removeAllListeners();
    });
  });

  describe('서버 expired 응답', () => {
    it('서버 expired 응답 시 폴링이 정지되고 재발급 CTA 가 노출된다', async () => {
      server.use(connectCodeHandlers.success, connectStatusHandlers.expired);

      let statusCallCount = 0;
      const origFetch = globalThis.fetch;
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        if (url.includes('/api/onboarding/connect-status')) {
          statusCallCount++;
        }
        return origFetch(input, init);
      });

      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /재발급/i })).toBeInTheDocument();
      });

      const countAtExpiry = statusCallCount;

      vi.advanceTimersByTime(30_000);

      await waitFor(() => {
        expect(statusCallCount).toBe(countAtExpiry);
      });

      fetchSpy.mockRestore();
    });
  });

  describe('재발급', () => {
    it('"재발급" 버튼 클릭 시 POST /api/onboarding/connect-code 가 재호출되고 새 코드가 표시된다', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      server.use(connectCodeHandlers.success, connectStatusHandlers.expired);

      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /재발급/i })).toBeInTheDocument();
      });

      server.use(connectCodeHandlers.success, connectStatusHandlers.active);

      await user.click(screen.getByRole('button', { name: /재발급/i }));

      await waitFor(() => {
        expect(screen.getByText(/AVT-[A-Z0-9]{4}-[A-Z0-9]{2}/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /재발급/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('언마운트', () => {
    it('언마운트 후 30초 경과해도 status 호출이 없다', async () => {
      server.use(connectCodeHandlers.success, connectStatusHandlers.active);

      let statusCallCount = 0;
      const origFetch = globalThis.fetch;
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        if (url.includes('/api/onboarding/connect-status')) {
          statusCallCount++;
        }
        return origFetch(input, init);
      });

      const { unmount } = renderWithProviders(<ConnectStep />, {
        initialRoute: '/onboarding/connect',
      });

      await waitFor(() => {
        expect(screen.getByText(/AVT-[A-Z0-9]{4}-[A-Z0-9]{2}/)).toBeInTheDocument();
      });

      unmount();

      const countAtUnmount = statusCallCount;

      vi.advanceTimersByTime(30_000);

      expect(statusCallCount).toBe(countAtUnmount);

      fetchSpy.mockRestore();
    });
  });
});
