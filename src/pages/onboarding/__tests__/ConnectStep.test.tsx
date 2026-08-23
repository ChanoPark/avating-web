import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { queryClientWithPrimaryAvatar, SAMPLE_PRIMARY_AVATAR } from '@/test/onboardingCompletion';
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
    localStorage.setItem('avating:onboarding:progress', 'creating');

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    server.use(connectCodeHandlers.success, connectStatusHandlers.active);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('진입 가드', () => {
    it('progress 가 welcome 이면 /onboarding/welcome 으로 redirect 한다', async () => {
      localStorage.setItem('avating:onboarding:progress', 'welcome');
      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding/welcome', { replace: true });
      });
    });

    it('progress 가 complete 이고 대표 아바타가 있으면 /onboarding/complete 로 redirect 한다', async () => {
      localStorage.setItem('avating:onboarding:progress', 'complete');
      renderWithProviders(<ConnectStep />, {
        initialRoute: '/onboarding/connect',
        queryClient: queryClientWithPrimaryAvatar(SAMPLE_PRIMARY_AVATAR),
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding/complete', { replace: true });
      });
    });

    // 진행 기록의 complete 는 완료를 보장하지 않는다. 여기서 확인 화면으로 되돌리면
    // 대표 아바타가 없는 확인 화면이 다시 이 화면으로 보내 왕복이 된다.
    it('progress 가 complete 여도 대표 아바타가 없으면 연동 화면을 이어서 보여준다', async () => {
      localStorage.setItem('avating:onboarding:progress', 'complete');
      renderWithProviders(<ConnectStep />, {
        initialRoute: '/onboarding/connect',
        queryClient: queryClientWithPrimaryAvatar(null),
      });

      await waitFor(() => {
        expect(screen.getByText(/AVT-[A-Z0-9]{4}-[A-Z0-9]{2}/)).toBeInTheDocument();
      });
      expect(mockNavigate).not.toHaveBeenCalledWith('/onboarding/complete', { replace: true });
    });

    // v2.6: 방법 선택 화면이 사라져 레거시 'method' 는 creating 으로 마이그레이션된다 —
    // 되돌릴 곳이 없으므로 그대로 코드 발급 화면을 보여준다.
    it('레거시 method 기록이면 redirect 없이 코드 발급 화면을 보여준다', async () => {
      localStorage.setItem('avating:onboarding:progress', 'method');
      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(screen.getByText(/AVT-[A-Z0-9]{4}-[A-Z0-9]{2}/)).toBeInTheDocument();
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('마운트 — 코드 발급', () => {
    it('마운트 시 POST /api/persona/connect/code 가 1회 호출되고 코드가 렌더된다', async () => {
      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(screen.getByText(/AVT-[A-Z0-9]{4}-[A-Z0-9]{2}/)).toBeInTheDocument();
      });

      const codeText = screen.getByText(/AVT-[A-Z0-9]{4}-[A-Z0-9]{2}/);
      expect(codeText).toBeDefined();
    });

    // 실서버 QA S7 회귀 — dev(StrictMode)에서 201 을 받고도 "발급하는 중..." 에 멈췄다.
    // issuedRef 가드가 두 번째 effect 를 막는 사이 구독이 끊긴 것이 원인이었다.
    it('StrictMode 이중 마운트에서도 코드를 1회만 발급하고 화면에 렌더한다', async () => {
      let issueCallCount = 0;
      server.use(
        http.post(`${BASE_URL}/api/persona/connect/code`, () => {
          issueCallCount++;
          return HttpResponse.json(mockConnectCodeResponse, { status: 201 });
        }),
        connectStatusHandlers.active
      );

      renderWithProviders(<ConnectStep />, {
        initialRoute: '/onboarding/connect',
        strictMode: true,
      });

      await waitFor(() => {
        expect(screen.getByText(/AVT-[A-Z0-9]{4}-[A-Z0-9]{2}/)).toBeInTheDocument();
      });

      expect(screen.queryByText(/연결 코드를 발급하는 중/)).not.toBeInTheDocument();
      expect(issueCallCount).toBe(1);
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
        // '유효 시간 MM:SS 남음' — MM:SS 포함 여부로 검증
        expect(timer.textContent).toMatch(/\d{2}:\d{2}/);
      });
    });

    it('1초 경과 후 카운트다운이 감소한다', async () => {
      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(screen.getByRole('timer')).toBeInTheDocument();
      });

      const initialTime = screen.getByRole('timer').textContent!;

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      await waitFor(() => {
        const currentTime = screen.getByRole('timer').textContent!;
        expect(currentTime).not.toBe(initialTime);
      });
    });
  });

  describe('복사 버튼', () => {
    it('"복사" 버튼 클릭 시 navigator.clipboard.writeText 가 1회 호출된다', async () => {
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
        writeToClipboard: false,
      });
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        writable: true,
        value: { writeText },
      });
      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /복사/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /복사/i }));

      expect(writeText).toHaveBeenCalledOnce();
      expect(writeText).toHaveBeenCalledWith(mockConnectCodeResponse.data.connectCode);
    });

    it('"복사" 버튼 클릭 후 토스트 "복사되었습니다" 가 노출된다', async () => {
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
        writeToClipboard: false,
      });
      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /복사/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /복사/i }));

      await waitFor(() => {
        expect(screen.getByText(/복사되었습니다/i)).toBeInTheDocument();
      });
    });

    it('클립보드 API 실패 시 에러 토스트 "복사를 사용할 수 없는 환경입니다" 가 노출된다', async () => {
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
        writeToClipboard: false,
      });
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        writable: true,
        value: { writeText: vi.fn().mockRejectedValue(new Error('not allowed')) },
      });
      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /복사/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /복사/i }));

      await waitFor(() => {
        expect(screen.getByText(/복사를 사용할 수 없는 환경입니다/i)).toBeInTheDocument();
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

      await act(async () => {
        await vi.advanceTimersByTimeAsync(15_000);
      });

      await waitFor(() => {
        expect(statusCallCount).toBeGreaterThan(initialCount);
      });

      server.events.removeAllListeners();
    });

    it('connected 응답 도달 시 /onboarding/complete 로 이동하고 이후 status 호출이 없다', async () => {
      let statusCallCount = 0;
      server.use(
        connectCodeHandlers.success,
        http.get(`${BASE_URL}/api/onboarding/connect-status`, () => {
          statusCallCount++;
          return HttpResponse.json({ data: { status: 'connected' } });
        })
      );

      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding/complete');
      });

      const callCountAtNav = statusCallCount;

      await act(async () => {
        await vi.advanceTimersByTimeAsync(15_000);
      });

      await waitFor(() => {
        expect(statusCallCount).toBe(callCountAtNav);
      });
    });
  });

  describe('로컬 만료 (B1 검증)', () => {
    it('카운트다운 0 도달 시 "코드 재발급" CTA 가 즉시 노출된다', async () => {
      const nearExpiry = new Date(Date.now() + 2000).toISOString();

      server.use(
        http.post(`${BASE_URL}/api/persona/connect/code`, () =>
          HttpResponse.json(
            {
              data: {
                connectCode: 'AVT-A1B2-C3',
                expiresIn: 2,
                expiresAt: nearExpiry,
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

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /재발급/i })).toBeInTheDocument();
      });
    });

    it('카운트다운 0 도달 이후에도 다음 15초 tick 에서 status 가 1회 더 호출된다 (서버 truth 확인)', async () => {
      const nearExpiry = new Date(Date.now() + 2000).toISOString();
      let statusCallCount = 0;

      server.use(
        http.post(`${BASE_URL}/api/persona/connect/code`, () =>
          HttpResponse.json(
            {
              data: {
                connectCode: 'AVT-A1B2-C3',
                expiresIn: 2,
                expiresAt: nearExpiry,
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

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /재발급/i })).toBeInTheDocument();
      });

      const countAfterLocalExpiry = statusCallCount;

      await act(async () => {
        await vi.advanceTimersByTimeAsync(15_000);
      });

      await waitFor(() => {
        expect(statusCallCount).toBeGreaterThan(countAfterLocalExpiry);
      });

      server.events.removeAllListeners();
    });
  });

  describe('서버 expired 응답', () => {
    it('서버 expired 응답 시 폴링이 정지되고 재발급 CTA 가 노출된다', async () => {
      let statusCallCount = 0;
      server.use(
        connectCodeHandlers.success,
        http.get(`${BASE_URL}/api/onboarding/connect-status`, () => {
          statusCallCount++;
          return HttpResponse.json({ data: { status: 'expired' } });
        })
      );

      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /재발급/i })).toBeInTheDocument();
      });

      const countAtExpiry = statusCallCount;

      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000);
      });

      await waitFor(() => {
        expect(statusCallCount).toBe(countAtExpiry);
      });
    });
  });

  describe('재발급', () => {
    it('"재발급" 버튼 클릭 시 POST /api/persona/connect/code 가 재호출되고 새 코드가 표시된다', async () => {
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
        writeToClipboard: false,
      });
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

    // 재발급 중에 만료된 옛 코드를 그대로 두면 사용자가 죽은 코드를 붙여넣게 된다.
    it('재발급 요청이 진행되는 동안 옛 코드 대신 발급 중 상태를 보여준다', async () => {
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
        writeToClipboard: false,
      });
      server.use(connectCodeHandlers.success, connectStatusHandlers.expired);

      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /재발급/i })).toBeInTheDocument();
      });

      server.use(
        http.post(`${BASE_URL}/api/persona/connect/code`, async () => {
          await delay(200);
          return HttpResponse.json(mockConnectCodeResponse, { status: 201 });
        }),
        connectStatusHandlers.active
      );

      await user.click(screen.getByRole('button', { name: /재발급/i }));

      await waitFor(() => {
        expect(screen.getByText(/연결 코드를 발급하는 중/)).toBeInTheDocument();
      });
      expect(screen.queryByText(/AVT-[A-Z0-9]{4}-[A-Z0-9]{2}/)).not.toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      await waitFor(() => {
        expect(screen.getByText(/AVT-[A-Z0-9]{4}-[A-Z0-9]{2}/)).toBeInTheDocument();
      });
    });
  });

  describe('언마운트', () => {
    it('언마운트 후 30초 경과해도 status 호출이 없다', async () => {
      let statusCallCount = 0;
      server.use(
        connectCodeHandlers.success,
        http.get(`${BASE_URL}/api/onboarding/connect-status`, () => {
          statusCallCount++;
          return HttpResponse.json({ data: { status: 'active' } });
        })
      );

      const { unmount } = renderWithProviders(<ConnectStep />, {
        initialRoute: '/onboarding/connect',
      });

      await waitFor(() => {
        expect(screen.getByText(/AVT-[A-Z0-9]{4}-[A-Z0-9]{2}/)).toBeInTheDocument();
      });

      unmount();

      const countAtUnmount = statusCallCount;

      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000);
      });

      expect(statusCallCount).toBe(countAtUnmount);
    });
  });

  describe('코드 발급 오류', () => {
    it('서버 오류 시 에러 메시지가 alert role 로 렌더된다', async () => {
      server.use(
        http.post(`${BASE_URL}/api/persona/connect/code`, () => {
          return HttpResponse.json({ message: '서버 오류입니다.' }, { status: 500 });
        })
      );

      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByRole('alert').textContent).toContain('서버 오류입니다.');
    });

    it('오류 메시지가 빈 문자열이면 "연결 코드 발급에 실패했어요." 기본 메시지가 노출된다', async () => {
      server.use(
        http.post(`${BASE_URL}/api/persona/connect/code`, () => {
          return HttpResponse.json({ message: '' }, { status: 500 });
        })
      );

      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByRole('alert').textContent).toContain('연결 코드 발급에 실패했어요.');
    });
  });

  // "생성된 결과 확인" 은 결과를 보러 가는 버튼이지 완료 선언이 아니다.
  // 예전에는 연결 여부와 무관하게 진행도를 complete 로 올려서, 아바타를 만든 적 없는
  // 사용자까지 완료 상태로 기록됐다.
  describe('생성된 결과 확인 버튼', () => {
    it('아직 연결되지 않았으면 진행도를 complete 로 올리지 않고 안내만 한다', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '생성된 결과 확인' })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: '생성된 결과 확인' }));

      expect(localStorage.getItem('avating:onboarding:progress')).toBe('creating');
      expect(mockNavigate).not.toHaveBeenCalledWith('/onboarding/complete');
      expect(await screen.findByText(/아직 연결되지 않았어요/)).toBeInTheDocument();
    });

    it('연결이 끝났으면 확인 화면으로 보낸다', async () => {
      server.use(connectCodeHandlers.success, connectStatusHandlers.connected);
      renderWithProviders(<ConnectStep />, { initialRoute: '/onboarding/connect' });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding/complete');
      });
      expect(localStorage.getItem('avating:onboarding:progress')).toBe('complete');
    });
  });
});
