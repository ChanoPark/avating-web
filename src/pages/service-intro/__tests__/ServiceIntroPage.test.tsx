import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect } from 'vitest';
import { ServiceIntroPage } from '../ServiceIntroPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <ServiceIntroPage />
    </MemoryRouter>
  );
}

describe('ServiceIntroPage', () => {
  it('서비스 헤더 타이틀이 렌더된다', () => {
    renderPage();
    expect(screen.getByText('Avating')).toBeInTheDocument();
  });

  it('메인 헤드카피가 렌더된다', () => {
    renderPage();
    expect(screen.getByText(/귀찮은 밀당은 아바타가/)).toBeInTheDocument();
  });

  it('기능 카드 3개가 렌더된다', () => {
    renderPage();
    expect(screen.getByText('아바타 매칭')).toBeInTheDocument();
    expect(screen.getByText('답답해? 직접 뛰어!')).toBeInTheDocument();
    expect(screen.getAllByText('에프터 연결').length).toBeGreaterThanOrEqual(1);
  });

  it('가입하기 버튼이 렌더된다', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /가입하기/i })).toBeInTheDocument();
  });
});
