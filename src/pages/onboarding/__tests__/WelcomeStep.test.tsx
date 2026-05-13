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
    localStorage.removeItem('avating:onboarding:progress');
  });

  describe('렌더링', () => {
    it('STEP 1 / 4 · 시작 라벨이 렌더된다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(screen.getByText(/STEP 1 \/ 4 · 시작/)).toBeInTheDocument();
    });

    it('메인 제목 "당신의 아바타를 만듭니다" 가 렌더된다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(
        screen.getByRole('heading', { level: 1, name: /당신의 아바타를 만듭니다/ })
      ).toBeInTheDocument();
    });

    it('2개의 numbered step 카드가 렌더된다', () => {
      renderWithProviders(<WelcomeStep />);
      const items = screen.getAllByRole('listitem');
      expect(items.length).toBe(2);
    });

    it('Step 01 본문에 "성향 설문" 과 "ChatGPT Bot" 미리보기가 포함된다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(screen.getByText(/아바타 생성 방법 선택/)).toBeInTheDocument();
      expect(screen.getByText(/성향 설문/)).toBeInTheDocument();
      expect(screen.getByText(/ChatGPT Bot/)).toBeInTheDocument();
    });

    it('Step 02 본문에 "아바타 확인 · 이후 튜닝 가능" 안내가 포함된다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(screen.getByText(/생성된 아바타를 확인합니다 · 이후 튜닝 가능/)).toBeInTheDocument();
    });

    it('"시작하기" 버튼이 렌더된다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(screen.getByRole('button', { name: /시작하기/ })).toBeInTheDocument();
    });
  });

  describe('상호작용', () => {
    it('"시작하기" 버튼 클릭 시 /onboarding/method 로 navigate 가 호출된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<WelcomeStep />);

      await user.click(screen.getByRole('button', { name: /시작하기/ }));

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/method');
    });

    it('"시작하기" 버튼 클릭 시 progress 가 method 로 승격된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<WelcomeStep />);

      await user.click(screen.getByRole('button', { name: /시작하기/ }));

      expect(localStorage.getItem('avating:onboarding:progress')).toBe('method');
    });

    it('"시작하기" 버튼은 Enter 키로도 트리거된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<WelcomeStep />);

      const button = screen.getByRole('button', { name: /시작하기/ });
      button.focus();
      await user.keyboard('{Enter}');

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/method');
    });
  });
});
