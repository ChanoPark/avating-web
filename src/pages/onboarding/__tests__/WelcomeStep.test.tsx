import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AvatarSummary } from '@entities/avatar';
import { renderWithProviders } from '@/test/renderWithProviders';
import { queryClientWithPrimaryAvatar, SAMPLE_PRIMARY_AVATAR } from '@/test/onboardingCompletion';
import { WelcomeStep } from '../steps/WelcomeStep';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

const PROGRESS_KEY = 'avating:onboarding:progress';
const METHOD_KEY = 'avating:onboarding:method';

function renderWithPrimary(primary: AvatarSummary | null = null) {
  return renderWithProviders(<WelcomeStep />, {
    queryClient: queryClientWithPrimaryAvatar(primary),
  });
}

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
        '3성향 설문',
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
      renderWithPrimary();

      await user.click(screen.getByRole('button', { name: /아바타 만들기/ }));

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/intro');
      expect(localStorage.getItem(PROGRESS_KEY)).toBe('intro');
    });

    it('"아바타 만들기" CTA 는 Enter 키로도 트리거된다', async () => {
      const user = userEvent.setup();
      renderWithPrimary();

      const button = screen.getByRole('button', { name: /아바타 만들기/ });
      button.focus();
      await user.keyboard('{Enter}');

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/intro');
    });

    it('"Bot 연동" 클릭 시 method=connect 사전선택 + /onboarding/intro 로 이동한다', async () => {
      const user = userEvent.setup();
      renderWithPrimary();

      await user.click(screen.getByRole('button', { name: /Bot 연동/ }));

      expect(localStorage.getItem(METHOD_KEY)).toBe('connect');
      expect(localStorage.getItem(PROGRESS_KEY)).toBe('intro');
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/intro');
    });
  });

  // 진행 기록이 남아 있으면 처음이 아니라 "멈춘 자리"로 이어져야 한다.
  // 예전에는 무조건 /onboarding/intro 로 보냈고, intro 가드가 그걸 다시 튕겨내
  // 사용자 눈에는 버튼이 죽은 것처럼 보였다.
  describe('진행 기록이 있을 때 이어서 진행', () => {
    it('method 까지 진행했으면 방법 선택 화면으로 이어진다', async () => {
      localStorage.setItem(PROGRESS_KEY, 'method');
      const user = userEvent.setup();
      renderWithPrimary();

      await user.click(screen.getByRole('button', { name: /아바타 만들기/ }));

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/method');
    });

    it('설문 진행 중이었으면 설문 화면으로 이어진다', async () => {
      localStorage.setItem(PROGRESS_KEY, 'creating');
      localStorage.setItem(METHOD_KEY, 'survey');
      const user = userEvent.setup();
      renderWithPrimary();

      await user.click(screen.getByRole('button', { name: /아바타 만들기/ }));

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/survey');
    });

    it('"Bot 연동" 도 진행 기록을 따라 이어진다', async () => {
      localStorage.setItem(PROGRESS_KEY, 'creating');
      const user = userEvent.setup();
      renderWithPrimary();

      await user.click(screen.getByRole('button', { name: /Bot 연동/ }));

      expect(localStorage.getItem(METHOD_KEY)).toBe('connect');
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/connect');
    });

    // 완료 판정의 정본은 진행 기록이 아니라 대표 아바타 보유 여부다.
    it('대표 아바타가 이미 있으면 진행 기록과 무관하게 확인 화면으로 보낸다', async () => {
      localStorage.setItem(PROGRESS_KEY, 'intro');
      const user = userEvent.setup();
      renderWithPrimary(SAMPLE_PRIMARY_AVATAR);

      await user.click(screen.getByRole('button', { name: /아바타 만들기/ }));

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/complete');
    });
  });
});
