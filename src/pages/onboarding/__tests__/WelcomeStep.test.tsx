import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { WelcomeStep } from '../steps/WelcomeStep';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

describe('WelcomeStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링', () => {
    it('메인 제목 "당신의 아바타를 만듭니다" 가 렌더된다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(screen.getByText(/당신의 아바타를 만듭니다/)).toBeInTheDocument();
    });

    it('3개의 step 카드가 렌더된다', () => {
      renderWithProviders(<WelcomeStep />);
      const stepCards = screen.getAllByRole('listitem');
      expect(stepCards.length).toBeGreaterThanOrEqual(3);
    });

    it('"시작하기" 버튼이 렌더된다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(screen.getByRole('button', { name: /시작하기/i })).toBeInTheDocument();
    });
  });

  describe('상호작용', () => {
    it('"시작하기" 버튼 클릭 시 /onboarding/survey 로 navigate 가 호출된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<WelcomeStep />);

      await user.click(screen.getByRole('button', { name: /시작하기/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/survey');
    });

    it('"시작하기" 버튼은 Enter 키로도 트리거된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<WelcomeStep />);

      const button = screen.getByRole('button', { name: /시작하기/i });
      button.focus();
      await user.keyboard('{Enter}');

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/survey');
    });
  });

  describe('접근성', () => {
    it('"시작하기" 버튼은 role=button 이다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(screen.getByRole('button', { name: /시작하기/i })).toBeInTheDocument();
    });
  });
});
