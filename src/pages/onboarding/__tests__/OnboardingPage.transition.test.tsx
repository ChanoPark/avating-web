import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';
import { OnboardingPage } from '../OnboardingPage';

let introMounts = 0;

function WelcomeProbe() {
  const navigate = useNavigate();
  return (
    <div data-testid="welcome-content">
      <button type="button" onClick={() => navigate('/onboarding/intro')}>
        go-intro
      </button>
    </div>
  );
}

function IntroProbe() {
  useEffect(() => {
    introMounts += 1;
  }, []);
  return <div data-testid="intro-content">intro</div>;
}

function renderTree() {
  return render(
    <MemoryRouter initialEntries={['/onboarding/welcome']}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />}>
          <Route path="welcome" element={<WelcomeProbe />} />
          <Route path="intro" element={<IntroProbe />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('OnboardingPage 스텝 전환 — 이중 마운트 회귀', () => {
  beforeEach(() => {
    introMounts = 0;
  });

  it('welcome → intro 이동 시 다음 스텝이 한 번만 마운트된다', async () => {
    const user = userEvent.setup();
    renderTree();

    await user.click(screen.getByText('go-intro'));
    await waitFor(() => expect(screen.getByTestId('intro-content')).toBeInTheDocument());

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(introMounts).toBe(1);
  });
});

describe('OnboardingPage 스텝 전환 — 전환 플래시(크롬/콘텐츠 비동기) 회귀', () => {
  it('welcome → intro 클릭 직후 이전 스텝(welcome)이 잔류하지 않고 목적지가 즉시 표시된다', async () => {
    const user = userEvent.setup();
    renderTree();

    expect(screen.queryByRole('navigation', { name: '온보딩 단계' })).not.toBeInTheDocument();
    expect(screen.getByTestId('welcome-content')).toBeInTheDocument();

    await user.click(screen.getByText('go-intro'));

    expect(screen.queryByTestId('welcome-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('intro-content')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '온보딩 단계' })).toBeInTheDocument();
  });
});
