import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@shared/mocks/server';
import { loginHandlers, publicKeyHandlers } from '@shared/mocks/handlers/auth';
import { http, HttpResponse, delay } from 'msw';
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

    it('"로그인 상태 유지" 체크박스가 준비 중 상태(disabled)로 렌더된다', () => {
      renderWithProviders(<LoginForm />);
      const remember = screen.getByRole('checkbox', { name: /로그인 상태 유지/ });
      expect(remember).toBeInTheDocument();
      expect(remember).toBeDisabled();
    });

    it('비밀번호 placeholder 가 정본 문안이다', () => {
      renderWithProviders(<LoginForm />);
      expect(screen.getByLabelText(/비밀번호/i)).toHaveAttribute('placeholder', '비밀번호 입력');
    });

    it('제출 버튼이 block(w-full) 이고 화살표 아이콘을 갖는다', () => {
      const { container } = renderWithProviders(<LoginForm />);
      const submit = screen.getByRole('button', { name: /로그인/i });
      expect(submit).toHaveClass('w-full');
      expect(submit.querySelector('svg')).not.toBeNull();
      // 문자 글리프(→ ✕)를 쓰지 않는다 — 라인 아이콘만
      expect(container.textContent ?? '').not.toMatch(/[→✕✓]/);
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

    it('빈 폼 제출 시 로그인 네트워크 요청이 발생하지 않는다', async () => {
      const user = userEvent.setup();
      const loginRequests: string[] = [];
      const onRequest = ({ request }: { request: Request }) => {
        if (request.method === 'POST' && request.url.includes('/api/auth/login')) {
          loginRequests.push(request.url);
        }
      };
      server.events.on('request:start', onRequest);

      renderWithProviders(<LoginForm />);
      await user.click(screen.getByRole('button', { name: /로그인/i }));

      await waitFor(() => {
        expect(screen.getByText(/이메일을 입력해주세요/)).toBeInTheDocument();
      });

      expect(loginRequests).toHaveLength(0);
      server.events.removeListener('request:start', onRequest);
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

    it('400 AUTH_400_002 응답도 404 와 같은 문구를 배너에 표시한다', async () => {
      server.use(publicKeyHandlers.success, loginHandlers.passwordMismatch);
      const user = userEvent.setup();

      renderWithProviders(<LoginForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'user@avating.com');
      await user.type(screen.getByLabelText(/비밀번호/i), 'Password1!');
      await user.click(screen.getByRole('button', { name: /로그인/i }));

      await waitFor(() => {
        expect(screen.getByText(/이메일 또는 비밀번호가 올바르지 않습니다/)).toBeInTheDocument();
      });

      // 서버 원문("비밀번호가 일치하지 않습니다")이 새어 나오면 계정 열거가 가능해진다.
      expect(screen.queryByText(/비밀번호가 일치하지 않습니다/)).not.toBeInTheDocument();
    });

    // RSA 복호화 실패는 구현 오류라 사용자가 고칠 수 없다 — 필드 에러가 아니라 토스트로 알린다.
    it('422 AUTH_422_003 응답은 필드 에러 없이 일반 오류 토스트를 띄운다', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      server.use(publicKeyHandlers.success, loginHandlers.rsaFailure);
      const user = userEvent.setup();

      renderWithProviders(<LoginForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'user@avating.com');
      await user.type(screen.getByLabelText(/비밀번호/i), 'Password1!');
      await user.click(screen.getByRole('button', { name: /로그인/i }));

      await waitFor(() => {
        expect(screen.getByText(/알 수 없는 오류가 발생했습니다/)).toBeInTheDocument();
      });

      expect(screen.queryByText(/비밀번호 형식이 올바르지 않습니다/)).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
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

    it('폼 전체 실패는 상단 배너 하나로만 알리고 아이콘은 라인 아이콘이다', async () => {
      server.use(publicKeyHandlers.success, loginHandlers.notFound);
      const user = userEvent.setup();

      const { container } = renderWithProviders(<LoginForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'user@avating.com');
      await user.type(screen.getByLabelText(/비밀번호/i), 'Password1!');
      await user.click(screen.getByRole('button', { name: /로그인/i }));

      await waitFor(() => {
        expect(screen.getByText(/이메일 또는 비밀번호가 올바르지 않습니다/)).toBeInTheDocument();
      });

      expect(screen.getAllByRole('alert')).toHaveLength(1);
      const banner = screen.getAllByRole('alert')[0]!;
      expect(banner.querySelector('svg')).not.toBeNull();
      expect(container.textContent ?? '').not.toMatch(/[→✕✓]/);
    });
  });

  describe('제출 중 상태', () => {
    it('제출 중에 버튼이 disabled 상태가 된다', async () => {
      const BASE = import.meta.env.VITE_API_BASE_URL as string;
      server.use(
        publicKeyHandlers.success,
        http.post(`${BASE}/api/auth/login`, async () => {
          await delay('infinite');
          return HttpResponse.json({ data: {} });
        })
      );
      const user = userEvent.setup();

      renderWithProviders(<LoginForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'user@avating.com');
      await user.type(screen.getByLabelText(/비밀번호/i), 'Password1!');
      await user.click(screen.getByRole('button', { name: /로그인/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /로그인/i })).toBeDisabled();
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
