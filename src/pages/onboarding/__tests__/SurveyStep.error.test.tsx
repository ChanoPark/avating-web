import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@shared/mocks/server';
import { surveyQuestionsHandlers, surveySubmitHandlers } from '@shared/mocks/handlers/onboarding';
import { SurveyStep } from '@features/persona-survey/ui/SurveyStep';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const MOCK_Q1_TITLE = /첫 데이트가 끝날 무렵/i;
const MOCK_Q2_TITLE = /팀장님 때문에/i;
const MOCK_Q1_ANS1 = /속으로만 생각하고 기다린다/i;
const MOCK_Q2_ANS1 = /상황 파악 우선/i;

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

async function navigateToNamePage(user: ReturnType<typeof userEvent.setup>) {
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
}

describe('SurveyStep — 에러 처리', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    server.use(surveyQuestionsHandlers.success, surveySubmitHandlers.success);
  });

  describe('질문 로딩 중', () => {
    it('요청 중에는 로딩 텍스트가 표시된다', () => {
      server.use(
        http.get(`${BASE_URL}/api/persona/survey/questions`, async () => {
          await delay('infinite');
        })
      );

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      expect(screen.getByText(/질문을 불러오는 중/i)).toBeInTheDocument();
    });
  });

  describe('질문 로딩 실패', () => {
    it('서버 오류 시 에러 메시지가 노출된다', async () => {
      server.use(surveyQuestionsHandlers.serverError);

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      await waitFor(() => {
        expect(screen.getByText(/불러오지 못했습니다/i)).toBeInTheDocument();
      });
    });

    it('"다시 시도" 클릭 시 재요청 후 질문이 노출된다', async () => {
      let callCount = 0;
      server.use(
        http.get(`${BASE_URL}/api/persona/survey/questions`, () => {
          callCount += 1;
          if (callCount === 1) {
            return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
          }
          return HttpResponse.json({
            data: [
              {
                id: 'AFFECTION_EXPRESSION_0001',
                title: '첫 데이트가 끝날 무렵 호감을 표현해야 할 때',
                primaryType: 'AFFECTION_EXPRESSION',
                questionType: 'SINGLE_CHOICE_5',
                answers: [
                  {
                    answerId: 'AFFECTION_EXPRESSION_0001_ANS_1',
                    text: '속으로만 생각하고 기다린다',
                  },
                ],
              },
            ],
          });
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      await waitFor(() => {
        expect(screen.getByText(/불러오지 못했습니다/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /다시 시도/i }));

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });
      expect(callCount).toBe(2);
    });
  });

  describe('제출 에러 처리', () => {
    it('API 에러 응답 시 서버 에러 메시지가 alert 로 표시되고 border-danger 시각 상태가 적용된다', async () => {
      const user = userEvent.setup();

      server.use(
        surveyQuestionsHandlers.success,
        http.post(`${BASE_URL}/api/avatars/survey/`, () => {
          return HttpResponse.json({ message: '알 수 없는 오류' }, { status: 500 });
        })
      );

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await navigateToNamePage(user);

      await user.type(screen.getByLabelText(/아바타 이름/i), '루나');
      await user.click(screen.getByRole('button', { name: /아바타 생성/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('border-danger');
      expect(alert).toHaveClass('text-danger');
      expect(alert.textContent ?? '').toMatch(/알 수 없는 오류/);
    });

    it('응답 avatarId 누락 시 ZodError 경로 UI 메시지 "입력 데이터를 다시 확인해주세요." 가 alert 로 렌더된다', async () => {
      server.use(
        surveyQuestionsHandlers.success,
        http.post(`${BASE_URL}/api/avatars/survey/`, () => {
          return HttpResponse.json({ data: {} }, { status: 201 });
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await navigateToNamePage(user);

      await user.type(screen.getByLabelText(/아바타 이름/i), '루나');
      await user.click(screen.getByRole('button', { name: /아바타 생성/i }));

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toContain('입력 데이터를 다시 확인해주세요.');
      });

      expect(mockNavigate).not.toHaveBeenCalledWith('/onboarding/connect');
    });
  });
});
