import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { ErrorPage } from '../ErrorPage';
import type { ErrorVariant } from '../ErrorPage';

function LocationDisplay() {
  const loc = useLocation();
  return <div data-testid="location">{loc.pathname}</div>;
}

function renderErrorPage(
  variant: ErrorVariant,
  options: {
    initialEntries?: string[];
    onRetry?: () => void;
    onContact?: () => void;
    canGoBack?: boolean;
  } = {}
) {
  const { initialEntries = ['/garbage'], onRetry, onContact, canGoBack } = options;
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<div>HOME_PAGE</div>} />
        <Route path="/login" element={<div>LOGIN_PAGE</div>} />
        <Route
          path="*"
          element={
            <>
              <ErrorPage
                variant={variant}
                onRetry={onRetry}
                onContact={onContact}
                canGoBack={canGoBack}
              />
              <LocationDisplay />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ErrorPage', () => {
  describe('variant="not-found" (404)', () => {
    it('제목, 설명, 에러 코드를 표시한다', () => {
      renderErrorPage('not-found');
      expect(
        screen.getByRole('heading', { name: '페이지를 찾을 수 없습니다' })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/요청한 페이지가 존재하지 않거나 이동되었을 수 있습니다/)
      ).toBeInTheDocument();
      expect(screen.getByText('ERROR_CODE: 404')).toBeInTheDocument();
    });

    it('"홈으로" 버튼 클릭 시 / 로 이동한다', async () => {
      const user = userEvent.setup();
      renderErrorPage('not-found');

      await user.click(screen.getByRole('button', { name: '홈으로' }));

      expect(screen.getByText('HOME_PAGE')).toBeInTheDocument();
    });

    it('canGoBack=true 일 때 "이전" 버튼이 노출된다', () => {
      renderErrorPage('not-found', { canGoBack: true });
      expect(screen.getByRole('button', { name: /이전/ })).toBeInTheDocument();
    });

    it('"이전" 버튼 클릭 시 직전 경로로 돌아간다', async () => {
      const user = userEvent.setup();
      renderErrorPage('not-found', {
        initialEntries: ['/', '/garbage'],
        canGoBack: true,
      });

      await user.click(screen.getByRole('button', { name: /이전/ }));

      expect(screen.getByText('HOME_PAGE')).toBeInTheDocument();
    });

    it('canGoBack=false 일 때 "이전" 버튼은 노출되지 않는다', () => {
      renderErrorPage('not-found', { canGoBack: false });
      expect(screen.queryByRole('button', { name: /이전/ })).not.toBeInTheDocument();
    });

    it('main 랜드마크와 분리된 alert 컨테이너가 존재하며 alert 에 aria-live 가 중복 지정되지 않는다', () => {
      renderErrorPage('not-found');
      expect(screen.getByRole('main')).toBeInTheDocument();
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      // role="alert" 는 암묵적 aria-live="assertive". 명시적 polite 와 충돌 방지.
      expect(alert).not.toHaveAttribute('aria-live');
    });
  });

  describe('variant="server-error" (500)', () => {
    it('제목, 설명, 에러 코드를 표시한다', () => {
      renderErrorPage('server-error');
      expect(
        screen.getByRole('heading', { name: '일시적인 오류가 발생했습니다' })
      ).toBeInTheDocument();
      expect(screen.getByText(/잠시 후 다시 시도해주세요/)).toBeInTheDocument();
      expect(screen.getByText('ERROR_CODE: 500')).toBeInTheDocument();
    });

    it('onRetry 가 주어지면 "다시 시도" 버튼이 핸들러를 실행한다', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();
      renderErrorPage('server-error', { onRetry });

      await user.click(screen.getByRole('button', { name: '다시 시도' }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('onRetry 미제공 시에도 "다시 시도" 버튼은 항상 노출된다 (디자인 스펙)', () => {
      renderErrorPage('server-error');
      expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    });

    it('onContact 가 주어지면 "문의하기" 버튼이 핸들러를 실행한다', async () => {
      const user = userEvent.setup();
      const onContact = vi.fn();
      renderErrorPage('server-error', { onContact });

      await user.click(screen.getByRole('button', { name: '문의하기' }));
      expect(onContact).toHaveBeenCalledTimes(1);
    });

    it('requestId 가 주어지면 ERROR_CODE 라인에 함께 표시한다', () => {
      render(
        <MemoryRouter>
          <ErrorPage variant="server-error" requestId="req_abc123" />
        </MemoryRouter>
      );
      expect(screen.getByText(/ERROR_CODE: 500/)).toBeInTheDocument();
      expect(screen.getByText(/REQUEST_ID: req_abc123/)).toBeInTheDocument();
    });
  });

  describe('variant="forbidden" (403)', () => {
    it('제목, 설명, 에러 코드를 표시한다', () => {
      renderErrorPage('forbidden');
      expect(screen.getByRole('heading', { name: '접근 권한이 없습니다' })).toBeInTheDocument();
      expect(
        screen.getByText(/이 페이지를 보려면 로그인이 필요하거나 권한이 필요합니다/)
      ).toBeInTheDocument();
      expect(screen.getByText('ERROR_CODE: 403')).toBeInTheDocument();
    });

    it('"로그인" 버튼 클릭 시 /login 으로 이동한다', async () => {
      const user = userEvent.setup();
      renderErrorPage('forbidden');

      await user.click(screen.getByRole('button', { name: '로그인' }));

      expect(screen.getByText('LOGIN_PAGE')).toBeInTheDocument();
    });

    it('canGoBack=true 일 때 "이전 페이지" 버튼이 노출된다', () => {
      renderErrorPage('forbidden', { canGoBack: true });
      expect(screen.getByRole('button', { name: '이전 페이지' })).toBeInTheDocument();
    });

    it('canGoBack=false 일 때 "이전 페이지" 버튼은 노출되지 않는다', () => {
      renderErrorPage('forbidden', { canGoBack: false });
      expect(screen.queryByRole('button', { name: '이전 페이지' })).not.toBeInTheDocument();
    });
  });

  describe('variant="offline" (네트워크 없음)', () => {
    it('제목과 설명을 표시한다', () => {
      render(
        <MemoryRouter>
          <ErrorPage variant="offline" />
        </MemoryRouter>
      );
      expect(screen.getByRole('heading', { name: '인터넷 연결이 끊겼습니다' })).toBeInTheDocument();
      expect(screen.getByText(/연결 상태를 확인하고 다시 시도해주세요/)).toBeInTheDocument();
    });

    it('onRetry 미제공 시에도 "다시 시도" 버튼은 fallback(reload) 으로 노출된다', () => {
      render(
        <MemoryRouter>
          <ErrorPage variant="offline" />
        </MemoryRouter>
      );
      expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    });

    it('onRetry 제공 시 3초 간격으로 자동 호출되며 진행 상황을 표시한다', () => {
      vi.useFakeTimers();
      try {
        const onRetry = vi.fn();
        render(
          <MemoryRouter>
            <ErrorPage variant="offline" onRetry={onRetry} />
          </MemoryRouter>
        );

        expect(onRetry).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();

        act(() => {
          vi.advanceTimersByTime(3000);
        });
        expect(onRetry).toHaveBeenCalledTimes(1);
        expect(screen.getByText('재연결 시도 중... (1/5)')).toBeInTheDocument();

        act(() => {
          vi.advanceTimersByTime(3000 * 4);
        });
        expect(onRetry).toHaveBeenCalledTimes(5);
      } finally {
        vi.useRealTimers();
      }
    });

    it('5회 재시도 소진 시 "연결 실패" 메시지 + "새로고침" 버튼으로 전환된다', () => {
      vi.useFakeTimers();
      try {
        const onRetry = vi.fn();
        render(
          <MemoryRouter>
            <ErrorPage variant="offline" onRetry={onRetry} />
          </MemoryRouter>
        );

        act(() => {
          vi.advanceTimersByTime(3000 * 5);
        });

        expect(screen.getByText(/연결 실패/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '새로고침' })).toBeInTheDocument();
        expect(screen.queryByText(/재연결 시도 중/)).not.toBeInTheDocument();

        act(() => {
          vi.advanceTimersByTime(3000 * 3);
        });
        expect(onRetry).toHaveBeenCalledTimes(5);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('variant="maintenance" (점검)', () => {
    it('제목, 설명, 점검창 정보, 상태 페이지 링크를 표시한다', () => {
      render(
        <MemoryRouter>
          <ErrorPage
            variant="maintenance"
            maintenanceWindow={{
              startsAt: '2026-05-02 02:00',
              endsAt: '2026-05-02 04:00',
              durationMin: 120,
              brief: '데이터베이스 마이그레이션',
            }}
          />
        </MemoryRouter>
      );
      expect(screen.getByRole('heading', { name: '서비스 점검 중입니다' })).toBeInTheDocument();
      expect(screen.getByText(/2026-05-02 02:00/)).toBeInTheDocument();
      expect(screen.getByText(/약 120분 소요 예정/)).toBeInTheDocument();
      expect(screen.getByText(/데이터베이스 마이그레이션/)).toBeInTheDocument();
      const statusLink = screen.getByRole('link', { name: /상태 페이지/ });
      expect(statusLink).toHaveAttribute('target', '_blank');
      expect(statusLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('maintenanceStatusUrl prop 으로 상태 페이지 링크를 override 할 수 있다', () => {
      render(
        <MemoryRouter>
          <ErrorPage variant="maintenance" maintenanceStatusUrl="https://status.example.com" />
        </MemoryRouter>
      );
      expect(screen.getByRole('link', { name: /상태 페이지/ })).toHaveAttribute(
        'href',
        'https://status.example.com'
      );
    });
  });
});
