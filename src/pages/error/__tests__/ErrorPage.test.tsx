import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { ErrorPage } from '../ErrorPage';

function LocationDisplay() {
  const loc = useLocation();
  return <div data-testid="location">{loc.pathname}</div>;
}

function renderErrorPage(
  variant: 'not-found' | 'server-error' | 'forbidden' | 'offline',
  options: { initialEntries?: string[] } = {}
) {
  const { initialEntries = ['/garbage'] } = options;
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<div>HOME_PAGE</div>} />
        <Route path="/login" element={<div>LOGIN_PAGE</div>} />
        <Route
          path="*"
          element={
            <>
              <ErrorPage variant={variant} />
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

    it('히스토리가 있으면 "이전" 버튼이 노출된다', () => {
      renderErrorPage('not-found', { initialEntries: ['/', '/garbage'] });
      expect(screen.getByRole('button', { name: /이전/ })).toBeInTheDocument();
    });

    it('"이전" 버튼 클릭 시 직전 경로로 돌아간다', async () => {
      const user = userEvent.setup();
      renderErrorPage('not-found', { initialEntries: ['/', '/garbage'] });

      await user.click(screen.getByRole('button', { name: /이전/ }));

      expect(screen.getByText('HOME_PAGE')).toBeInTheDocument();
    });

    it('히스토리가 없으면 "이전" 버튼은 노출되지 않는다', () => {
      renderErrorPage('not-found', { initialEntries: ['/garbage'] });
      expect(screen.queryByRole('button', { name: /이전/ })).not.toBeInTheDocument();
    });

    it('role="alert" 컨테이너가 존재한다 (스크린리더 알림)', () => {
      renderErrorPage('not-found');
      expect(screen.getByRole('alert')).toBeInTheDocument();
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

    it('"다시 시도" 버튼이 노출되며 onRetry 핸들러를 실행한다', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();
      render(
        <MemoryRouter>
          <ErrorPage variant="server-error" onRetry={onRetry} />
        </MemoryRouter>
      );

      await user.click(screen.getByRole('button', { name: '다시 시도' }));
      expect(onRetry).toHaveBeenCalledTimes(1);
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
  });

  describe('variant="offline" (네트워크 없음)', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: false,
      });
    });

    it('제목과 설명을 표시한다', () => {
      render(
        <MemoryRouter>
          <ErrorPage variant="offline" />
        </MemoryRouter>
      );
      expect(screen.getByRole('heading', { name: '인터넷 연결이 끊겼습니다' })).toBeInTheDocument();
      expect(screen.getByText(/연결 상태를 확인하고 다시 시도해주세요/)).toBeInTheDocument();
    });

    it('"다시 시도" 버튼이 노출되며 onRetry 핸들러를 실행한다', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();
      render(
        <MemoryRouter>
          <ErrorPage variant="offline" onRetry={onRetry} />
        </MemoryRouter>
      );

      await user.click(screen.getByRole('button', { name: '다시 시도' }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
