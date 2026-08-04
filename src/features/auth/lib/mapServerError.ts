import type { UseFormSetError, FieldValues } from 'react-hook-form';
import type { Toast } from '@shared/ui/Toast/toastContext';
import { SERVER_ERROR_CODES } from '@shared/api/errorCodes';

type AuthContext = 'login' | 'signup';

type ServerErrorLike = {
  statusCode?: number;
  code?: string;
  message?: string;
  response?: {
    status?: number;
    data?: {
      code?: string;
      message?: string;
    };
  };
};

/**
 * 계정 열거(account enumeration) 차단 — 비밀번호가 틀렸는지 계정이 없는지 구분되면
 * 가입 여부를 훑을 수 있다. 400·404 를 한 문구로 합친다.
 */
const CREDENTIALS_MESSAGE = '이메일 또는 비밀번호가 올바르지 않습니다.';
const PASSWORD_FORMAT_MESSAGE = '비밀번호 형식이 올바르지 않습니다.';

function extractStatus(error: unknown): number | undefined {
  const e = error as ServerErrorLike;
  if (typeof e.statusCode === 'number') {
    return e.statusCode;
  }
  return e.response?.status;
}

function extractCode(error: unknown): string {
  const e = error as ServerErrorLike;
  if (typeof e.code === 'string' && e.code !== '') {
    return e.code;
  }
  return e.response?.data?.code ?? '';
}

function extractServerMessage(error: unknown): string {
  const e = error as ServerErrorLike;
  const dataMessage = e.response?.data?.message;
  if (dataMessage !== undefined && dataMessage !== '') {
    return dataMessage;
  }
  return e.message ?? '';
}

function setFieldError<T extends FieldValues>(
  setError: UseFormSetError<T>,
  field: 'email' | 'nickname' | 'password',
  message: string
): void {
  setError(field as Parameters<typeof setError>[0], { message });
}

export function mapServerError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  showToast: (toast: Omit<Toast, 'id'>) => void,
  context: AuthContext
): void {
  const status = extractStatus(error);
  const code = extractCode(error);
  const serverMessage = extractServerMessage(error);

  function showGenericToast(): void {
    showToast({
      variant: 'error',
      title: '알 수 없는 오류가 발생했습니다.',
      description: '잠시 후 다시 시도해주세요.',
    });
  }

  // RSA 복호화 실패는 사용자가 아무리 비밀번호를 고쳐도 통과하지 못하는 구현 오류다.
  // 비밀번호 형식 문제로 표시하면 사용자가 무한히 재시도하게 된다(실서버 QA S4).
  if (code === SERVER_ERROR_CODES.AUTH_DECRYPT_FAILED) {
    console.error('[auth] 비밀번호 복호화 실패 — 공개키·암호화 구현을 확인해야 한다', {
      code,
      context,
    });
    showGenericToast();
    return;
  }

  if (status === 400) {
    const message =
      code === SERVER_ERROR_CODES.AUTH_PASSWORD_MISMATCH
        ? CREDENTIALS_MESSAGE
        : '입력 정보를 확인해 주세요.';
    setError('root', { message });
    return;
  }

  if (status === 404) {
    if (context === 'login') {
      setError('root', { message: CREDENTIALS_MESSAGE });
    } else {
      setError('root', { message: '회원을 찾을 수 없습니다.' });
    }
    return;
  }

  if (status === 409 && context === 'signup') {
    if (code === SERVER_ERROR_CODES.MEMBER_EMAIL_CONFLICT) {
      setFieldError(setError, 'email', serverMessage || '이미 사용 중인 이메일이에요.');
    } else if (code === SERVER_ERROR_CODES.MEMBER_NICKNAME_CONFLICT) {
      setFieldError(setError, 'nickname', serverMessage || '이미 사용 중인 닉네임이에요.');
    } else {
      setError('root', {
        message: serverMessage || '이미 사용 중인 이메일 또는 닉네임입니다.',
      });
    }
    return;
  }

  // 남은 422 는 비밀번호 정책 위반 — 사용자가 고칠 수 있으므로 서버 문구를 그대로 보여준다.
  if (status === 422) {
    setFieldError(setError, 'password', serverMessage || PASSWORD_FORMAT_MESSAGE);
    return;
  }

  showGenericToast();
}
