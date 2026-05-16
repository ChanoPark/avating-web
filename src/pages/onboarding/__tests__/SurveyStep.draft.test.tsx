import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@shared/mocks/server';
import { surveyQuestionsHandlers, surveySubmitHandlers } from '@shared/mocks/handlers/onboarding';
import { SurveyStep } from '@features/persona-survey/ui/SurveyStep';

const DRAFT_KEY = 'avating:onboarding:survey-draft';
const MOCK_Q1_TITLE = /첫 데이트가 끝날 무렵/i;
const MOCK_Q2_TITLE = /팀장님 때문에/i;
const MOCK_Q1_ANS1 = /속으로만 생각하고 기다린다/i;
const MOCK_Q2_ANS1 = /상황 파악 우선/i;

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

describe('SurveyStep — draft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('avating:onboarding:progress', 'creating');
    server.use(surveyQuestionsHandlers.success, surveySubmitHandlers.success);
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

  describe('draft 삭제', () => {
    it('제출 성공 시 localStorage draft 가 삭제된다', async () => {
      const draft = {
        savedAt: new Date().toISOString(),
        value: {
          answers: {
            AFFECTION_EXPRESSION_0001: 'AFFECTION_EXPRESSION_0001_ANS_1',
            EMPATHY_0001: 'EMPATHY_0001_ANS_1',
          },
        },
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));

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

      await user.click(screen.getByRole('radio', { name: MOCK_Q2_ANS1 }));
      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/아바타 이름/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/아바타 이름/i), '루나');
      await user.click(screen.getByRole('button', { name: /아바타 생성/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding/complete');
      });

      expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
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
});
