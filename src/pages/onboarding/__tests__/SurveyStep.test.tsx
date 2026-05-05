import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@shared/mocks/server';
import { surveyQuestionsHandlers, surveySubmitHandlers } from '@shared/mocks/handlers/onboarding';
import { SurveyStep } from '@features/persona-survey/ui/SurveyStep';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

const MOCK_Q1_TITLE = /첫 데이트가 끝날 무렵/i;
const MOCK_Q2_TITLE = /팀장님 때문에/i;
const MOCK_Q1_ANS1 = /속으로만 생각하고 기다린다/i;
const MOCK_Q2_ANS1 = /상황 파악 우선/i;

describe('SurveyStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    server.use(surveyQuestionsHandlers.success, surveySubmitHandlers.success);
  });

  describe('진입 가드', () => {
    it('progress 가 connect 이면 /onboarding/connect 로 redirect 한다', async () => {
      localStorage.setItem('avating:onboarding:progress', 'connect');

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding/connect', { replace: true });
      });
    });

    it('progress 가 complete 이면 /onboarding/complete 로 redirect 한다', async () => {
      localStorage.setItem('avating:onboarding:progress', 'complete');

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding/complete', { replace: true });
      });
    });

    it('progress 가 welcome 이면 redirect 없이 질문이 노출된다', async () => {
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalledWith('/onboarding/connect', { replace: true });
      expect(mockNavigate).not.toHaveBeenCalledWith('/onboarding/complete', { replace: true });
    });
  });

  describe('질문 로딩', () => {
    it('첫 번째 질문이 노출된다', async () => {
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });
    });

    it('두 번째 질문은 첫 페이지에서 노출되지 않는다', async () => {
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });

      expect(screen.queryByRole('group', { name: MOCK_Q2_TITLE })).not.toBeInTheDocument();
    });
  });

  describe('진행 버튼 상태', () => {
    it('미선택 상태에서 "다음" 버튼이 disabled 이다', async () => {
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /다음/i })).toBeDisabled();
    });

    it('답변 선택 시 "다음" 버튼이 활성화된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('radio', { name: MOCK_Q1_ANS1 }));

      expect(screen.getByRole('button', { name: /다음/i })).toBeEnabled();
    });
  });

  describe('페이지 이동', () => {
    it('답변 선택 후 "다음" 클릭 시 두 번째 질문으로 이동한다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('radio', { name: MOCK_Q1_ANS1 }));
      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q2_TITLE })).toBeInTheDocument();
      });
    });

    it('"이전" 클릭 시 이전 답이 유지된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('radio', { name: MOCK_Q1_ANS1 }));
      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q2_TITLE })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /이전/i }));

      await waitFor(() => {
        const radio = screen.getByRole('radio', { name: MOCK_Q1_ANS1 }) as HTMLInputElement;
        expect(radio.checked).toBe(true);
      });
    });

    it('첫 페이지에서는 "이전" 버튼이 없다', async () => {
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /이전/i })).not.toBeInTheDocument();
    });
  });

  describe('아바타 이름 페이지', () => {
    const goToAvatarPage = async (user: ReturnType<typeof userEvent.setup>) => {
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('radio', { name: MOCK_Q1_ANS1 }));
      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q2_TITLE })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('radio', { name: MOCK_Q2_ANS1 }));
      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/아바타 이름/i)).toBeInTheDocument();
      });
    };

    it('모든 질문 답변 후 아바타 이름 입력 페이지가 노출된다', async () => {
      const user = userEvent.setup();
      await goToAvatarPage(user);
    });

    it('이름 미입력 시 "아바타 생성" 버튼이 disabled 이다', async () => {
      const user = userEvent.setup();
      await goToAvatarPage(user);

      expect(screen.getByRole('button', { name: /아바타 생성/i })).toBeDisabled();
    });

    it('avatarName 입력 필드에 maxLength 50 이 적용된다', async () => {
      const user = userEvent.setup();
      await goToAvatarPage(user);

      expect(screen.getByLabelText(/아바타 이름/i)).toHaveAttribute('maxLength', '50');
    });

    it('이름 입력 시 "아바타 생성" 버튼이 활성화된다', async () => {
      const user = userEvent.setup();
      await goToAvatarPage(user);

      await user.type(screen.getByLabelText(/아바타 이름/i), '루나');

      expect(screen.getByRole('button', { name: /아바타 생성/i })).toBeEnabled();
    });
  });

  describe('최종 제출', () => {
    it('"아바타 생성" 클릭 시 POST /api/avatars/survey/ 가 호출되고 /onboarding/connect 로 이동한다', async () => {
      const user = userEvent.setup();
      let createCallCount = 0;

      server.use(
        surveyQuestionsHandlers.success,
        http.post(`${BASE_URL}/api/avatars/survey/`, () => {
          createCallCount++;
          return HttpResponse.json({ data: { avatarId: 'avatar-001' } }, { status: 201 });
        })
      );

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('radio', { name: MOCK_Q1_ANS1 }));
      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q2_TITLE })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('radio', { name: MOCK_Q2_ANS1 }));
      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/아바타 이름/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/아바타 이름/i), '루나');
      await user.click(screen.getByRole('button', { name: /아바타 생성/i }));

      await waitFor(() => {
        expect(createCallCount).toBe(1);
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding/connect');
      });
    });

    it('제출 진행 중 "아바타 생성" 버튼이 "생성 중..." 텍스트로 변경되고 disabled 된다', async () => {
      const user = userEvent.setup();

      server.use(
        surveyQuestionsHandlers.success,
        http.post(`${BASE_URL}/api/avatars/survey/`, async () => {
          await new Promise(() => undefined);
        })
      );

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('radio', { name: MOCK_Q1_ANS1 }));
      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q2_TITLE })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('radio', { name: MOCK_Q2_ANS1 }));
      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/아바타 이름/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/아바타 이름/i), '루나');
      await user.click(screen.getByRole('button', { name: /아바타 생성/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /생성 중/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /생성 중/i })).toBeDisabled();
      });
    });

    it('서버 오류 응답 시 에러 메시지가 노출되고 navigate 는 호출되지 않는다', async () => {
      const user = userEvent.setup();

      server.use(surveyQuestionsHandlers.success, surveySubmitHandlers.serverError);

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('radio', { name: MOCK_Q1_ANS1 }));
      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q2_TITLE })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('radio', { name: MOCK_Q2_ANS1 }));
      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/아바타 이름/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/아바타 이름/i), '루나');
      await user.click(screen.getByRole('button', { name: /아바타 생성/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('border-danger');
      expect(alert.textContent ?? '').not.toBe('');
      expect(mockNavigate).not.toHaveBeenCalledWith('/onboarding/connect');
    });
  });
});
// draft·에러 처리 테스트는 파일 크기 분리 정책에 따라 별도 파일로 유지:
//   SurveyStep.draft.test.tsx  — draft 저장/복원
//   SurveyStep.error.test.tsx  — 질문 로드 실패, 제출 에러, ZodError UI
