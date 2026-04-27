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
});
