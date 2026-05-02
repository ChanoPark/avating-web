import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@shared/mocks/server';
import { surveyHandlers, surveyDraftHandlers } from '@shared/mocks/handlers/onboarding';
import { SurveyStep } from '@features/persona-survey/ui/SurveyStep';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const DRAFT_KEY = 'avating:onboarding:survey-draft';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

describe('SurveyStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    server.use(surveyHandlers.success, surveyDraftHandlers.success);
  });

  describe('페이지 1 렌더링', () => {
    it('q1, q2 라디오 그룹이 노출된다', () => {
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      expect(screen.getByRole('group', { name: /모임에서/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /호감 있는/i })).toBeInTheDocument();
    });

    it('q3~q6 라디오 그룹은 노출되지 않는다', () => {
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      expect(screen.queryByRole('group', { name: /데이트 장소/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('group', { name: /대화 스타일/i })).not.toBeInTheDocument();
    });
  });

  describe('진행 버튼 상태', () => {
    it('q1, q2 미선택 상태에서 "다음" 버튼이 disabled 상태이다', () => {
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      expect(screen.getByRole('button', { name: /다음/i })).toBeDisabled();
    });

    it('q1 만 선택한 경우 "다음" 버튼이 disabled 상태이다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      const q1Options = screen.getAllByRole('radio');
      await user.click(q1Options[0]);

      expect(screen.getByRole('button', { name: /다음/i })).toBeDisabled();
    });

    it('q1, q2 모두 선택하면 "다음" 버튼이 활성화된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      const radios = screen.getAllByRole('radio');
      await user.click(radios[0]);

      const q2Radios = screen.getAllByRole('radio').filter((r) => r.getAttribute('name') === 'q2');
      await user.click(q2Radios[0]);

      expect(screen.getByRole('button', { name: /다음/i })).toBeEnabled();
    });
  });

  describe('페이지 이동', () => {
    it('두 질문 선택 후 "다음" 클릭 시 페이지 2 로 이동한다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      const radios = screen.getAllByRole('radio');
      const q1Radios = radios.filter((r) => r.getAttribute('name') === 'q1');
      const q2Radios = radios.filter((r) => r.getAttribute('name') === 'q2');

      await user.click(q1Radios[0]);
      await user.click(q2Radios[0]);
      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(screen.getByRole('group', { name: /데이트 장소/i })).toBeInTheDocument();
      });
    });

    it('페이지 2에서 "이전" 클릭 시 페이지 1 의 이전 답이 보존된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      const radios = screen.getAllByRole('radio');
      const q1Radios = radios.filter((r) => r.getAttribute('name') === 'q1');
      const q2Radios = radios.filter((r) => r.getAttribute('name') === 'q2');

      await user.click(q1Radios[0]);
      await user.click(q2Radios[0]);
      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(screen.queryByRole('group', { name: /데이트 장소/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /이전/i }));

      await waitFor(() => {
        const q1Radio = screen
          .getAllByRole('radio')
          .find((r) => r.getAttribute('name') === 'q1' && (r as HTMLInputElement).checked);
        expect(q1Radio).toBeDefined();
      });
    });
  });

  describe('draft 복원', () => {
    it('localStorage에 draft 주입 후 진입 시 복원된 답이 라디오에 체크된다', () => {
      const draft = {
        savedAt: new Date().toISOString(),
        value: { q1: 'solo', q2: 'wait' },
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      const q1SoloRadio = screen
        .getAllByRole('radio')
        .find((r) => r.getAttribute('name') === 'q1' && r.getAttribute('value') === 'solo') as
        | HTMLInputElement
        | undefined;

      expect(q1SoloRadio?.checked).toBe(true);
    });
  });

  describe('최종 제출', () => {
    it('3 페이지에서 완료 클릭 시 POST /api/onboarding/survey 가 호출되고 /onboarding/connect 로 이동한다', async () => {
      const user = userEvent.setup();
      let surveyCallCount = 0;
      server.use(
        http.post(`${BASE_URL}/api/onboarding/survey`, () => {
          surveyCallCount++;
          return HttpResponse.json({ data: { avatarId: 'avatar-001' } }, { status: 201 });
        }),
        surveyDraftHandlers.success
      );

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      const answerPage = async () => {
        const radios = screen.getAllByRole('radio');
        const q1Radios = radios.filter((r) => r.getAttribute('name') === 'q1');
        const q2Radios = radios.filter((r) => r.getAttribute('name') === 'q2');
        if (q1Radios[0]) await user.click(q1Radios[0]);
        if (q2Radios[0]) await user.click(q2Radios[0]);
      };

      await answerPage();
      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(screen.queryByRole('group', { name: /데이트 장소/i })).toBeInTheDocument();
      });

      const p2Radios = screen.getAllByRole('radio');
      const q3Radios = p2Radios.filter((r) => r.getAttribute('name') === 'q3');
      const q4Radios = p2Radios.filter((r) => r.getAttribute('name') === 'q4');
      if (q3Radios[0]) await user.click(q3Radios[0]);
      if (q4Radios[0]) await user.click(q4Radios[0]);
      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(screen.queryByRole('group', { name: /갈등 상황/i })).toBeInTheDocument();
      });

      const p3Radios = screen.getAllByRole('radio');
      const q5Radios = p3Radios.filter((r) => r.getAttribute('name') === 'q5');
      const q6Radios = p3Radios.filter((r) => r.getAttribute('name') === 'q6');
      if (q5Radios[0]) await user.click(q5Radios[0]);
      if (q6Radios[0]) await user.click(q6Radios[0]);

      await user.click(screen.getByRole('button', { name: /완료/i }));

      await waitFor(() => {
        expect(surveyCallCount).toBe(1);
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding/connect');
      });
    });

    it('서버 422 응답 시 에러 메시지가 노출되고 navigate 는 호출되지 않는다', async () => {
      const user = userEvent.setup();
      server.use(surveyHandlers.validationError, surveyDraftHandlers.success);

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      const radios = screen.getAllByRole('radio');
      const q1Radios = radios.filter((r) => r.getAttribute('name') === 'q1');
      const q2Radios = radios.filter((r) => r.getAttribute('name') === 'q2');
      if (q1Radios[0]) await user.click(q1Radios[0]);
      if (q2Radios[0]) await user.click(q2Radios[0]);
      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(screen.queryByRole('group', { name: /데이트 장소/i })).toBeInTheDocument();
      });

      const p2Radios = screen.getAllByRole('radio');
      const q3Radios = p2Radios.filter((r) => r.getAttribute('name') === 'q3');
      const q4Radios = p2Radios.filter((r) => r.getAttribute('name') === 'q4');
      if (q3Radios[0]) await user.click(q3Radios[0]);
      if (q4Radios[0]) await user.click(q4Radios[0]);
      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(screen.queryByRole('group', { name: /갈등 상황/i })).toBeInTheDocument();
      });

      const p3Radios = screen.getAllByRole('radio');
      const q5Radios = p3Radios.filter((r) => r.getAttribute('name') === 'q5');
      const q6Radios = p3Radios.filter((r) => r.getAttribute('name') === 'q6');
      if (q5Radios[0]) await user.click(q5Radios[0]);
      if (q6Radios[0]) await user.click(q6Radios[0]);

      await user.click(screen.getByRole('button', { name: /완료/i }));

      await waitFor(() => {
        expect(screen.getByText(/올바르지 않습니다|에러|오류/i)).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalledWith('/onboarding/connect');
    });
  });

  describe('draft 저장 — 페이지 이동 시 PATCH 호출', () => {
    it('"다음" 클릭 시 PATCH /api/onboarding/survey/draft 가 호출된다', async () => {
      const user = userEvent.setup();
      let draftCallCount = 0;

      server.events.on('request:start', ({ request }) => {
        if (request.url.includes('/api/onboarding/survey/draft')) {
          draftCallCount++;
        }
      });

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      const radios = screen.getAllByRole('radio');
      const q1Radios = radios.filter((r) => r.getAttribute('name') === 'q1');
      const q2Radios = radios.filter((r) => r.getAttribute('name') === 'q2');
      if (q1Radios[0]) await user.click(q1Radios[0]);
      if (q2Radios[0]) await user.click(q2Radios[0]);

      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(draftCallCount).toBeGreaterThanOrEqual(1);
      });

      server.events.removeAllListeners();
    });
  });

  describe('에러 상태 스타일', () => {
    it('유효성 에러 시 에러 필드에 border-danger 클래스가 적용된다', async () => {
      const user = userEvent.setup();
      server.use(surveyHandlers.validationError, surveyDraftHandlers.success);

      renderWithProviders(<SurveyStep />, { initialRoute: '/onboarding/survey' });

      const radios = screen.getAllByRole('radio');
      const q1Radios = radios.filter((r) => r.getAttribute('name') === 'q1');
      const q2Radios = radios.filter((r) => r.getAttribute('name') === 'q2');
      if (q1Radios[0]) await user.click(q1Radios[0]);
      if (q2Radios[0]) await user.click(q2Radios[0]);
      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(screen.queryByRole('group', { name: /데이트 장소/i })).toBeInTheDocument();
      });

      const p2Radios = screen.getAllByRole('radio');
      const q3Radios = p2Radios.filter((r) => r.getAttribute('name') === 'q3');
      const q4Radios = p2Radios.filter((r) => r.getAttribute('name') === 'q4');
      if (q3Radios[0]) await user.click(q3Radios[0]);
      if (q4Radios[0]) await user.click(q4Radios[0]);
      await user.click(screen.getByRole('button', { name: /다음/i }));

      await waitFor(() => {
        expect(screen.queryByRole('group', { name: /갈등 상황/i })).toBeInTheDocument();
      });

      const p3Radios = screen.getAllByRole('radio');
      const q5Radios = p3Radios.filter((r) => r.getAttribute('name') === 'q5');
      const q6Radios = p3Radios.filter((r) => r.getAttribute('name') === 'q6');
      if (q5Radios[0]) await user.click(q5Radios[0]);
      if (q6Radios[0]) await user.click(q6Radios[0]);

      await user.click(screen.getByRole('button', { name: /완료/i }));

      await waitFor(() => {
        const errorElements = document.querySelectorAll('[aria-invalid="true"],.border-danger');
        expect(errorElements.length).toBeGreaterThan(0);
      });
    });
  });
});
