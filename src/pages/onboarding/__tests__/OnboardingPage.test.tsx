import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/renderWithProviders';
import { OnboardingPage } from '../OnboardingPage';

function renderAt(initialRoute: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/onboarding" element={<OnboardingPage />}>
        <Route path="welcome" element={<div data-testid="step-welcome">welcome</div>} />
        <Route path="intro" element={<div data-testid="step-intro">intro</div>} />
        <Route path="method" element={<div data-testid="step-method">method</div>} />
        <Route path="survey" element={<div data-testid="step-survey">survey</div>} />
        <Route path="connect" element={<div data-testid="step-connect">connect</div>} />
        <Route path="complete" element={<div data-testid="step-complete">complete</div>} />
      </Route>
    </Routes>,
    { initialRoute }
  );
}

describe('OnboardingPage', () => {
  it('/onboarding/welcome 은 진행바 없는 환영 모멘트다 (progressbar 미표시)', () => {
    renderAt('/onboarding/welcome');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByTestId('step-welcome')).toBeInTheDocument();
  });

  it('진행바가 표시되는 단계에서는 aria-valuemax=4 로 설정된다', () => {
    renderAt('/onboarding/intro');
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemax', '4');
  });

  it('/onboarding/intro 진입 시 aria-valuenow=1 + "아바타 기본 정보" 라벨', () => {
    renderAt('/onboarding/intro');
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '1');
    expect(bar.getAttribute('aria-valuetext')).toContain('아바타 기본 정보');
    expect(screen.getByTestId('step-intro')).toBeInTheDocument();
  });

  it('/onboarding/method 진입 시 aria-valuenow=2 + "아바타 생성 방법" 라벨', () => {
    renderAt('/onboarding/method');
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '2');
    expect(bar.getAttribute('aria-valuetext')).toContain('아바타 생성 방법');
    expect(screen.getByTestId('step-method')).toBeInTheDocument();
  });

  it('/onboarding/survey 진입 시 aria-valuenow=3 + "성향 설문" 라벨', () => {
    renderAt('/onboarding/survey');
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar.getAttribute('aria-valuetext')).toContain('성향 설문');
    expect(screen.getByTestId('step-survey')).toBeInTheDocument();
  });

  it('/onboarding/connect 진입 시 aria-valuenow=3 + "ChatGPT Bot 대화" 라벨', () => {
    renderAt('/onboarding/connect');
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar.getAttribute('aria-valuetext')).toContain('ChatGPT Bot 대화');
    expect(screen.getByTestId('step-connect')).toBeInTheDocument();
  });

  it('/onboarding/complete 진입 시 aria-valuenow=4 + "아바타 확인" 라벨', () => {
    renderAt('/onboarding/complete');
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '4');
    expect(bar.getAttribute('aria-valuetext')).toContain('아바타 확인');
    expect(screen.getByTestId('step-complete')).toBeInTheDocument();
  });
});
