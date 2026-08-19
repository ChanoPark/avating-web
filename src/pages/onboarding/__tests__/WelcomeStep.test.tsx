import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AvatarSummary } from '@entities/avatar';
import { renderWithProviders } from '@/test/renderWithProviders';
import { queryClientWithPrimaryAvatar, SAMPLE_PRIMARY_AVATAR } from '@/test/onboardingCompletion';
import { WelcomeStep } from '../steps/WelcomeStep';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

const PROGRESS_KEY = 'avating:onboarding:progress';
const METHOD_KEY = 'avating:onboarding:method';

function renderWithPrimary(primary: AvatarSummary | null = null) {
  return renderWithProviders(<WelcomeStep />, {
    queryClient: queryClientWithPrimaryAvatar(primary),
  });
}

/** 방법 카드 CTA — 카드 제목이 아니라 CTA 라벨로 찾는다 (정본 `ONB_METHODS[].cta`). */
function surveyCta() {
  return screen.getByRole('button', { name: /설문으로 만들기/ });
}
function botCta() {
  return screen.getByRole('button', { name: /Bot과 대화해서 만들기/ });
}
function promptCta() {
  return screen.getByRole('button', { name: /프롬프트 복사하기/ });
}

describe('WelcomeStep (와이어프레임 v2.5 — 생성 방법 3장 선택)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('렌더링', () => {
    it('환영 헤딩과 v2.5 서브 카피가 렌더된다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(
        screen.getByRole('heading', { level: 1, name: /이제 아바타를 만들 차례예요/ })
      ).toBeInTheDocument();
      expect(
        screen.getByText('아바타를 만드는 방법은 세 가지예요. 원하는 방법을 골라 시작하세요.')
      ).toBeInTheDocument();
    });

    it('생성 방법 카드 3장이 제목·설명·소요 시간·CTA 를 갖고 렌더된다', () => {
      renderWithProviders(<WelcomeStep />);

      const cards = screen.getAllByRole('group', { name: /아바타 만들기$/ });
      expect(cards).toHaveLength(3);

      const [survey, bot, prompt] = cards as [HTMLElement, HTMLElement, HTMLElement];

      expect(within(survey).getByText('성향 설문으로 아바타 만들기')).toBeInTheDocument();
      expect(
        within(survey).getByText('성향 분석을 통해 자신만의 아바타를 만들어보세요.')
      ).toBeInTheDocument();
      expect(within(survey).getByText('약 2분')).toBeInTheDocument();
      expect(within(survey).getByRole('button', { name: /설문으로 만들기/ })).toBeInTheDocument();

      expect(within(bot).getByText('ChatGPT Bot과 대화해서 아바타 만들기')).toBeInTheDocument();
      expect(
        within(bot).getByText('ChatGPT에서 Bot과의 대화를 통해 자신의 성향을 알아보세요')
      ).toBeInTheDocument();
      expect(within(bot).getByText('약 10분')).toBeInTheDocument();

      expect(within(prompt).getByText('프롬프트를 복사해서 아바타 만들기')).toBeInTheDocument();
      expect(
        within(prompt).getByText('평소 쓰는 AI에 프롬프트를 붙여넣고, 나온 결과를 다시 가져오세요.')
      ).toBeInTheDocument();
      expect(within(prompt).getByText('약 5분')).toBeInTheDocument();
    });

    /* 정본(v2.5)은 첫 카드에만 `borderColor: var(--primary)` + 같은 색 inset 링을 준다.
       2026-08-18 사용자 지시로 그 강조를 제거했다 — 세 카드는 시각적으로 동등하다.
       design-fidelity 스윕이 정본만 보고 파란 테두리를 되돌리지 않도록 여기서 고정한다. */
    it('세 카드가 같은 테두리를 쓴다 — 첫 카드 파란 테두리 강조는 없다', () => {
      renderWithProviders(<WelcomeStep />);
      const classNames = screen
        .getAllByRole('group', { name: /아바타 만들기$/ })
        .map((card) => card.className);

      expect(new Set(classNames).size).toBe(1);
      expect(classNames[0]).not.toMatch(/border-primary|inset/);
    });

    /* 정본은 카드 CTA 를 `Btn icon="arrowRight"` 로 그리지만 2026-08-18 사용자 지시로
       화살표를 뺐다. 위 테두리 건과 같은 이유로 고정한다. */
    it('카드 CTA 에는 화살표 아이콘이 없다', () => {
      renderWithProviders(<WelcomeStep />);
      for (const cta of [surveyCta(), botCta(), promptCta()]) {
        expect(cta.querySelector('svg')).toBeNull();
      }
    });

    it('앞으로 할 일 4단계 체크리스트가 렌더된다 — 3번은 세 방법을 아우르는 라벨이다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
        '1기본 정보 입력',
        '2생성 방법 선택',
        '3성향 분석 (설문 · Bot 대화 · 프롬프트)',
        '4아바타 확인',
      ]);
    });

    it('하단 액션 바가 없다 — CTA 는 카드마다 하나씩이다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(screen.queryByRole('button', { name: '아바타 만들기' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'ChatGPT Bot 연동' })).not.toBeInTheDocument();
    });

    it('카드 밖 "약 2분 소요" 행은 없다 — 소요 시간은 카드별 태그로 옮겼다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(screen.queryByText('약 2분 소요')).not.toBeInTheDocument();
    });

    it('v1 단계 라벨(STEP n / 4)은 렌더되지 않는다 — 진행 표시는 레일이 담당한다', () => {
      renderWithProviders(<WelcomeStep />);
      expect(screen.queryByText(/STEP \d \/ 4/)).not.toBeInTheDocument();
    });
  });

  describe('상호작용', () => {
    it('설문 카드 CTA 는 method=survey 사전선택 + /onboarding/intro 로 이동한다', async () => {
      const user = userEvent.setup();
      renderWithPrimary();

      await user.click(surveyCta());

      expect(localStorage.getItem(METHOD_KEY)).toBe('survey');
      expect(localStorage.getItem(PROGRESS_KEY)).toBe('intro');
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/intro');
    });

    it('Bot 카드 CTA 는 method=connect 사전선택 + /onboarding/intro 로 이동한다', async () => {
      const user = userEvent.setup();
      renderWithPrimary();

      await user.click(botCta());

      expect(localStorage.getItem(METHOD_KEY)).toBe('connect');
      expect(localStorage.getItem(PROGRESS_KEY)).toBe('intro');
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/intro');
    });

    it('카드 CTA 는 Enter 키로도 트리거된다', async () => {
      const user = userEvent.setup();
      renderWithPrimary();

      surveyCta().focus();
      await user.keyboard('{Enter}');

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/intro');
    });
  });

  /* 프롬프트 방식은 정본(Claude Design v2.5)에 진입 카드만 있고 목적지 화면·데이터 계약이 없다.
     `wf/wf-spec.jsx` SPEC_SCREENS 41개 어디에도 대응 화면이 없고 S-02-03 은 여전히 2택이다.
     2026-08-18 사용자 결정: 카드는 정본대로 그리되 플로우에는 연결하지 않는다(spec-gap 보류).
     이 테스트가 그 결정을 못 박는다 — 임의 연결도, 임의 '준비중' 처리도 회귀로 잡힌다. */
  describe('프롬프트 방식 — 정본 미정의로 미연결 보류 (spec-gap)', () => {
    it('카드와 CTA 는 정본대로 렌더되지만 클릭해도 아무 데도 이동하지 않는다', async () => {
      const user = userEvent.setup();
      renderWithPrimary();

      await user.click(promptCta());

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('클릭해도 생성 방법·진행 기록을 건드리지 않는다', async () => {
      const user = userEvent.setup();
      renderWithPrimary();

      await user.click(promptCta());

      expect(localStorage.getItem(METHOD_KEY)).toBeNull();
      expect(localStorage.getItem(PROGRESS_KEY)).toBeNull();
    });
  });

  // 진행 기록이 남아 있으면 처음이 아니라 "멈춘 자리"로 이어져야 한다.
  // 예전에는 무조건 /onboarding/intro 로 보냈고, intro 가드가 그걸 다시 튕겨내
  // 사용자 눈에는 버튼이 죽은 것처럼 보였다.
  describe('진행 기록이 있을 때 이어서 진행', () => {
    it('method 까지 진행했으면 방법 선택 화면으로 이어진다', async () => {
      localStorage.setItem(PROGRESS_KEY, 'method');
      const user = userEvent.setup();
      renderWithPrimary();

      await user.click(surveyCta());

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/method');
    });

    it('설문 진행 중이었으면 설문 화면으로 이어진다', async () => {
      localStorage.setItem(PROGRESS_KEY, 'creating');
      localStorage.setItem(METHOD_KEY, 'survey');
      const user = userEvent.setup();
      renderWithPrimary();

      await user.click(surveyCta());

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/survey');
    });

    it('Bot 카드도 진행 기록을 따라 이어진다', async () => {
      localStorage.setItem(PROGRESS_KEY, 'creating');
      const user = userEvent.setup();
      renderWithPrimary();

      await user.click(botCta());

      expect(localStorage.getItem(METHOD_KEY)).toBe('connect');
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/connect');
    });

    // 완료 판정의 정본은 진행 기록이 아니라 대표 아바타 보유 여부다.
    it('대표 아바타가 이미 있으면 진행 기록과 무관하게 확인 화면으로 보낸다', async () => {
      localStorage.setItem(PROGRESS_KEY, 'intro');
      const user = userEvent.setup();
      renderWithPrimary(SAMPLE_PRIMARY_AVATAR);

      await user.click(surveyCta());

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/complete');
    });
  });
});
