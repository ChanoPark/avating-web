import { describe, it, expect } from 'vitest';
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
});
