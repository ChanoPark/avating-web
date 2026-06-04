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

const PROGRESS_KEY = 'avating:onboarding:progress';
const METHOD_KEY = 'avating:onboarding:method';

describe('WelcomeStep (와이어프레임 v2 — 브랜드 환영 모멘트)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('렌더링', () => {
    it('브랜드 마크 "Av" 가 렌더된다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(screen.getByText('Av')).toBeInTheDocument();
    });

    it('환영 헤딩 "이제 아바타를 만들 차례예요" 가 렌더된다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(
        screen.getByRole('heading', { level: 1, name: /이제 아바타를 만들 차례예요/ })
      ).toBeInTheDocument();
    });

    it('소요 시간 힌트(성향 설문 약 2분 / 아바타 확인 약 1분)가 렌더된다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(screen.getByText('성향 설문')).toBeInTheDocument();
      expect(screen.getByText('약 2분')).toBeInTheDocument();
      expect(screen.getByText('아바타 확인')).toBeInTheDocument();
      expect(screen.getByText('약 1분')).toBeInTheDocument();
    });

    it('v1 단계 미리보기 리스트가 더 이상 렌더되지 않는다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(screen.queryByText(/STEP 1 \/ 4 · 시작/)).not.toBeInTheDocument();
      expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    });

    it('"아바타 만들기" 기본 CTA 와 "Bot 연동" 보조 링크가 렌더된다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(screen.getByRole('button', { name: /아바타 만들기/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Bot 연동/ })).toBeInTheDocument();
    });
  });

  describe('상호작용', () => {
    it('"아바타 만들기" 클릭 시 /onboarding/intro 로 이동하고 progress 가 intro 로 승격된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<WelcomeStep />);

      await user.click(screen.getByRole('button', { name: /아바타 만들기/ }));

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/intro');
      expect(localStorage.getItem(PROGRESS_KEY)).toBe('intro');
    });

    it('"아바타 만들기" CTA 는 Enter 키로도 트리거된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<WelcomeStep />);

      const button = screen.getByRole('button', { name: /아바타 만들기/ });
      button.focus();
      await user.keyboard('{Enter}');

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/intro');
    });

    it('"Bot 연동" 클릭 시 method=connect 사전선택 + /onboarding/intro 로 이동한다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<WelcomeStep />);

      await user.click(screen.getByRole('button', { name: /Bot 연동/ }));

      expect(localStorage.getItem(METHOD_KEY)).toBe('connect');
      expect(localStorage.getItem(PROGRESS_KEY)).toBe('intro');
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/intro');
    });
  });
});
