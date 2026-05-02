import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@shared/mocks/server';
import { signupHandlers, publicKeyHandlers } from '@shared/mocks/handlers/auth';
import { SignupForm } from '../ui/SignupForm';

vi.mock('../lib/encryptPassword', () => ({
  encryptPassword: vi.fn(() => 'mock-encrypted-password'),
}));

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링', () => {
    it('이메일 input이 렌더된다', () => {
      renderWithProviders(<SignupForm />);
      expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
    });

    it('비밀번호 input이 렌더된다', () => {
      renderWithProviders(<SignupForm />);
      expect(screen.getByLabelText(/^비밀번호$/i)).toBeInTheDocument();
    });

    it('닉네임 input이 렌더된다', () => {
      renderWithProviders(<SignupForm />);
      expect(screen.getByLabelText(/닉네임/i)).toBeInTheDocument();
    });

    it('제출 버튼이 렌더된다', () => {
      renderWithProviders(<SignupForm />);
      expect(screen.getByRole('button', { name: /회원가입/i })).toBeInTheDocument();
    });

    it('로그인 링크가 렌더되고 /login으로 이동한다', () => {
      renderWithProviders(<SignupForm />);
      const link = screen.getByRole('link', { name: /로그인/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/login');
    });

    it('"로그인" 텍스트에 브랜드 컬러·hover 클래스가 적용된다', () => {
      renderWithProviders(<SignupForm />);
      const link = screen.getByRole('link', { name: /로그인/i });
      const brandSpan = link.querySelector('span');
      expect(brandSpan).toHaveClass('text-brand');
      expect(brandSpan).toHaveClass('group-hover:text-brand-hover');
    });

    it('로그인 링크 클릭 영역이 텍스트 너비로 제한되고 중앙 정렬된다', () => {
      renderWithProviders(<SignupForm />);
      const link = screen.getByRole('link', { name: /로그인/i });
      expect(link).toHaveClass('w-fit');
      expect(link).toHaveClass('mx-auto');
    });

    it('로그인 링크가 포커스 가능하고 tabIndex가 배제되지 않는다', () => {
      renderWithProviders(<SignupForm />);
      const link = screen.getByRole('link', { name: /로그인/i });
      link.focus();
      expect(link).toHaveFocus();
      expect(link).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('닉네임 유효성 검증', () => {
    it('닉네임 미입력 시 "닉네임을 입력해주세요" 에러가 표시된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'user@avating.com');
      await user.type(screen.getByLabelText(/^비밀번호$/i), 'Password1!');
      await user.type(screen.getByLabelText(/비밀번호 확인/i), 'Password1!');
      await user.click(screen.getByRole('button', { name: /회원가입/i }));

      await waitFor(() => {
        expect(screen.getByText('닉네임을 입력해주세요')).toBeInTheDocument();
      });
    });

    it('닉네임 1자 입력 시 "2자 이상 입력해주세요" 에러가 표시된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'user@avating.com');
      await user.type(screen.getByLabelText(/닉네임/i), '나');
      await user.type(screen.getByLabelText(/^비밀번호$/i), 'Password1!');
      await user.type(screen.getByLabelText(/비밀번호 확인/i), 'Password1!');
      await user.click(screen.getByRole('button', { name: /회원가입/i }));

      await waitFor(() => {
        expect(screen.getByText('2자 이상 입력해주세요')).toBeInTheDocument();
      });
    });

    it('닉네임 31자 입력 시 "30자 이하로 입력해주세요" 에러가 표시된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'user@avating.com');
      await user.type(screen.getByLabelText(/닉네임/i), 'a'.repeat(31));
      await user.type(screen.getByLabelText(/^비밀번호$/i), 'Password1!');
      await user.type(screen.getByLabelText(/비밀번호 확인/i), 'Password1!');
      await user.click(screen.getByRole('button', { name: /회원가입/i }));

      await waitFor(() => {
        expect(screen.getByText('30자 이하로 입력해주세요')).toBeInTheDocument();
      });
    });
  });

  describe('비밀번호 확인 유효성 검증', () => {
    it('비밀번호 확인이 불일치하면 인라인 에러가 표시된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'user@avating.com');
      await user.type(screen.getByLabelText(/닉네임/i), '아바팅유저');
      await user.type(screen.getByLabelText(/^비밀번호$/i), 'Password1!');
      await user.type(screen.getByLabelText(/비밀번호 확인/i), 'DifferentPass1!');
      await user.click(screen.getByRole('button', { name: /회원가입/i }));

      await waitFor(() => {
        expect(screen.getByText('비밀번호가 일치하지 않습니다')).toBeInTheDocument();
      });
    });
  });

  describe('서버 에러 처리', () => {
    it('409 이메일 충돌 응답 시 이메일 관련 에러 메시지가 표시된다', async () => {
      server.use(publicKeyHandlers.success, signupHandlers.emailConflict);
      const user = userEvent.setup();

      renderWithProviders(<SignupForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'existing@avating.com');
      await user.type(screen.getByLabelText(/닉네임/i), '새유저');
      await user.type(screen.getByLabelText(/^비밀번호$/i), 'Password1!');
      await user.type(screen.getByLabelText(/비밀번호 확인/i), 'Password1!');
      await user.click(screen.getByRole('button', { name: /회원가입/i }));

      await waitFor(() => {
        expect(screen.getByText(/이미 사용 중인 이메일/)).toBeInTheDocument();
      });
    });

    it('409 닉네임 충돌 응답 시 닉네임 관련 에러 메시지가 표시된다', async () => {
      server.use(publicKeyHandlers.success, signupHandlers.nicknameConflict);
      const user = userEvent.setup();

      renderWithProviders(<SignupForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'user@avating.com');
      await user.type(screen.getByLabelText(/닉네임/i), '이미있는닉네임');
      await user.type(screen.getByLabelText(/^비밀번호$/i), 'Password1!');
      await user.type(screen.getByLabelText(/비밀번호 확인/i), 'Password1!');
      await user.click(screen.getByRole('button', { name: /회원가입/i }));

      await waitFor(() => {
        expect(screen.getByText(/이미 사용 중인 닉네임/)).toBeInTheDocument();
      });
    });

    it('422 비밀번호 정책 위반 시 비밀번호 에러 메시지가 표시된다', async () => {
      server.use(publicKeyHandlers.success, signupHandlers.passwordPolicyViolation);
      const user = userEvent.setup();

      renderWithProviders(<SignupForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'user@avating.com');
      await user.type(screen.getByLabelText(/닉네임/i), '새유저');
      await user.type(screen.getByLabelText(/^비밀번호$/i), 'Password1!');
      await user.type(screen.getByLabelText(/비밀번호 확인/i), 'Password1!');
      await user.click(screen.getByRole('button', { name: /회원가입/i }));

      await waitFor(() => {
        expect(screen.getByText(/비밀번호/)).toBeInTheDocument();
      });
    });
  });

  describe('회원가입 성공', () => {
    it('유효한 입력 후 성공 응답 시 onSuccess 콜백이 호출된다', async () => {
      server.use(publicKeyHandlers.success, signupHandlers.success);
      const onSuccess = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<SignupForm onSuccess={onSuccess} />);

      await user.type(screen.getByLabelText(/이메일/i), 'newuser@avating.com');
      await user.type(screen.getByLabelText(/닉네임/i), '새유저');
      await user.type(screen.getByLabelText(/^비밀번호$/i), 'Password1!');
      await user.type(screen.getByLabelText(/비밀번호 확인/i), 'Password1!');
      await user.click(screen.getByRole('button', { name: /회원가입/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledOnce();
      });
    });
  });

  describe('접근성', () => {
    it('이메일 필드에 label이 연결되어 있다', () => {
      renderWithProviders(<SignupForm />);
      expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
    });

    it('닉네임 필드에 label이 연결되어 있다', () => {
      renderWithProviders(<SignupForm />);
      expect(screen.getByLabelText(/닉네임/i)).toBeInTheDocument();
    });

    it('비밀번호 필드에 label이 연결되어 있다', () => {
      renderWithProviders(<SignupForm />);
      expect(screen.getByLabelText(/^비밀번호$/i)).toBeInTheDocument();
    });
  });

  describe('에러 상태 스타일', () => {
    it('이메일 형식 에러일 때 input 에 border-danger 클래스가 적용된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      const emailInput = screen.getByLabelText(/이메일/i);
      await user.type(emailInput, 'notanemail');
      await user.tab();

      await waitFor(() => {
        expect(emailInput).toHaveClass('border-danger');
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('정상 상태에서는 border-danger 가 적용되지 않는다', () => {
      renderWithProviders(<SignupForm />);
      expect(screen.getByLabelText(/이메일/i)).not.toHaveClass('border-danger');
    });
  });

  describe('onTouched 타이밍', () => {
    it('blur 전에는 잘못된 값이라도 에러가 표시되지 않는다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'invalid');

      expect(screen.queryByText('올바른 이메일 형식이 아닙니다')).not.toBeInTheDocument();
    });

    it('blur 직후에 에러가 표시된다 (onTouched)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'invalid');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('올바른 이메일 형식이 아닙니다')).toBeInTheDocument();
      });
    });

    it('blur 로 에러가 표시된 후 다시 입력하면 즉시 에러가 사라진다 (reValidateMode: onChange)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      const emailInput = screen.getByLabelText(/이메일/i);
      await user.type(emailInput, 'invalid');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('올바른 이메일 형식이 아닙니다')).toBeInTheDocument();
      });

      await user.type(emailInput, '@avating.com');

      await waitFor(() => {
        expect(screen.queryByText('올바른 이메일 형식이 아닙니다')).not.toBeInTheDocument();
      });
    });
  });
});
