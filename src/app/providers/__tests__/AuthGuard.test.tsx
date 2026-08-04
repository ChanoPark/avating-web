import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { useAuthStore } from '@entities/auth/store';
import { AuthGuard } from '../AuthGuard';

const mockToken = {
  accessToken: 'access-token-value',
  refreshToken: 'refresh-token-value',
  tokenType: 'Bearer',
  expiresIn: 3600,
};

describe('AuthGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().clear();
  });

  it('인증되지 않은 상태에서 로그인 페이지로 리다이렉트한다', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthGuard>
          <div>보호된 콘텐츠</div>
        </AuthGuard>
      </MemoryRouter>
    );
    expect(screen.queryByText('보호된 콘텐츠')).not.toBeInTheDocument();
  });

  it('인증된 상태에서 children을 렌더한다', () => {
    useAuthStore.getState().setToken(mockToken);

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>보호된 콘텐츠</div>
        </AuthGuard>
      </MemoryRouter>
    );
    expect(screen.getByText('보호된 콘텐츠')).toBeInTheDocument();
  });

  it('세션 복구 중(restoring)에는 리다이렉트하지 않고 대기 상태를 보여준다', () => {
    useAuthStore.setState({ status: 'restoring' });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthGuard>
          <div>보호된 콘텐츠</div>
        </AuthGuard>
      </MemoryRouter>
    );

    expect(screen.queryByText('보호된 콘텐츠')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('accessToken 이 만료돼도 status 가 authenticated 면 로그인으로 튀지 않는다 (401 인터셉터가 갱신)', () => {
    useAuthStore.getState().setToken(mockToken);
    useAuthStore.setState({ expiresAt: Date.now() - 1 });

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>보호된 콘텐츠</div>
        </AuthGuard>
      </MemoryRouter>
    );

    expect(screen.getByText('보호된 콘텐츠')).toBeInTheDocument();
  });
});
