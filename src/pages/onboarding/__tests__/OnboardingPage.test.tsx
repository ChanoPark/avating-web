import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/renderWithProviders';
import { OnboardingPage } from '../OnboardingPage';

function renderAt(initialRoute: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/onboarding" element={<OnboardingPage />}>
        <Route path="welcome" element={<div data-testid="step-welcome">welcome</div>} />
        <Route path="intro" element={<div data-testid="step-intro">intro</div>} />
        <Route path="survey" element={<div data-testid="step-survey">survey</div>} />
        <Route path="connect" element={<div data-testid="step-connect">connect</div>} />
        <Route path="complete" element={<div data-testid="step-complete">complete</div>} />
      </Route>
    </Routes>,
    { initialRoute }
  );
}

function rail() {
  return screen.getByRole('navigation', { name: '온보딩 단계' });
}

describe('OnboardingPage (WizardShell)', () => {
  it('/onboarding/welcome 은 레일 없는 플랫 환영 모멘트다', () => {
    renderAt('/onboarding/welcome');
    expect(screen.queryByRole('navigation', { name: '온보딩 단계' })).not.toBeInTheDocument();
    expect(screen.getByTestId('step-welcome')).toBeInTheDocument();
  });

  it('/onboarding/welcome 의 각주는 레일이 아니라 폼 카드 바깥 아래에 렌더된다', () => {
    renderAt('/onboarding/welcome');
    expect(
      screen.getByText('어느 방법을 골라도 아래 3단계를 거칩니다 · 방법은 여기서만 선택합니다')
    ).toBeInTheDocument();
  });

  it('/onboarding/welcome 의 폼 카드만 넓은 폭(868)을 쓴다', () => {
    const { unmount } = renderAt('/onboarding/welcome');
    expect(screen.getByTestId('step-welcome').closest('div[class*="max-w-"]')).toHaveClass(
      'max-w-[868px]'
    );
    unmount();

    renderAt('/onboarding/intro');
    expect(screen.getByTestId('step-intro').closest('div[class*="max-w-"]')).toHaveClass(
      'max-w-[548px]'
    );
  });

  it('레일이 있는 화면의 각주는 레일 안에 남는다', () => {
    renderAt('/onboarding/intro');
    expect(
      within(rail()).getByText('이름과 설명은 나중에 프로필에서 수정할 수 있어요.')
    ).toBeInTheDocument();
  });

  it('레일이 표시되는 단계에서는 스텝 3개가 고정 라벨로 렌더된다', () => {
    renderAt('/onboarding/intro');
    const items = within(rail()).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    // 텍스트는 [순번 마커][라벨][sr-only 상태] 순으로 이어진다.
    expect(items.map((li) => li.textContent)).toEqual([
      '1아바타 기본 정보진행 중',
      '2성향 설문예정',
      '3아바타 확인예정',
    ]);
  });

  it('레일에 생성 방법 선택 단계가 없다', () => {
    renderAt('/onboarding/intro');
    expect(within(rail()).queryByText('생성 방법 선택')).not.toBeInTheDocument();
  });

  it('/onboarding/intro 진입 시 1번째 스텝이 현재 단계다', () => {
    renderAt('/onboarding/intro');
    expect(within(rail()).getByRole('listitem', { current: 'step' })).toHaveTextContent(
      '아바타 기본 정보'
    );
    expect(screen.getByTestId('step-intro')).toBeInTheDocument();
  });

  it('/onboarding/survey 진입 시 2번째 스텝이 현재 단계이고 1번째는 완료다', () => {
    renderAt('/onboarding/survey');
    const items = within(rail()).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('완료');
    expect(within(rail()).getByRole('listitem', { current: 'step' })).toHaveTextContent(
      '성향 설문'
    );
    expect(screen.getByTestId('step-survey')).toBeInTheDocument();
  });

  it('/onboarding/connect 는 2번째 스텝을 공유하되 라벨은 ChatGPT Bot 대화다', () => {
    renderAt('/onboarding/connect');
    const current = within(rail()).getByRole('listitem', { current: 'step' });
    expect(current).toHaveTextContent('ChatGPT Bot 대화');
    expect(current).not.toHaveTextContent('성향 설문');
    expect(screen.getByTestId('step-connect')).toBeInTheDocument();
  });

  it('/onboarding/survey 는 같은 자리에 성향 설문 라벨을 쓴다', () => {
    renderAt('/onboarding/survey');
    expect(within(rail()).getByRole('listitem', { current: 'step' })).toHaveTextContent(
      '성향 설문'
    );
  });

  it('/onboarding/complete 진입 시 3번째 스텝이 현재 단계다', () => {
    renderAt('/onboarding/complete');
    expect(within(rail()).getByRole('listitem', { current: 'step' })).toHaveTextContent(
      '아바타 확인'
    );
    expect(screen.getByTestId('step-complete')).toBeInTheDocument();
  });

  describe('레일 하단 각주', () => {
    it('/onboarding/intro 에는 수정 가능 안내 각주가 붙는다', () => {
      renderAt('/onboarding/intro');
      expect(
        within(rail()).getByText('이름과 설명은 나중에 프로필에서 수정할 수 있어요.')
      ).toBeInTheDocument();
    });

    it('/onboarding/connect 에는 소요 시간 각주가 붙는다', () => {
      renderAt('/onboarding/connect');
      expect(
        within(rail()).getByText('약 10분 소요 · 대화가 길수록 아바타가 정확해집니다.')
      ).toBeInTheDocument();
    });

    it('/onboarding/complete 에는 튜닝 안내 각주가 붙는다', () => {
      renderAt('/onboarding/complete');
      expect(
        within(rail()).getByText('확정 이후 스탯은 튜닝 기능으로만 조정할 수 있어요.')
      ).toBeInTheDocument();
    });

    it('/onboarding/survey 에는 각주가 없다', () => {
      renderAt('/onboarding/survey');
      expect(within(rail()).queryByText(/각주|소요|수정할 수 있어요/)).not.toBeInTheDocument();
    });
  });
});
