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
  });

  describe('닉네임 유효성 검증', () => {
    it('닉네임 1자 입력 시 "2자 이상" 에러가 표시된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'user@avating.com');
      await user.type(screen.getByLabelText(/닉네임/i), '나');
      await user.type(screen.getByLabelText(/^비밀번호$/i), 'Password1!');
      await user.type(screen.getByLabelText(/비밀번호 확인/i), 'Password1!');
      await user.click(screen.getByRole('button', { name: /회원가입/i }));

      await waitFor(() => {
        expect(screen.getByText(/2자 이상/)).toBeInTheDocument();
      });
    });

    it('닉네임 31자 입력 시 "30자 이하" 에러가 표시된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'user@avating.com');
      await user.type(screen.getByLabelText(/닉네임/i), 'a'.repeat(31));
      await user.type(screen.getByLabelText(/^비밀번호$/i), 'Password1!');
      await user.type(screen.getByLabelText(/비밀번호 확인/i), 'Password1!');
      await user.click(screen.getByRole('button', { name: /회원가입/i }));

      await waitFor(() => {
        expect(screen.getByText(/30자 이하/)).toBeInTheDocument();
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
});
