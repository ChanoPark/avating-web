import type { UseFormSetError, FieldValues } from 'react-hook-form';
import type { Toast } from '@shared/ui/Toast/toastContext';

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

function extractStatus(error: unknown): number | undefined {
  const e = error as ServerErrorLike;
  if (typeof e.statusCode === 'number') {
    return e.statusCode;
  }
  return e.response?.status;
}

function extractCode(error: unknown): string {
  const e = error as ServerErrorLike;
  if (typeof e.code === 'string') {
    return e.code;
  }
  return e.response?.data?.code ?? '';
}

function extractServerMessage(error: unknown): string {
  const e = error as ServerErrorLike;
  const dataMessage = e.response?.data?.message;
  if (dataMessage !== undefined) {
    return dataMessage;
  }
  return e.message ?? '';
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

  if (status === 400) {
    setError('root', { message: '입력 정보를 확인해 주세요.' });
    return;
  }

  if (status === 404) {
    if (context === 'login') {
      setError('root', { message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    } else {
      setError('root', { message: '회원을 찾을 수 없습니다.' });
    }
    return;
  }

  if (status === 409 && context === 'signup') {
    if (code === 'EMAIL_CONFLICT') {
      setError('email' as Parameters<typeof setError>[0], {
        message: serverMessage || '이미 사용 중인 이메일이에요.',
      });
    } else if (code === 'NICKNAME_CONFLICT') {
      setError('nickname' as Parameters<typeof setError>[0], {
        message: serverMessage || '이미 사용 중인 닉네임이에요.',
      });
    } else {
      setError('root', {
        message: serverMessage || '이미 사용 중인 이메일 또는 닉네임입니다.',
      });
    }
    return;
  }

  if (status === 422) {
    if (context === 'login') {
      setError('root', { message: '비밀번호 형식이 올바르지 않습니다.' });
    } else {
      setError('password' as Parameters<typeof setError>[0], {
        message: '비밀번호 형식이 올바르지 않습니다.',
      });
    }
    return;
  }

  showToast({
    variant: 'error',
    title: '알 수 없는 오류가 발생했습니다.',
    description: '잠시 후 다시 시도해주세요.',
  });
}
