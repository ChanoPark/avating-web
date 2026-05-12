import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { AvatarDetailPage } from '../AvatarDetailPage';

describe('AvatarDetailPage', () => {
  it('"매칭 요청" CTA 가 렌더된다', () => {
    renderWithProviders(<AvatarDetailPage />);
    expect(screen.getByRole('button', { name: '매칭 요청' })).toBeInTheDocument();
  });

  it('CTA 클릭 시 MatchRequestModal 이 열린다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AvatarDetailPage />);
    await user.click(screen.getByRole('button', { name: '매칭 요청' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /이 아바타에게 소개팅을 요청합니다/ })
    ).toBeInTheDocument();
  });

  it('모달 내 취소 버튼으로 다시 닫을 수 있다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AvatarDetailPage />);
    await user.click(screen.getByRole('button', { name: '매칭 요청' }));
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: '취소' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('CTA 의 aria-expanded 가 모달 열림/닫힘과 동기화된다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AvatarDetailPage />);
    const trigger = screen.getByRole('button', { name: '매칭 요청' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    await screen.findByRole('dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: '취소' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  describe('production 가드', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('DEV=false 환경에서는 placeholder 데이터 대신 안내 카피만 노출된다', () => {
      vi.stubEnv('DEV', false);
      renderWithProviders(<AvatarDetailPage />);
      expect(screen.getByText(/아바타 정보 API.*도입 후 활성화/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '매칭 요청' })).not.toBeInTheDocument();
    });
  });
});
