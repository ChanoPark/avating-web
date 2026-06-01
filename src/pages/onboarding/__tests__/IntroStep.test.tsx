import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { IntroStep } from '../steps/IntroStep';
import { saveDraft, loadDraft } from '@features/persona-survey/lib/draftStorage';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

const PROGRESS_KEY = 'avating:onboarding:progress';

describe('IntroStep (와이어프레임 v2 — Step 1 이름·설명)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(PROGRESS_KEY, 'intro');
  });

  describe('렌더링', () => {
    it('STEP 1 / 4 · 아바타 기본 정보 라벨과 제목이 렌더된다', () => {
      renderWithProviders(<IntroStep />);
      expect(screen.getByText(/STEP 1 \/ 4 · 아바타 기본 정보/)).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 1, name: /아바타의 이름과 설명을 알려주세요/ })
      ).toBeInTheDocument();
    });

    it('이름 입력과 설명 입력이 렌더된다', () => {
      renderWithProviders(<IntroStep />);
      expect(screen.getByLabelText(/아바타 이름/)).toBeInTheDocument();
      expect(screen.getByLabelText(/아바타 설명/)).toBeInTheDocument();
    });

    it('이름·설명 글자수 카운터가 0/16, 0/80 으로 시작한다', () => {
      renderWithProviders(<IntroStep />);
      expect(screen.getByText('0/16')).toBeInTheDocument();
      expect(screen.getByText('0/80')).toBeInTheDocument();
    });

    it('나중에 수정 가능 안내가 렌더된다', () => {
      renderWithProviders(<IntroStep />);
      expect(
        screen.getByText(/이름과 설명은 나중에 프로필에서 수정할 수 있습니다/)
      ).toBeInTheDocument();
    });

    it('이전 / 다음 버튼이 렌더된다', () => {
      renderWithProviders(<IntroStep />);
      expect(screen.getByRole('button', { name: /이전/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /다음/ })).toBeInTheDocument();
    });
  });

  describe('상호작용', () => {
    it('이름을 입력하면 카운터가 갱신된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<IntroStep />);
      await user.type(screen.getByLabelText(/아바타 이름/), 'hyunwoo');
      expect(screen.getByText('7/16')).toBeInTheDocument();
    });

    it('이름이 비어 있으면 다음 클릭 시 검증 에러(메시지·aria-invalid·border-danger)를 보이고 이동하지 않는다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<IntroStep />);

      await user.click(screen.getByRole('button', { name: /다음/ }));

      const nameInput = screen.getByLabelText(/아바타 이름/);
      expect(await screen.findByRole('alert')).toHaveTextContent(/이름을 입력해주세요/);
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(nameInput).toHaveClass('border-danger');
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('검증 에러 후 이름을 입력하면(reValidateMode onChange) 에러가 즉시 해소된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<IntroStep />);

      await user.click(screen.getByRole('button', { name: /다음/ }));
      expect(await screen.findByRole('alert')).toBeInTheDocument();

      const nameInput = screen.getByLabelText(/아바타 이름/);
      await user.type(nameInput, '루나');

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(nameInput).not.toHaveClass('border-danger');
      expect(nameInput).not.toHaveAttribute('aria-invalid');
    });

    it('이름 입력 후 다음 → draft 저장 + progress=method + /onboarding/method 이동', async () => {
      const user = userEvent.setup();
      renderWithProviders(<IntroStep />);

      await user.type(screen.getByLabelText(/아바타 이름/), 'hyunwoo');
      await user.type(screen.getByLabelText(/아바타 설명/), '차분히 듣고 깊게 답합니다');
      await user.click(screen.getByRole('button', { name: /다음/ }));

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/method');
      expect(localStorage.getItem(PROGRESS_KEY)).toBe('method');
      const draft = loadDraft();
      expect(draft?.avatarName).toBe('hyunwoo');
      expect(draft?.description).toBe('차분히 듣고 깊게 답합니다');
    });

    it('이전 → /onboarding/welcome 으로 이동', async () => {
      const user = userEvent.setup();
      renderWithProviders(<IntroStep />);

      await user.click(screen.getByRole('button', { name: /이전/ }));

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/welcome');
    });

    it('기존 draft 의 이름·설명을 입력값으로 복원한다', () => {
      saveDraft({ answers: {}, avatarName: '루나', description: '소개글' });
      renderWithProviders(<IntroStep />);
      expect(screen.getByLabelText(/아바타 이름/)).toHaveValue('루나');
      expect(screen.getByLabelText(/아바타 설명/)).toHaveValue('소개글');
    });

    it('이름·설명 저장 시 기존 설문 답변 draft 를 보존한다', async () => {
      const user = userEvent.setup();
      saveDraft({ answers: { Q_001: 'Q_001_ANS_1' }, avatarName: '', description: '' });
      renderWithProviders(<IntroStep />);

      await user.type(screen.getByLabelText(/아바타 이름/), '루나');
      await user.click(screen.getByRole('button', { name: /다음/ }));

      const draft = loadDraft();
      expect(draft?.answers).toEqual({ Q_001: 'Q_001_ANS_1' });
      expect(draft?.avatarName).toBe('루나');
    });

    it('이름 재입력 시 기존 expressions(자주 쓰는 표현) draft 도 보존한다', async () => {
      const user = userEvent.setup();
      saveDraft({ answers: {}, avatarName: '', description: '', expressions: ['그치 그치', '🥲'] });
      renderWithProviders(<IntroStep />);

      await user.type(screen.getByLabelText(/아바타 이름/), '루나');
      await user.click(screen.getByRole('button', { name: /다음/ }));

      expect(loadDraft()?.expressions).toEqual(['그치 그치', '🥲']);
    });
  });
});
