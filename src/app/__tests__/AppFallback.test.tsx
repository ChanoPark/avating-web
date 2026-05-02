import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from 'react-error-boundary';
import { AppFallback } from '../App';
import { handleAppCrash } from '../handleAppCrash';

describe('AppFallback (RouterProvider 외부 글로벌 에러 fallback)', () => {
  let originalLocation: Location;
  let reloadSpy: ReturnType<typeof vi.fn>;
  let hrefSetter: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalLocation = window.location;
    reloadSpy = vi.fn();
    hrefSetter = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        reload: reloadSpy,
        get href() {
          return originalLocation.href;
        },
        set href(value: string) {
          hrefSetter(value);
        },
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('제목, 설명, 에러 코드를 표시한다', () => {
    render(<AppFallback />);
    expect(
      screen.getByRole('heading', { name: '일시적인 오류가 발생했습니다' })
    ).toBeInTheDocument();
    expect(screen.getByText(/잠시 후 다시 시도해주세요/)).toBeInTheDocument();
    expect(screen.getByText('ERROR_CODE: 500')).toBeInTheDocument();
  });

  it('main 랜드마크와 alert 컨테이너가 분리되어 있고 alert 에 aria-live 가 중복 지정되지 않는다', () => {
    render(<AppFallback />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).not.toHaveAttribute('aria-live');
  });

  it('"다시 시도" 클릭 시 resetErrorBoundary 미제공이면 window.location.reload 호출', async () => {
    const user = userEvent.setup();
    render(<AppFallback />);

    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('"다시 시도" 클릭 시 resetErrorBoundary 가 제공되면 그 핸들러를 우선 호출 (reload 호출 안 함)', async () => {
    const user = userEvent.setup();
    const resetErrorBoundary = vi.fn();
    render(<AppFallback resetErrorBoundary={resetErrorBoundary} />);

    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(resetErrorBoundary).toHaveBeenCalledTimes(1);
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it('"문의하기" 클릭 시 window.location.href 가 mailto 로 이동한다', async () => {
    const user = userEvent.setup();
    render(<AppFallback />);

    await user.click(screen.getByRole('button', { name: '문의하기' }));

    expect(hrefSetter).toHaveBeenCalledWith('mailto:support@avating.com');
  });

  describe('handleAppCrash (ErrorBoundary onError 핸들러)', () => {
    it('console.error 로 [AppBoundary] 태그와 함께 에러를 기록한다', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('boom');
      const info = { componentStack: '\n  at TestComponent' };

      try {
        handleAppCrash(error, info);
        expect(consoleSpy).toHaveBeenCalledWith('[AppBoundary]', error, info);
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('production 모드에서는 componentStack(info) 없이 error.message 만 콘솔에 기록한다', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.stubEnv('MODE', 'production');
      const error = new Error('prod boom');
      const info = { componentStack: '\n  at Sensitive/Path/File.tsx' };

      try {
        handleAppCrash(error, info);
        expect(consoleSpy).toHaveBeenCalledWith('[AppBoundary]', 'prod boom');
        expect(consoleSpy).not.toHaveBeenCalledWith('[AppBoundary]', error, info);
      } finally {
        vi.unstubAllEnvs();
        consoleSpy.mockRestore();
      }
    });

    it('ErrorBoundary 와 통합 시 자식 throw → handleAppCrash 호출 + AppFallback 렌더', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      function Throwing(): never {
        throw new Error('integration boom');
      }

      try {
        render(
          <ErrorBoundary FallbackComponent={AppFallback} onError={handleAppCrash}>
            <Throwing />
          </ErrorBoundary>
        );

        expect(
          screen.getByRole('heading', { name: '일시적인 오류가 발생했습니다' })
        ).toBeInTheDocument();
        expect(
          consoleSpy.mock.calls.some(
            (call) =>
              call[0] === '[AppBoundary]' &&
              call[1] instanceof Error &&
              call[1].message === 'integration boom'
          )
        ).toBe(true);
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });
});
