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

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/이메일/i), 'user@avating.com');
  await user.type(screen.getByLabelText(/닉네임/i), '아바팅유저');
  await user.type(screen.getByLabelText(/^비밀번호$/i), 'Password1!');
  await user.click(screen.getByRole('checkbox', { name: /약관에 동의/ }));
}

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

    it('Google·Apple OAuth 버튼이 렌더된다', () => {
      renderWithProviders(<SignupForm />);
      expect(screen.getByRole('button', { name: /Google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Apple/i })).toBeInTheDocument();
    });

    it('OR divider 가 렌더된다', () => {
      renderWithProviders(<SignupForm />);
      expect(screen.getByText('OR')).toBeInTheDocument();
    });

    it('비밀번호 강도 progressbar 가 렌더된다', () => {
      renderWithProviders(<SignupForm />);
      expect(screen.getByRole('progressbar', { name: /비밀번호 강도/ })).toBeInTheDocument();
    });

    it('약관 동의 체크박스가 렌더된다', () => {
      renderWithProviders(<SignupForm />);
      expect(screen.getByRole('checkbox', { name: /약관에 동의/ })).toBeInTheDocument();
    });

    it('알림 수신 체크박스가 렌더된다 (선택)', () => {
      renderWithProviders(<SignupForm />);
      expect(screen.getByRole('checkbox', { name: /알림 수신/ })).toBeInTheDocument();
    });

    it('"계정 만들기" 제출 버튼이 렌더된다', () => {
      renderWithProviders(<SignupForm />);
      expect(screen.getByRole('button', { name: /계정 만들기/ })).toBeInTheDocument();
    });

    it('"본인 인증은 실제 매칭 시점에 진행됩니다" 안내가 렌더된다', () => {
      renderWithProviders(<SignupForm />);
      expect(screen.getByText(/본인 인증은 실제 매칭 시점에 진행됩니다/)).toBeInTheDocument();
    });

    it('로그인 링크가 렌더되고 /login href를 가진다', () => {
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
  });

  describe('닉네임 유효성 검증', () => {
    it('닉네임 미입력 시 "닉네임을 입력해주세요" 에러가 표시된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'user@avating.com');
      await user.type(screen.getByLabelText(/^비밀번호$/i), 'Password1!');
      await user.click(screen.getByRole('checkbox', { name: /약관에 동의/ }));
      await user.click(screen.getByRole('button', { name: /계정 만들기/ }));

      await waitFor(() => {
        expect(screen.getByText(/닉네임을 입력해주세요/)).toBeInTheDocument();
      });
    });

    it('닉네임 1자 입력 시 "2자 이상 입력해주세요" 에러가 표시된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'user@avating.com');
      await user.type(screen.getByLabelText(/닉네임/i), '나');
      await user.type(screen.getByLabelText(/^비밀번호$/i), 'Password1!');
      await user.click(screen.getByRole('checkbox', { name: /약관에 동의/ }));
      await user.click(screen.getByRole('button', { name: /계정 만들기/ }));

      await waitFor(() => {
        expect(screen.getByText(/2자 이상 입력해주세요/)).toBeInTheDocument();
      });
    });

    it('닉네임 31자 입력 시 "30자 이하로 입력해주세요" 에러가 표시된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'user@avating.com');
      await user.type(screen.getByLabelText(/닉네임/i), 'a'.repeat(31));
      await user.type(screen.getByLabelText(/^비밀번호$/i), 'Password1!');
      await user.click(screen.getByRole('checkbox', { name: /약관에 동의/ }));
      await user.click(screen.getByRole('button', { name: /계정 만들기/ }));

      await waitFor(() => {
        expect(screen.getByText(/30자 이하로 입력해주세요/)).toBeInTheDocument();
      });
    });
  });

  describe('약관 동의 유효성', () => {
    it('약관 미동의 시 제출하면 메시지·aria-invalid·aria-describedby 가 모두 적용된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      await user.type(screen.getByLabelText(/이메일/i), 'user@avating.com');
      await user.type(screen.getByLabelText(/닉네임/i), '아바팅유저');
      await user.type(screen.getByLabelText(/^비밀번호$/i), 'Password1!');
      await user.click(screen.getByRole('button', { name: /계정 만들기/ }));

      const termsCheckbox = screen.getByRole('checkbox', { name: /약관에 동의/ });

      await waitFor(() => {
        // 단언 1: 에러 메시지 텍스트
        expect(screen.getByText(/약관에 동의해주세요/)).toBeInTheDocument();
        // 단언 2: aria-invalid="true"
        expect(termsCheckbox).toHaveAttribute('aria-invalid', 'true');
        // 단언 3: 에러 시각 스타일(border-danger + outline-danger)
        expect(termsCheckbox).toHaveClass('border-danger');
        expect(termsCheckbox).toHaveClass('outline-danger');
        // 단언 4: aria-describedby 가 에러 id 를 가리킴
        expect(termsCheckbox).toHaveAttribute('aria-describedby', 'signup-terms-error');
        // 단언 5: 에러 p 요소가 해당 id 를 가짐 (describedby 양방향 정합)
        expect(screen.getByText(/약관에 동의해주세요/).closest('p')).toHaveAttribute(
          'id',
          'signup-terms-error'
        );
      });
    });

    it('약관 동의 후 재제출 시 에러가 사라진다 (reValidateMode: onChange)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      await fillValidForm(user);
      // 한 번 체크해제 → 제출 → 에러
      await user.click(screen.getByRole('checkbox', { name: /약관에 동의/ }));
      await user.click(screen.getByRole('button', { name: /계정 만들기/ }));

      await waitFor(() => {
        expect(screen.getByText(/약관에 동의해주세요/)).toBeInTheDocument();
      });

      // 다시 체크 → 즉시 에러 사라짐
      await user.click(screen.getByRole('checkbox', { name: /약관에 동의/ }));

      await waitFor(() => {
        expect(screen.queryByText(/약관에 동의해주세요/)).not.toBeInTheDocument();
      });
    });
  });

  describe('비밀번호 강도 progressbar', () => {
    it('빈 입력 시 aria-valuenow 가 0 이다', () => {
      renderWithProviders(<SignupForm />);
      const progressbar = screen.getByRole('progressbar', { name: /비밀번호 강도/ });
      expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    });

    it('짧은 비밀번호("Aa1") 입력 시 aria-valuenow=1, "8자 이상 필요" 라벨', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      await user.type(screen.getByLabelText(/^비밀번호$/i), 'Aa1');

      const progressbar = screen.getByRole('progressbar', { name: /비밀번호 강도/ });
      await waitFor(() => {
        expect(progressbar).toHaveAttribute('aria-valuenow', '1');
        expect(screen.getByText(/8자 이상 필요/)).toBeInTheDocument();
      });
    });

    it('1종 카테고리 + 8자 이상("password") 입력 시 aria-valuenow=1, "약함" 라벨', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      await user.type(screen.getByLabelText(/^비밀번호$/i), 'password');

      const progressbar = screen.getByRole('progressbar', { name: /비밀번호 강도/ });
      await waitFor(() => {
        expect(progressbar).toHaveAttribute('aria-valuenow', '1');
        expect(screen.getByText(/^약함$/)).toBeInTheDocument();
      });
    });

    it('2종 카테고리 + 8자 이상("password1") 입력 시 aria-valuenow=2, "보통" 라벨', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      await user.type(screen.getByLabelText(/^비밀번호$/i), 'password1');

      const progressbar = screen.getByRole('progressbar', { name: /비밀번호 강도/ });
      await waitFor(() => {
        expect(progressbar).toHaveAttribute('aria-valuenow', '2');
        expect(screen.getByText(/^보통$/)).toBeInTheDocument();
      });
    });

    it('3종 + 8자 이상("Password1") 입력 시 aria-valuenow=3, "강함" 라벨', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      await user.type(screen.getByLabelText(/^비밀번호$/i), 'Password1');

      const progressbar = screen.getByRole('progressbar', { name: /비밀번호 강도/ });
      await waitFor(() => {
        expect(progressbar).toHaveAttribute('aria-valuenow', '3');
        expect(screen.getByText(/^강함$/)).toBeInTheDocument();
      });
    });

    it('4종 + 8자 이상("Password1!") 입력 시 aria-valuenow=4, "매우 강함" 라벨', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      await user.type(screen.getByLabelText(/^비밀번호$/i), 'Password1!');

      const progressbar = screen.getByRole('progressbar', { name: /비밀번호 강도/ });
      await waitFor(() => {
        expect(progressbar).toHaveAttribute('aria-valuenow', '4');
        expect(screen.getByText(/매우 강함/)).toBeInTheDocument();
      });
    });
  });

  describe('비밀번호 input aria-describedby 전환', () => {
    it('에러 없을 때는 강도 컨테이너를 가리킨다 (signup-password-strength)', () => {
      renderWithProviders(<SignupForm />);
      const passwordInput = screen.getByLabelText(/^비밀번호$/i);
      expect(passwordInput).toHaveAttribute('aria-describedby', 'signup-password-strength');
    });

    it('비밀번호 유효성 에러 발생 시 에러 id 를 가리킨다 (signup-password-error)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      const passwordInput = screen.getByLabelText(/^비밀번호$/i);
      await user.type(passwordInput, 'short');
      await user.tab();

      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('aria-describedby', 'signup-password-error');
      });
    });
  });

  describe('marketingOptIn 체크박스 인터랙션', () => {
    it('기본 미체크 상태에서 클릭 시 체크 상태로 전환된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      const optIn = screen.getByRole('checkbox', { name: /알림 수신/ });
      expect(optIn).not.toBeChecked();

      await user.click(optIn);
      expect(optIn).toBeChecked();
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
      await user.click(screen.getByRole('checkbox', { name: /약관에 동의/ }));
      await user.click(screen.getByRole('button', { name: /계정 만들기/ }));

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
      await user.click(screen.getByRole('checkbox', { name: /약관에 동의/ }));
      await user.click(screen.getByRole('button', { name: /계정 만들기/ }));

      await waitFor(() => {
        expect(screen.getByText(/이미 사용 중인 닉네임/)).toBeInTheDocument();
      });
    });

    it('422 비밀번호 정책 위반 시 비밀번호 에러 메시지가 표시된다', async () => {
      server.use(publicKeyHandlers.success, signupHandlers.passwordPolicyViolation);
      const user = userEvent.setup();

      renderWithProviders(<SignupForm />);

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /계정 만들기/ }));

      await waitFor(() => {
        expect(screen.getByText(/비밀번호 형식이 올바르지 않습니다/)).toBeInTheDocument();
      });
    });

    it('400 응답 시 root 에러 배너가 role="alert" 영역에 표시된다', async () => {
      server.use(publicKeyHandlers.success, signupHandlers.badRequest);
      const user = userEvent.setup();

      renderWithProviders(<SignupForm />);

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /계정 만들기/ }));

      await waitFor(() => {
        const banner = screen.getByText(/입력 정보를 확인해 주세요/);
        expect(banner).toBeInTheDocument();
        // role=alert 컨테이너 안에 위치
        expect(banner.closest('[role="alert"]')).not.toBeNull();
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
      await user.click(screen.getByRole('checkbox', { name: /약관에 동의/ }));
      await user.click(screen.getByRole('button', { name: /계정 만들기/ }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledOnce();
      });
    });
  });

  describe('marketingOptIn 로컬 기록', () => {
    beforeEach(() => {
      localStorage.removeItem('avating:marketing-opt-in');
    });

    it('체크되지 않은 상태로 가입 성공 시 localStorage 에 "false" 가 기록된다', async () => {
      server.use(publicKeyHandlers.success, signupHandlers.success);
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const onSuccess = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<SignupForm onSuccess={onSuccess} />);

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /계정 만들기/ }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledOnce();
      });
      expect(setItemSpy).toHaveBeenCalledWith('avating:marketing-opt-in', 'false');
      setItemSpy.mockRestore();
    });

    it('체크 후 가입 성공 시 localStorage 에 "true" 가 기록된다', async () => {
      server.use(publicKeyHandlers.success, signupHandlers.success);
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const onSuccess = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<SignupForm onSuccess={onSuccess} />);

      await fillValidForm(user);
      await user.click(screen.getByRole('checkbox', { name: /알림 수신/ }));
      await user.click(screen.getByRole('button', { name: /계정 만들기/ }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledOnce();
      });
      expect(setItemSpy).toHaveBeenCalledWith('avating:marketing-opt-in', 'true');
      setItemSpy.mockRestore();
    });

    it('localStorage.setItem 이 throw 해도 onSuccess 는 정상 호출된다 (Safari 프라이빗 모드 등 방어)', async () => {
      server.use(publicKeyHandlers.success, signupHandlers.success);
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      const onSuccess = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<SignupForm onSuccess={onSuccess} />);

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /계정 만들기/ }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledOnce();
      });
      setItemSpy.mockRestore();
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
        expect(screen.getByText(/올바른 이메일 형식이 아닙니다/)).toBeInTheDocument();
      });
    });

    it('blur 로 에러가 표시된 후 다시 입력하면 즉시 에러가 사라진다 (reValidateMode: onChange)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

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
