import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@shared/mocks/server';
import { surveyQuestionsHandlers, surveySubmitHandlers } from '@shared/mocks/handlers/onboarding';
import { saveDraft } from '@features/persona-survey/lib/draftStorage';
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

function seedNameDraft() {
  saveDraft({ answers: {}, avatarName: '루나', description: '차분히 듣고 깊게 답합니다' });
}

async function navigateToExpressionsPage(user: ReturnType<typeof userEvent.setup>) {
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
    expect(screen.getByLabelText('자주 쓰는 표현 입력')).toBeInTheDocument();
  });
}

describe('SurveyStep — 에러 처리', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('avating:onboarding:progress', 'creating');
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
        expect(screen.getByText(/불러오지 못했어요/i)).toBeInTheDocument();
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
        expect(screen.getByText(/불러오지 못했어요/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /다시 시도/i }));

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });
      expect(callCount).toBe(2);
    });
  });

  describe('제출 에러 처리', () => {
    // 사용자가 고칠 수 없는 실패다 — 서버 문구를 그대로 띄우면 입력이 잘못된 것처럼 읽힌다.
    const findFailureModal = () =>
      screen.findByRole('dialog', { name: '아바타를 만들지 못했어요' });

    it('서버 5xx 응답 시 인라인 alert 대신 실패 모달이 뜬다', async () => {
      const user = userEvent.setup();
      seedNameDraft();
      server.use(surveyQuestionsHandlers.success, surveySubmitHandlers.serverError);

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await navigateToExpressionsPage(user);
      await user.click(screen.getByRole('button', { name: /아바타 생성/i }));

      expect(await findFailureModal()).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalledWith('/onboarding/complete');
    });

    it('AVATAR_400_002 응답 시 서버 문구를 노출하지 않고 실패 모달이 뜬다', async () => {
      const user = userEvent.setup();
      seedNameDraft();
      server.use(surveyQuestionsHandlers.success, surveySubmitHandlers.validationError);

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await navigateToExpressionsPage(user);
      await user.click(screen.getByRole('button', { name: /아바타 생성/i }));

      expect(await findFailureModal()).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalledWith('/onboarding/complete');
      expect(screen.queryByText(/유효하지 않은 설문 답변/)).not.toBeInTheDocument();
    });

    it('응답 스키마 파싱 실패(ZodError)도 실패 모달로 처리한다', async () => {
      const user = userEvent.setup();
      seedNameDraft();
      server.use(
        surveyQuestionsHandlers.success,
        http.post(`${BASE_URL}/api/avatars/survey`, () => {
          return HttpResponse.json({ data: {} }, { status: 201 });
        })
      );

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await navigateToExpressionsPage(user);
      await user.click(screen.getByRole('button', { name: /아바타 생성/i }));

      expect(await findFailureModal()).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalledWith('/onboarding/complete');
    });

    it('실패 모달의 "다시 시도" 로 재요청이 성공하면 완료 화면으로 이동한다', async () => {
      let callCount = 0;
      server.use(
        surveyQuestionsHandlers.success,
        http.post(`${BASE_URL}/api/avatars/survey`, async (info) => {
          callCount += 1;
          if (callCount === 1) {
            return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
          }
          return surveySubmitHandlers.success.resolver(info);
        })
      );

      const user = userEvent.setup();
      seedNameDraft();
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await navigateToExpressionsPage(user);
      await user.click(screen.getByRole('button', { name: /아바타 생성/i }));
      expect(await findFailureModal()).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '다시 시도' }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding/complete');
      });
      expect(callCount).toBe(2);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('실패 모달의 "닫기" 는 모달만 닫고 설문 화면에 머문다', async () => {
      const user = userEvent.setup();
      seedNameDraft();
      server.use(surveyQuestionsHandlers.success, surveySubmitHandlers.serverError);

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await navigateToExpressionsPage(user);
      await user.click(screen.getByRole('button', { name: /아바타 생성/i }));
      expect(await findFailureModal()).toBeInTheDocument();

      await user.click(screen.getAllByRole('button', { name: '닫기' })[0]!);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /아바타 생성/i })).toBeInTheDocument();
    });

    // 이름 중복은 사용자가 1단계에서 고칠 수 있는 실패라 모달이 아니라 인라인으로 알린다.
    it('AVATAR_409_002(이름 중복) 응답은 모달 없이 border-danger-mark alert 로 표시된다', async () => {
      const user = userEvent.setup();
      seedNameDraft();
      server.use(
        surveyQuestionsHandlers.success,
        http.post(`${BASE_URL}/api/avatars/survey`, () => {
          return HttpResponse.json(
            { code: 'AVATAR_409_002', message: '동일한 아바타 이름이 존재합니다.' },
            { status: 409 }
          );
        })
      );

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await navigateToExpressionsPage(user);
      await user.click(screen.getByRole('button', { name: /아바타 생성/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('동일한 아바타 이름이 존재합니다.');
      });
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('border-danger-mark');
      expect(alert).toHaveClass('text-danger');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // 이름·설명 입력 필드는 IntroStep 에만 있어 이 화면에는 필드 에러를 표시할 자리가 없다 — 그래서 alert 로 안내한다.
    it('draft 에 설명이 없으면 제출 시 1단계로 돌아가라는 안내가 alert 로 렌더된다', async () => {
      const user = userEvent.setup();
      saveDraft({ answers: {}, avatarName: '루나', description: '' });

      server.use(surveyQuestionsHandlers.success);

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await navigateToExpressionsPage(user);

      await user.click(screen.getByRole('button', { name: /아바타 생성/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/1단계로 돌아가 입력해주세요/);
      });
      expect(mockNavigate).not.toHaveBeenCalledWith('/onboarding/complete');
    });
  });
});
