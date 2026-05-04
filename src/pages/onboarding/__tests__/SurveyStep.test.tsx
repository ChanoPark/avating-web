import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@shared/mocks/server';
import { surveyQuestionsHandlers, surveySubmitHandlers } from '@shared/mocks/handlers/onboarding';
import { SurveyStep } from '@features/persona-survey/ui/SurveyStep';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const DRAFT_KEY = 'avating:onboarding:survey-draft';

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

  describe('draft 디바운스 저장', () => {
    it('답변 선택 후 300ms 경과 시 localStorage 에 답변이 기록된다', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('radio', { name: MOCK_Q1_ANS1 }));

      await vi.advanceTimersByTimeAsync(350);

      const raw = localStorage.getItem(DRAFT_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!) as { value: { answers: Record<string, string> } };
      expect(parsed.value.answers).toMatchObject({
        AFFECTION_EXPRESSION_0001: 'AFFECTION_EXPRESSION_0001_ANS_1',
      });

      vi.useRealTimers();
    });
  });

  describe('draft 복원', () => {
    it('localStorage draft 에 저장된 답이 라디오에 체크된다', async () => {
      const draft = {
        savedAt: new Date().toISOString(),
        value: {
          answers: { AFFECTION_EXPRESSION_0001: 'AFFECTION_EXPRESSION_0001_ANS_2' },
        },
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });

      const radio = screen.getByRole('radio', {
        name: /기본 인사만 깍듯이 한다/i,
      }) as HTMLInputElement;
      expect(radio.checked).toBe(true);
    });

    it('draft 에 avatarName 과 description 이 있으면 아바타 이름 페이지에서 복원된다', async () => {
      const draft = {
        savedAt: new Date().toISOString(),
        value: {
          answers: {
            AFFECTION_EXPRESSION_0001: 'AFFECTION_EXPRESSION_0001_ANS_1',
            EMPATHY_0001: 'EMPATHY_0001_ANS_1',
          },
          avatarName: '루나',
          description: '내향적인 아바타',
        },
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));

      const user = userEvent.setup();
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q2_TITLE })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/아바타 이름/i)).toBeInTheDocument();
      });

      expect((screen.getByLabelText(/아바타 이름/i) as HTMLInputElement).value).toBe('루나');
      expect(screen.getByPlaceholderText(/간단히 소개/i)).toHaveValue('내향적인 아바타');
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
      expect(alert).toHaveClass('text-danger');
      expect(alert.textContent ?? '').toMatch(/알 수 없는 오류/);
    });
  });
});
