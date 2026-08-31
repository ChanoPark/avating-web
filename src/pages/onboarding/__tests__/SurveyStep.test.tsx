import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { queryClientWithPrimaryAvatar, SAMPLE_PRIMARY_AVATAR } from '@/test/onboardingCompletion';
import { server } from '@shared/mocks/server';
import { surveyQuestionsHandlers, surveySubmitHandlers } from '@shared/mocks/handlers/onboarding';
import { saveDraft } from '@features/persona-survey/lib/draftStorage';
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

function seedNameDraft() {
  saveDraft({ answers: {}, avatarName: '루나', description: '차분한 분석가' });
}

async function goToExpressionsPage(user: ReturnType<typeof userEvent.setup>) {
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

describe('SurveyStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('avating:onboarding:progress', 'creating');
    server.use(surveyQuestionsHandlers.success, surveySubmitHandlers.success);
  });

  describe('진입 가드', () => {
    it('progress 가 welcome 이면 /onboarding/welcome 으로 redirect 한다', async () => {
      localStorage.setItem('avating:onboarding:progress', 'welcome');
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding/welcome', { replace: true });
      });
    });

    it('progress 가 intro 이면 /onboarding/intro 로 redirect 한다', async () => {
      localStorage.setItem('avating:onboarding:progress', 'intro');
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding/intro', { replace: true });
      });
    });

    // 레거시 'method' 기록은 creating 으로 마이그레이션된다 — 되돌릴 곳이 없어 그대로 보여준다.
    it('레거시 method 기록이면 redirect 없이 설문을 이어서 보여준다', async () => {
      localStorage.setItem('avating:onboarding:progress', 'method');
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('progress 가 complete 이고 대표 아바타가 있으면 /onboarding/complete 로 redirect 한다', async () => {
      localStorage.setItem('avating:onboarding:progress', 'complete');
      renderWithProviders(<SurveyStep />, {
        initialRoute: '/onboarding/survey',
        queryClient: queryClientWithPrimaryAvatar(SAMPLE_PRIMARY_AVATAR),
      });
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding/complete', { replace: true });
      });
    });

    // 진행 기록의 complete 는 완료를 보장하지 않는다 — 확인 화면으로 되돌리면 대표 아바타
    // 없는 확인 화면이 다시 여기로 보내 왕복이 된다.
    it('progress 가 complete 여도 대표 아바타가 없으면 설문을 이어서 보여준다', async () => {
      localStorage.setItem('avating:onboarding:progress', 'complete');
      renderWithProviders(<SurveyStep />, {
        initialRoute: '/onboarding/survey',
        queryClient: queryClientWithPrimaryAvatar(null),
      });

      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });
      expect(mockNavigate).not.toHaveBeenCalledWith('/onboarding/complete', { replace: true });
    });

    it('progress 가 creating 이면 redirect 없이 질문이 노출된다', async () => {
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('와이어프레임 헤더', () => {
    it('질문 문장이 카드 제목(h1)으로 렌더되고 STEP 라벨은 없다 (진행 표시는 레일 담당)', async () => {
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });
      expect(screen.queryByText(/STEP 3 \/ 4/)).not.toBeInTheDocument();
    });

    it('진행 카운터가 "현재 페이지 / 전체 페이지" 로 렌더된다 (표현 단계 포함)', async () => {
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await waitFor(() => {
        expect(screen.getByRole('group', { name: MOCK_Q1_TITLE })).toBeInTheDocument();
      });
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
      expect(screen.getByText('33%')).toBeInTheDocument();
    });

    it('설문 진행률 progressbar 가 렌더된다 (aria-valuemax=100)', async () => {
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await waitFor(() => {
        const bar = screen.getByRole('progressbar', { name: /설문 진행률/ });
        expect(bar).toHaveAttribute('aria-valuemax', '100');
      });
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

  describe('관심사 · 표현 페이지 (선택)', () => {
    it('모든 질문 답변 후 관심사·표현 페이지가 노출된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await goToExpressionsPage(user);
      expect(screen.getByLabelText('관심사 태그 입력')).toBeInTheDocument();
      expect(screen.getByLabelText('자주 쓰는 표현 입력')).toBeInTheDocument();
      expect(screen.getByText('A · 설문으로 만들기 — 선택 문항')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: '관심사와 자주 쓰는 말투를 알려주세요' })
      ).toBeInTheDocument();
      expect(screen.getByText('3 / 3 · 선택 문항')).toBeInTheDocument();
    });

    it('선택 단계이므로 표현 미입력이어도 "아바타 생성" 버튼이 활성화된다', async () => {
      const user = userEvent.setup();
      seedNameDraft();
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await goToExpressionsPage(user);
      expect(screen.getByRole('button', { name: /아바타 생성/i })).toBeEnabled();
    });

    it('"건너뛰기" 버튼이 노출된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await goToExpressionsPage(user);
      expect(screen.getByRole('button', { name: /건너뛰기/ })).toBeInTheDocument();
    });
  });

  describe('최종 제출', () => {
    it('"아바타 생성" 클릭 시 POST /api/avatars/survey 가 호출되고 /onboarding/complete 로 이동한다', async () => {
      const user = userEvent.setup();
      let createCallCount = 0;
      seedNameDraft();

      server.use(
        surveyQuestionsHandlers.success,
        http.post(`${BASE_URL}/api/avatars/survey`, () => {
          createCallCount++;
          // 2026-08-30 계약: 생성 응답은 AvatarSummaryResponse 전체다.
          return HttpResponse.json(
            {
              data: {
                schemaVersion: 1,
                avatarId: 'a1111111-1111-4111-8111-111111111111',
                name: '루나',
                description: '소개글',
                stats: { OPENNESS: 70, EMPATHY: 60 },
                tags: [],
              },
            },
            { status: 201 }
          );
        })
      );

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await goToExpressionsPage(user);

      await user.click(screen.getByRole('button', { name: /아바타 생성/i }));

      await waitFor(() => {
        expect(createCallCount).toBe(1);
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding/complete');
      });
    });

    it('"건너뛰기" 클릭으로도 제출되고 /onboarding/complete 로 이동한다', async () => {
      const user = userEvent.setup();
      seedNameDraft();

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await goToExpressionsPage(user);

      await user.click(screen.getByRole('button', { name: /건너뛰기/ }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding/complete');
      });
    });

    it('제출 진행 중 "아바타 생성" 버튼이 "생성 중..." 으로 바뀌고 disabled 된다', async () => {
      const user = userEvent.setup();
      seedNameDraft();

      server.use(
        surveyQuestionsHandlers.success,
        http.post(`${BASE_URL}/api/avatars/survey`, async () => {
          await new Promise(() => undefined);
        })
      );

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await goToExpressionsPage(user);

      await user.click(screen.getByRole('button', { name: /아바타 생성/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /생성 중/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /생성 중/i })).toBeDisabled();
      });
    });

    it('서버 오류 응답 시 에러 메시지가 노출되고 navigate 는 호출되지 않는다', async () => {
      const user = userEvent.setup();
      seedNameDraft();
      server.use(surveyQuestionsHandlers.success, surveySubmitHandlers.serverError);

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });
      await goToExpressionsPage(user);

      await user.click(screen.getByRole('button', { name: /아바타 생성/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('border-danger');
      expect(mockNavigate).not.toHaveBeenCalledWith('/onboarding/complete');
    });
  });
});
