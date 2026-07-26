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
    it('환영 헤딩과 서브 카피가 렌더된다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(
        screen.getByRole('heading', { level: 1, name: /이제 아바타를 만들 차례예요/ })
      ).toBeInTheDocument();
      expect(
        screen.getByText('내 성향을 분석해 아바타를 만들고, 첫 번째 매칭을 시작할 수 있어요.')
      ).toBeInTheDocument();
    });

    it('앞으로 할 일 4단계 체크리스트가 렌더된다 (전부 미완료)', () => {
      renderWithProviders(<WelcomeStep />);
      expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
        '1기본 정보 입력',
        '2생성 방법 선택',
        '3성향 설문 6문항',
        '4아바타 확인',
      ]);
    });

    it('소요 시간 안내 "약 2분 소요" 가 렌더된다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(screen.getByText('약 2분 소요')).toBeInTheDocument();
    });

    it('v1 단계 라벨(STEP n / 4)은 렌더되지 않는다 — 진행 표시는 레일이 담당한다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(screen.queryByText(/STEP \d \/ 4/)).not.toBeInTheDocument();
    });

    it('"아바타 만들기" 기본 CTA 와 "ChatGPT Bot 연동" 보조 링크가 렌더된다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(screen.getByRole('button', { name: /아바타 만들기/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ChatGPT Bot 연동' })).toBeInTheDocument();
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
