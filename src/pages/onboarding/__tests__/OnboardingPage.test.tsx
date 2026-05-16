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
  it('progressbar 가 렌더되고 aria-valuemax=4 로 설정된다', () => {
    renderAt('/onboarding/welcome');
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemax', '4');
  });

  it('/onboarding/welcome 진입 시 aria-valuenow=1 + "시작" 라벨', () => {
    renderAt('/onboarding/welcome');
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '1');
    expect(bar.getAttribute('aria-valuetext')).toContain('시작');
    expect(screen.getByTestId('step-welcome')).toBeInTheDocument();
  });

  it('/onboarding/method 진입 시 aria-valuenow=2 + "방법 선택" 라벨', () => {
    renderAt('/onboarding/method');
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '2');
    expect(bar.getAttribute('aria-valuetext')).toContain('방법 선택');
    expect(screen.getByTestId('step-method')).toBeInTheDocument();
  });

  it('/onboarding/survey 진입 시 aria-valuenow=3 + "성향 설문" 라벨', () => {
    renderAt('/onboarding/survey');
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar.getAttribute('aria-valuetext')).toContain('성향 설문');
    expect(screen.getByTestId('step-survey')).toBeInTheDocument();
  });

  it('/onboarding/connect 진입 시 aria-valuenow=3 + "Bot 대화" 라벨', () => {
    renderAt('/onboarding/connect');
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar.getAttribute('aria-valuetext')).toContain('Bot 대화');
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
