import { screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '@/test/renderWithProviders';
import { LoginPage } from '../LoginPage';

vi.mock('@features/auth/lib/encryptPassword', () => ({
  encryptPassword: vi.fn(),
}));

describe('LoginPage', () => {
  it('2단 구성: 우측 AuthAside(complementary)를 렌더한다', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('complementary', { name: /이용 안내/ })).toBeInTheDocument();
  });

  it('AuthAside 에 HOW IT WORKS eyebrow 와 정본 3항목이 렌더된다', () => {
    renderWithProviders(<LoginPage />);
    const aside = screen.getByRole('complementary', { name: /이용 안내/ });

    expect(within(aside).getByText('HOW IT WORKS')).toBeInTheDocument();
    expect(within(aside).getByText('진행 중인 매칭')).toBeInTheDocument();
    expect(within(aside).getByText('관전 이어보기')).toBeInTheDocument();
    expect(within(aside).getByText('받은 요청')).toBeInTheDocument();
    expect(within(aside).getByText('수락·거절 결정하기')).toBeInTheDocument();
    // 로그인 전에는 알 수 없는 수치를 적지 않는다.
    expect(within(aside).queryByText(/\d+건/)).not.toBeInTheDocument();
    expect(within(aside).getByText('내 아바타')).toBeInTheDocument();
    expect(within(aside).getByText('스탯 다듬기')).toBeInTheDocument();
  });

  it('AuthAside 번호 01·02·03 이 tabular-nums 로 렌더된다', () => {
    renderWithProviders(<LoginPage />);
    const aside = screen.getByRole('complementary', { name: /이용 안내/ });
    for (const num of ['01', '02', '03']) {
      expect(within(aside).getByText(num)).toHaveClass('tnum');
    }
  });

  it('제목 "다시 만나서 반가워요" 와 서브카피가 렌더된다', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('heading', { name: /다시 만나서 반가워요/ })).toBeInTheDocument();
    expect(screen.getByText('아바타의 대화가 기다리고 있어요.')).toBeInTheDocument();
  });

  it('폼 카드 상단에 Avating 로고가 렌더된다', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('Avating')).toBeInTheDocument();
  });

  it('LoginForm이 포함된다 (이메일 input 존재)', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
  });
});
