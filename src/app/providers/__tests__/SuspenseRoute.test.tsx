import type { ReactNode } from 'react';
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

  it('에러 원문(서버 message)을 화면에 노출하지 않는다', () => {
    const spy = silenceBoundaryLog();
    const Boom = () => {
      throw new ApiError(500, '요청한 리소스를 찾을 수 없습니다');
    };

    renderRoute(<Boom />);

    expect(screen.queryByText('요청한 리소스를 찾을 수 없습니다')).not.toBeInTheDocument();
    spy.mockRestore();
  });

  it('에러 발생 시 재시도·문의 CTA 가 있는 에러 화면을 보여준다', () => {
    const spy = silenceBoundaryLog();
    const Boom = () => {
      throw new ApiError(500, '서버 오류');
    };

    renderRoute(<Boom />);

    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '문의하기' })).toBeInTheDocument();
    spy.mockRestore();
  });

  it('404 ApiError 는 "찾을 수 없음" 화면으로 떨어진다', () => {
    const spy = silenceBoundaryLog();
    const Boom = () => {
      throw new ApiError(404, '요청한 리소스를 찾을 수 없습니다');
    };

    renderRoute(<Boom />);

    expect(screen.getByRole('button', { name: '메인 화면으로' })).toBeInTheDocument();
    expect(screen.queryByText('요청한 리소스를 찾을 수 없습니다')).not.toBeInTheDocument();
    spy.mockRestore();
  });

  it('403 ApiError 는 권한 안내 화면으로 떨어진다', () => {
    const spy = silenceBoundaryLog();
    const Boom = () => {
      throw new ApiError(403, 'Forbidden');
    };

    renderRoute(<Boom />);

    expect(screen.getByRole('heading', { name: '로그인이 필요해요' })).toBeInTheDocument();
    spy.mockRestore();
  });
});
