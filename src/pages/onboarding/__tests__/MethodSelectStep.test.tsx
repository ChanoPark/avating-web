import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { MethodSelectStep } from '../steps/MethodSelectStep';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

describe('MethodSelectStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('avating:onboarding:progress', 'method');
  });

  describe('렌더링', () => {
    it('STEP 2 / 4 · 아바타 생성 방법 라벨이 렌더된다', () => {
      renderWithProviders(<MethodSelectStep />);
      expect(screen.getByText(/STEP 2 \/ 4 · 아바타 생성 방법/)).toBeInTheDocument();
    });

    it('제목 "어떻게 아바타를 만들까요?" 가 렌더된다', () => {
      renderWithProviders(<MethodSelectStep />);
      expect(
        screen.getByRole('heading', { level: 1, name: /어떻게 아바타를 만들까요/ })
      ).toBeInTheDocument();
    });

    it('성향 설문 / ChatGPT Bot 연동 라디오 옵션이 모두 렌더된다', () => {
      renderWithProviders(<MethodSelectStep />);
      expect(screen.getByRole('radio', { name: /성향 설문/ })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /ChatGPT Bot 연동/ })).toBeInTheDocument();
    });

    it('초기에 성향 설문이 선택되어 있다', () => {
      renderWithProviders(<MethodSelectStep />);
      expect(screen.getByRole('radio', { name: /성향 설문/ })).toBeChecked();
      expect(screen.getByRole('radio', { name: /ChatGPT Bot 연동/ })).not.toBeChecked();
    });

    it('튜닝 가능 안내 문구가 렌더된다', () => {
      renderWithProviders(<MethodSelectStep />);
      expect(screen.getByText(/이후 튜닝 기능을 통해 조정할 수 있습니다/)).toBeInTheDocument();
    });

    it('이전 / 다음 버튼이 렌더된다', () => {
      renderWithProviders(<MethodSelectStep />);
      expect(screen.getByRole('button', { name: /이전/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /다음/ })).toBeInTheDocument();
    });
  });

  describe('상호작용', () => {
    it('ChatGPT Bot 연동 라디오 클릭 시 선택 상태가 전환된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MethodSelectStep />);

      await user.click(screen.getByRole('radio', { name: /ChatGPT Bot 연동/ }));

      expect(screen.getByRole('radio', { name: /ChatGPT Bot 연동/ })).toBeChecked();
      expect(screen.getByRole('radio', { name: /성향 설문/ })).not.toBeChecked();
    });

    it('성향 설문 선택 후 다음 → /onboarding/survey 로 이동', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MethodSelectStep />);

      await user.click(screen.getByRole('button', { name: /다음/ }));

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/survey');
    });

    it('ChatGPT Bot 선택 후 다음 → /onboarding/connect 로 이동', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MethodSelectStep />);

      await user.click(screen.getByRole('radio', { name: /ChatGPT Bot 연동/ }));
      await user.click(screen.getByRole('button', { name: /다음/ }));

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/connect');
    });

    it('이전 → /onboarding/welcome 으로 이동', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MethodSelectStep />);

      await user.click(screen.getByRole('button', { name: /이전/ }));

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/welcome');
    });
  });

  describe('진입 가드', () => {
    it('progress 가 welcome 이면 /onboarding/welcome 으로 redirect 한다', () => {
      localStorage.setItem('avating:onboarding:progress', 'welcome');
      renderWithProviders(<MethodSelectStep />);
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/welcome', { replace: true });
    });

    it('progress 가 complete 이면 /onboarding/complete 로 redirect 한다', () => {
      localStorage.setItem('avating:onboarding:progress', 'complete');
      renderWithProviders(<MethodSelectStep />);
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/complete', { replace: true });
    });

    it('progress=creating + method=survey 이면 /onboarding/survey 로 redirect 한다', () => {
      localStorage.setItem('avating:onboarding:progress', 'creating');
      localStorage.setItem('avating:onboarding:method', 'survey');
      renderWithProviders(<MethodSelectStep />);
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/survey', { replace: true });
    });

    it('progress=creating + method=connect 이면 /onboarding/connect 로 redirect 한다', () => {
      localStorage.setItem('avating:onboarding:progress', 'creating');
      localStorage.setItem('avating:onboarding:method', 'connect');
      renderWithProviders(<MethodSelectStep />);
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/connect', { replace: true });
    });
  });
});
