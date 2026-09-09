import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AvatarSummary } from '@entities/avatar';
import { renderWithProviders } from '@/test/renderWithProviders';
import { queryClientWithPrimaryAvatar, SAMPLE_PRIMARY_AVATAR } from '@/test/onboardingCompletion';
import { IntroStep } from '../steps/IntroStep';
import { saveDraft, loadDraft } from '@features/persona-survey/lib/draftStorage';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

const PROGRESS_KEY = 'avating:onboarding:progress';
const METHOD_KEY = 'avating:onboarding:method';

function renderIntro(primary: AvatarSummary | null = null) {
  return renderWithProviders(<IntroStep />, { queryClient: queryClientWithPrimaryAvatar(primary) });
}

describe('IntroStep (와이어프레임 v2 — Step 1 이름·설명)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(PROGRESS_KEY, 'intro');
  });

  describe('렌더링', () => {
    it('제목과 서브 카피가 렌더된다 (STEP 라벨은 레일이 담당해 카드에 없다)', () => {
      renderIntro();
      expect(
        screen.getByRole('heading', { level: 1, name: /아바타의 이름과 설명을 알려주세요/ })
      ).toBeInTheDocument();
      expect(screen.getByText('설문 전에 아바타를 어떻게 부를지 정해요.')).toBeInTheDocument();
      expect(screen.queryByText(/STEP 1 \/ 4/)).not.toBeInTheDocument();
    });

    it('이름 입력과 설명 입력이 렌더된다', () => {
      renderIntro();
      expect(screen.getByLabelText(/아바타 이름/)).toBeInTheDocument();
      expect(screen.getByLabelText(/아바타 설명/)).toBeInTheDocument();
    });

    it('이름·설명 글자수 카운터가 0 / 20, 0 / 120 으로 시작한다', () => {
      renderIntro();
      expect(screen.getByText('0 / 20')).toBeInTheDocument();
      expect(screen.getByText('0 / 120')).toBeInTheDocument();
    });

    it('설명 필드에 도움말이 붙는다', () => {
      renderIntro();
      expect(screen.getByText('상대 아바타가 첫인상으로 참고합니다')).toBeInTheDocument();
    });

    it('이전 / 다음 버튼이 렌더된다', () => {
      renderIntro();
      expect(screen.getByRole('button', { name: /이전/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /다음/ })).toBeInTheDocument();
    });
  });

  describe('상호작용', () => {
    it('이름을 입력하면 카운터가 갱신된다', async () => {
      const user = userEvent.setup();
      renderIntro();
      await user.type(screen.getByLabelText(/아바타 이름/), 'hyunwoo');
      expect(screen.getByText('7 / 20')).toBeInTheDocument();
    });

    it('이름이 비어 있으면 다음 클릭 시 검증 에러(메시지·aria-invalid·border-danger-mark)를 보이고 이동하지 않는다', async () => {
      const user = userEvent.setup();
      renderIntro();

      // 설명도 필수라 비워 두면 alert 이 둘이 된다 — 이름 에러만 검사하도록 설명은 채운다.
      await user.type(screen.getByLabelText(/아바타 설명/), '차분히 듣습니다');
      await user.click(screen.getByRole('button', { name: /다음/ }));

      const nameInput = screen.getByLabelText(/아바타 이름/);
      expect(await screen.findByRole('alert')).toHaveTextContent(/이름을 입력해주세요/);
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(nameInput).toHaveClass('border-danger-mark');
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('검증 에러 후 이름을 입력하면(reValidateMode onChange) 에러가 즉시 해소된다', async () => {
      const user = userEvent.setup();
      renderIntro();

      await user.type(screen.getByLabelText(/아바타 설명/), '차분히 듣습니다');
      await user.click(screen.getByRole('button', { name: /다음/ }));
      expect(await screen.findByRole('alert')).toBeInTheDocument();

      const nameInput = screen.getByLabelText(/아바타 이름/);
      await user.type(nameInput, '루나');

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(nameInput).not.toHaveClass('border-danger-mark');
      expect(nameInput).not.toHaveAttribute('aria-invalid');
    });

    it('설명이 비어 있으면 다음 클릭 시 검증 에러를 보이고 이동하지 않는다', async () => {
      const user = userEvent.setup();
      renderIntro();

      await user.type(screen.getByLabelText(/아바타 이름/), 'hyunwoo');
      await user.click(screen.getByRole('button', { name: /다음/ }));

      const descInput = screen.getByLabelText(/아바타 설명/);
      expect(await screen.findByRole('alert')).toHaveTextContent(/설명을 입력해주세요/);
      expect(descInput).toHaveAttribute('aria-invalid', 'true');
      expect(descInput).toHaveClass('border-danger-mark');
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    // 방법은 환영 화면에서 이미 골라 METHOD_KEY 에 들어 있다.
    it('이름 입력 후 다음 → draft 저장 + progress=creating + 고른 방법 화면(설문) 이동', async () => {
      localStorage.setItem(METHOD_KEY, 'survey');
      const user = userEvent.setup();
      renderIntro();

      await user.type(screen.getByLabelText(/아바타 이름/), 'hyunwoo');
      await user.type(screen.getByLabelText(/아바타 설명/), '차분히 듣고 깊게 답합니다');
      await user.click(screen.getByRole('button', { name: /다음/ }));

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/survey');
      expect(localStorage.getItem(PROGRESS_KEY)).toBe('creating');
      const draft = loadDraft();
      expect(draft?.avatarName).toBe('hyunwoo');
      expect(draft?.description).toBe('차분히 듣고 깊게 답합니다');
    });

    it('Bot 을 골랐으면 다음 → /onboarding/connect 로 이동', async () => {
      localStorage.setItem(METHOD_KEY, 'connect');
      const user = userEvent.setup();
      renderIntro();

      await user.type(screen.getByLabelText(/아바타 이름/), 'hyunwoo');
      await user.type(screen.getByLabelText(/아바타 설명/), '차분히 듣고 깊게 답합니다');
      await user.click(screen.getByRole('button', { name: /다음/ }));

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/connect');
      expect(localStorage.getItem(PROGRESS_KEY)).toBe('creating');
    });

    it('방법을 고른 기록이 없으면 다음 → 환영 화면으로 되돌린다', async () => {
      const user = userEvent.setup();
      renderIntro();

      await user.type(screen.getByLabelText(/아바타 이름/), 'hyunwoo');
      await user.type(screen.getByLabelText(/아바타 설명/), '차분히 듣고 깊게 답합니다');
      await user.click(screen.getByRole('button', { name: /다음/ }));

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/welcome');
      expect(localStorage.getItem(PROGRESS_KEY)).not.toBe('creating');
      // draft 는 저장한다 — 되돌아가도 입력이 날아가면 안 된다.
      expect(loadDraft()?.avatarName).toBe('hyunwoo');
    });

    it('이전 → /onboarding/welcome 으로 이동', async () => {
      const user = userEvent.setup();
      renderIntro();

      await user.click(screen.getByRole('button', { name: /이전/ }));

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/welcome');
    });

    it('기존 draft 의 이름·설명을 입력값으로 복원한다', () => {
      saveDraft({ answers: {}, avatarName: '루나', description: '소개글' });
      renderIntro();
      expect(screen.getByLabelText(/아바타 이름/)).toHaveValue('루나');
      expect(screen.getByLabelText(/아바타 설명/)).toHaveValue('소개글');
    });

    it('이름·설명 저장 시 기존 설문 답변 draft 를 보존한다', async () => {
      const user = userEvent.setup();
      saveDraft({ answers: { Q_001: 'Q_001_ANS_1' }, avatarName: '', description: '' });
      renderIntro();

      await user.type(screen.getByLabelText(/아바타 이름/), '루나');
      await user.type(screen.getByLabelText(/아바타 설명/), '차분히 듣습니다');
      await user.click(screen.getByRole('button', { name: /다음/ }));

      const draft = loadDraft();
      expect(draft?.answers).toEqual({ Q_001: 'Q_001_ANS_1' });
      expect(draft?.avatarName).toBe('루나');
    });

    it('이름 재입력 시 기존 expressions(자주 쓰는 표현) draft 도 보존한다', async () => {
      const user = userEvent.setup();
      saveDraft({ answers: {}, avatarName: '', description: '', expressions: ['그치 그치', '🥲'] });
      renderIntro();

      await user.type(screen.getByLabelText(/아바타 이름/), '루나');
      await user.type(screen.getByLabelText(/아바타 설명/), '차분히 듣습니다');
      await user.click(screen.getByRole('button', { name: /다음/ }));

      expect(loadDraft()?.expressions).toEqual(['그치 그치', '🥲']);
    });
  });

  // 완료 판정은 진행 기록이 아니라 대표 아바타 보유 여부로 한다 — progress 만 보면 만든 적 없는 사용자도 확인 화면에 갇힌다.
  describe('완료 가드', () => {
    it('대표 아바타가 있으면 확인 화면으로 보낸다', () => {
      renderIntro(SAMPLE_PRIMARY_AVATAR);

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/complete', { replace: true });
    });

    it('진행 기록이 complete 여도 대표 아바타가 없으면 입력 화면에 머문다', () => {
      localStorage.setItem(PROGRESS_KEY, 'complete');
      renderIntro();

      expect(screen.getByLabelText(/아바타 이름/)).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
