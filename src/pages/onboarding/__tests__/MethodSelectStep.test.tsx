import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { queryClientWithPrimaryAvatar, SAMPLE_PRIMARY_AVATAR } from '@/test/onboardingCompletion';
import { MethodSelectStep } from '../steps/MethodSelectStep';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

describe('MethodSelectStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('avating:onboarding:progress', 'method');
  });

  describe('렌더링', () => {
    it('서브 카피가 렌더되고 STEP 라벨은 카드에 없다 (진행 표시는 레일 담당)', () => {
      renderWithProviders(<MethodSelectStep />);
      expect(
        screen.getByText('선택한 방법으로 성향을 분석해요. 이후 튜닝으로 조정할 수 있습니다.')
      ).toBeInTheDocument();
      expect(screen.queryByText(/STEP 2 \/ 4/)).not.toBeInTheDocument();
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

    it('이전 세션에서 method=connect 가 저장돼 있으면 ChatGPT Bot 으로 복원된다', () => {
      localStorage.setItem('avating:onboarding:method', 'connect');
      renderWithProviders(<MethodSelectStep />);
      expect(screen.getByRole('radio', { name: /ChatGPT Bot 연동/ })).toBeChecked();
      expect(screen.getByRole('radio', { name: /성향 설문/ })).not.toBeChecked();
    });

    it('스탯 직접 수정 불가 경고 배너가 렌더된다', () => {
      renderWithProviders(<MethodSelectStep />);
      expect(
        screen.getByText(
          /생성된 아바타의 스탯은 직접 수정할 수 없어요\. 이후 튜닝 기능으로 다듬습니다\./
        )
      ).toBeInTheDocument();
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

    it('ChatGPT Bot 선택 후 성향 설문으로 다시 전환할 수 있다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MethodSelectStep />);

      await user.click(screen.getByRole('radio', { name: /ChatGPT Bot 연동/ }));
      expect(screen.getByRole('radio', { name: /ChatGPT Bot 연동/ })).toBeChecked();

      await user.click(screen.getByRole('radio', { name: /성향 설문/ }));
      expect(screen.getByRole('radio', { name: /성향 설문/ })).toBeChecked();
      expect(screen.getByRole('radio', { name: /ChatGPT Bot 연동/ })).not.toBeChecked();
    });

    it('성향 설문 선택 후 다음 → /onboarding/survey 로 이동하고 method=survey + progress=creating 가 저장된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MethodSelectStep />);

      await user.click(screen.getByRole('button', { name: /다음/ }));

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/survey');
      expect(localStorage.getItem('avating:onboarding:method')).toBe('survey');
      expect(localStorage.getItem('avating:onboarding:progress')).toBe('creating');
    });

    it('ChatGPT Bot 선택 후 다음 → /onboarding/connect 로 이동하고 method=connect + progress=creating 가 저장된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MethodSelectStep />);

      await user.click(screen.getByRole('radio', { name: /ChatGPT Bot 연동/ }));
      await user.click(screen.getByRole('button', { name: /다음/ }));

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/connect');
      expect(localStorage.getItem('avating:onboarding:method')).toBe('connect');
      expect(localStorage.getItem('avating:onboarding:progress')).toBe('creating');
    });

    it('이전 → /onboarding/intro 로 이동 (와이어프레임 v2: 직전 단계는 이름·설명)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MethodSelectStep />);

      await user.click(screen.getByRole('button', { name: /이전/ }));

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/intro');
    });
  });

  describe('진입 가드', () => {
    it('progress 가 welcome 이면 /onboarding/welcome 으로 redirect 한다', () => {
      localStorage.setItem('avating:onboarding:progress', 'welcome');
      renderWithProviders(<MethodSelectStep />);
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/welcome', { replace: true });
    });

    it('progress 가 intro 이면 /onboarding/intro 로 redirect 한다 (이름·설명 미완료 시 진입 차단)', () => {
      localStorage.setItem('avating:onboarding:progress', 'intro');
      renderWithProviders(<MethodSelectStep />);
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/intro', { replace: true });
    });

    it('progress 가 complete 이고 대표 아바타가 있으면 /onboarding/complete 로 redirect 한다', () => {
      localStorage.setItem('avating:onboarding:progress', 'complete');
      renderWithProviders(<MethodSelectStep />, {
        queryClient: queryClientWithPrimaryAvatar(SAMPLE_PRIMARY_AVATAR),
      });
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/complete', { replace: true });
    });

    // 진행 기록의 complete 는 완료를 보장하지 않는다 — 아바타 없이도 올라가던 경로가 있었다.
    // 이때는 아직 생성 중인 것으로 보고 creating 과 같게 다룬다. 확인 화면으로 되돌리면
    // 그 화면이 다시 여기로 보내 왕복이 된다.
    it('progress 가 complete 여도 대표 아바타가 없으면 고른 방법의 화면으로 이어준다', () => {
      localStorage.setItem('avating:onboarding:progress', 'complete');
      localStorage.setItem('avating:onboarding:method', 'survey');
      renderWithProviders(<MethodSelectStep />, {
        queryClient: queryClientWithPrimaryAvatar(null),
      });
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/survey', { replace: true });
      expect(mockNavigate).not.toHaveBeenCalledWith('/onboarding/complete', { replace: true });
    });

    it('progress 가 complete 여도 대표 아바타·방법 기록이 모두 없으면 방법 선택 화면에 머문다', () => {
      localStorage.setItem('avating:onboarding:progress', 'complete');
      renderWithProviders(<MethodSelectStep />, {
        queryClient: queryClientWithPrimaryAvatar(null),
      });
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(
        screen.getByRole('heading', { level: 1, name: /어떻게 아바타를 만들까요/ })
      ).toBeInTheDocument();
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

    it('progress=creating + method=null 비정상 복구 경로에서는 redirect 없이 메소드 선택 화면이 표시된다', () => {
      localStorage.setItem('avating:onboarding:progress', 'creating');
      localStorage.removeItem('avating:onboarding:method');
      renderWithProviders(<MethodSelectStep />);
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(
        screen.getByRole('heading', { level: 1, name: /어떻게 아바타를 만들까요/ })
      ).toBeInTheDocument();
    });
  });
});
