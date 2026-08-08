import type { ReactNode } from 'react';
import { lazy } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { ApiError } from '@shared/lib/errors';
import { SuspenseRoute } from '../SuspenseRoute';

function renderRoute(children: ReactNode) {
  return render(
    <MemoryRouter>
      <SuspenseRoute>{children}</SuspenseRoute>
    </MemoryRouter>
  );
}

function silenceBoundaryLog() {
  return vi.spyOn(console, 'error').mockImplementation(() => undefined);
}

describe('SuspenseRoute', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('children을 렌더한다', () => {
    renderRoute(<div>라우트 콘텐츠</div>);
    expect(screen.getByText('라우트 콘텐츠')).toBeInTheDocument();
  });

  it('로딩 중에는 백지 대신 스켈레톤을 보여준다', () => {
    // 영원히 resolve 되지 않는 청크 — Suspense 폴백 상태로 고정된다.
    const NeverLoads = lazy(() => new Promise<never>(() => undefined));

    renderRoute(<NeverLoads />);

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent('불러오는 중이에요');
  });

  it('에러 원문(서버 message)을 화면에 노출하지 않는다', async () => {
    const spy = silenceBoundaryLog();
    const Boom = () => {
      throw new ApiError(500, '요청한 리소스를 찾을 수 없습니다');
    };

    renderRoute(<Boom />);

    expect(await screen.findByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    expect(screen.queryByText('요청한 리소스를 찾을 수 없습니다')).not.toBeInTheDocument();
    spy.mockRestore();
  });

  // 정본 S-11-04 는 1차 실패에 문의 경로를 두지 않는다 — 3회 실패(S-11-05)에서만 나온다.
  it('500 은 수동 재시도만 주고 문의 경로는 아직 노출하지 않는다', async () => {
    const spy = silenceBoundaryLog();
    const Boom = () => {
      throw new ApiError(500, '서버 오류');
    };

    renderRoute(<Boom />);

    expect(await screen.findByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '문의하기' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '문의하기' })).not.toBeInTheDocument();
    spy.mockRestore();
  });

  it('404 ApiError 는 S-11-03 없는 페이지 화면으로 떨어진다', async () => {
    const spy = silenceBoundaryLog();
    const Boom = () => {
      throw new ApiError(404, '요청한 리소스를 찾을 수 없습니다');
    };

    renderRoute(<Boom />);

    expect(
      await screen.findByRole('heading', { name: '찾는 페이지가 없어요.' })
    ).toBeInTheDocument();
    expect(screen.queryByText('요청한 리소스를 찾을 수 없습니다')).not.toBeInTheDocument();
    spy.mockRestore();
  });

  it('403 ApiError 는 S-11-02 권한 없음 화면으로 떨어진다', async () => {
    const spy = silenceBoundaryLog();
    const Boom = () => {
      throw new ApiError(403, 'Forbidden');
    };

    renderRoute(<Boom />);

    expect(
      await screen.findByRole('heading', { name: '이 페이지를 볼 권한이 없어요.' })
    ).toBeInTheDocument();
    spy.mockRestore();
  });

  // 401 과 403 은 정본에서 서로 다른 화면이다 — 예전엔 둘 다 forbidden 으로 뭉개졌다.
  it('401 ApiError 는 S-11-01 세션 만료 화면으로 떨어진다', async () => {
    const spy = silenceBoundaryLog();
    const Boom = () => {
      throw new ApiError(401, 'Unauthorized');
    };

    renderRoute(<Boom />);

    expect(
      await screen.findByRole('heading', { name: '다시 로그인해 주세요.' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 로그인' })).toBeInTheDocument();
    spy.mockRestore();
  });

  it('경계가 에러를 삼키지 않고 크래시 핸들러로 넘긴다 (관측 통로)', async () => {
    const spy = silenceBoundaryLog();
    const Boom = () => {
      throw new ApiError(500, '서버 오류');
    };

    renderRoute(<Boom />);

    await screen.findByRole('button', { name: '다시 시도' });
    expect(spy.mock.calls.some((call) => call[0] === '[AppBoundary]')).toBe(true);
    spy.mockRestore();
  });
});
