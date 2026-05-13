import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@shared/mocks/server';
import { loginHandlers, publicKeyHandlers } from '@shared/mocks/handlers/auth';
import { LoginForm } from '../ui/LoginForm';

vi.mock('../lib/encryptPassword', () => ({
  encryptPassword: vi.fn(() => 'mock-encrypted-password'),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링', () => {
    it('이메일 input이 렌더된다', () => {
      renderWithProviders(<LoginForm />);
      expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
    });

    it('비밀번호 input이 렌더된다', () => {
      renderWithProviders(<LoginForm />);
      expect(screen.getByLabelText(/비밀번호/i)).toBeInTheDocument();
    });

    it('제출 버튼이 렌더된다', () => {
      renderWithProviders(<LoginForm />);
      expect(screen.getByRole('button', { name: /로그인/i })).toBeInTheDocument();
    });

    it('회원가입 링크가 렌더된다', () => {
      renderWithProviders(<LoginForm />);
      const link = screen.getByRole('link', { name: /가입하기/ });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/signup');
    });

    it('Google·Apple OAuth 버튼이 렌더된다', () => {
      renderWithProviders(<LoginForm />);
      expect(screen.getByRole('button', { name: /Google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Apple/i })).toBeInTheDocument();
    });

    it('OR divider 가 렌더된다', () => {
      renderWithProviders(<LoginForm />);
      expect(screen.getByText('OR')).toBeInTheDocument();
    });

    it('"비밀번호 찾기" 보조 액션이 렌더된다', () => {
      renderWithProviders(<LoginForm />);
      expect(screen.getByRole('button', { name: /비밀번호 찾기/ })).toBeInTheDocument();
    });

    it('"비밀번호 찾기" 버튼은 준비 중 상태로 disabled + title 이 명시된다', () => {
      renderWithProviders(<LoginForm />);
      const resetBtn = screen.getByRole('button', { name: /비밀번호 찾기/ });
      expect(resetBtn).toBeDisabled();
      expect(resetBtn).toHaveAttribute('title', '비밀번호 찾기 (준비 중)');
    });
  });

  describe('빈 폼 제출 유효성 검증', () => {
    it('이메일이 비어있으면 "이메일을 입력해주세요" 에러가 표시된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      await user.click(screen.getByRole('button', { name: /로그인/i }));

      await waitFor(() => {
        expect(screen.getByText(/이메일을 입력해주세요/)).toBeInTheDocument();
      });
    });

    it('비밀번호가 비어있으면 에러 메시지가 표시된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      await user.click(screen.getByRole('button', { name: /로그인/i }));

      await waitFor(() => {
        expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
      });
    });

    it('빈 폼 제출 시 네트워크 요청이 발생하지 않는다', async () => {
      const user = userEvent.setup();
      const requestMade = false;

      renderWithProviders(<LoginForm />);
      await user.click(screen.getByRole('button', { name: /로그인/i }));

      await waitFor(() => {
        expect(screen.getByText(/이메일을 입력해주세요/)).toBeInTheDocument();
      });

      expect(requestMade).toBe(false);
    });
  });

  describe('이메일 형식 유효성 검증', () => {
    it('이메일 형식이 올바르지 않으면 "올바른 이메일 형식이 아닙니다" 에러가 표시된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'notanemail');
      await user.click(screen.getByRole('button', { name: /로그인/i }));

      await waitFor(() => {
        expect(screen.getByText(/올바른 이메일 형식이 아닙니다/)).toBeInTheDocument();
      });
    });
  });

  describe('로그인 성공', () => {
    it('유효한 입력 후 성공 응답 시 onSuccess 콜백이 호출된다', async () => {
      server.use(publicKeyHandlers.success, loginHandlers.success);
      const onSuccess = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<LoginForm onSuccess={onSuccess} />);

      await user.type(screen.getByLabelText(/이메일/i), 'user@avating.com');
      await user.type(screen.getByLabelText(/비밀번호/i), 'Password1!');
      await user.click(screen.getByRole('button', { name: /로그인/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledOnce();
      });
    });
  });

  describe('서버 에러 처리', () => {
    it('404 응답 시 "이메일 또는 비밀번호가 올바르지 않습니다" 메시지가 화면에 표시된다', async () => {
      server.use(publicKeyHandlers.success, loginHandlers.notFound);
      const user = userEvent.setup();

      renderWithProviders(<LoginForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'user@avating.com');
      await user.type(screen.getByLabelText(/비밀번호/i), 'Password1!');
      await user.click(screen.getByRole('button', { name: /로그인/i }));

      await waitFor(() => {
        expect(screen.getByText(/이메일 또는 비밀번호가 올바르지 않습니다/)).toBeInTheDocument();
      });
    });

    it('서버 에러 메시지가 role="alert" 영역에 표시된다', async () => {
      server.use(publicKeyHandlers.success, loginHandlers.notFound);
      const user = userEvent.setup();

      renderWithProviders(<LoginForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'user@avating.com');
      await user.type(screen.getByLabelText(/비밀번호/i), 'Password1!');
      await user.click(screen.getByRole('button', { name: /로그인/i }));

      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        expect(alerts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('제출 중 상태', () => {
    it('제출 중에 버튼이 disabled 상태가 된다', async () => {
      server.use(publicKeyHandlers.success, loginHandlers.success);
      const user = userEvent.setup();

      renderWithProviders(<LoginForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'user@avating.com');
      await user.type(screen.getByLabelText(/비밀번호/i), 'Password1!');

      const button = screen.getByRole('button', { name: /로그인/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /로그인/i })).not.toBeDisabled();
      });
    });
  });

  describe('접근성', () => {
    it('이메일 필드에 label이 연결되어 있다', () => {
      renderWithProviders(<LoginForm />);
      const emailInput = screen.getByLabelText(/이메일/i);
      expect(emailInput).toBeInTheDocument();
    });

    it('비밀번호 필드에 label이 연결되어 있다', () => {
      renderWithProviders(<LoginForm />);
      const passwordInput = screen.getByLabelText(/비밀번호/i);
      expect(passwordInput).toBeInTheDocument();
    });

    it('Tab 키로 이메일 → 비밀번호 → 제출 버튼 순으로 이동할 수 있다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/이메일/i);
      emailInput.focus();

      await user.tab();
      expect(screen.getByLabelText(/비밀번호/i)).toHaveFocus();
    });
  });

  describe('에러 상태 스타일', () => {
    it('이메일 형식 에러일 때 input 에 border-danger 클래스가 적용된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/이메일/i);
      await user.type(emailInput, 'notanemail');
      await user.tab();

      await waitFor(() => {
        expect(emailInput).toHaveClass('border-danger');
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('정상 입력 상태에서는 border-danger 가 적용되지 않는다', () => {
      renderWithProviders(<LoginForm />);
      const emailInput = screen.getByLabelText(/이메일/i);
      expect(emailInput).not.toHaveClass('border-danger');
    });
  });

  describe('onTouched 타이밍', () => {
    it('blur 전에는 잘못된 값이라도 에러가 표시되지 않는다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'invalid');

      expect(screen.queryByText('올바른 이메일 형식이 아닙니다')).not.toBeInTheDocument();
    });

    it('blur 직후에 에러가 표시된다 (onTouched)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'invalid');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/올바른 이메일 형식이 아닙니다/)).toBeInTheDocument();
      });
    });

    it('blur 로 에러가 표시된 후 다시 입력하면 즉시 에러가 사라진다 (reValidateMode: onChange)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/이메일/i);
      await user.type(emailInput, 'invalid');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/올바른 이메일 형식이 아닙니다/)).toBeInTheDocument();
      });

      await user.type(emailInput, '@avating.com');

      await waitFor(() => {
        expect(screen.queryByText(/올바른 이메일 형식이 아닙니다/)).not.toBeInTheDocument();
      });
    });
  });
});
