import { describe, it, expect, vi, afterEach } from 'vitest';
import { SERVER_ERROR_CODES } from '@shared/api/errorCodes';
import { mapServerError } from '../lib/mapServerError';
import type { UseFormSetError, FieldValues } from 'react-hook-form';

type AnyForm = Record<string, unknown>;

/** 계정 열거를 막기 위해 400(비밀번호 불일치)·404(회원 없음)가 공유하는 문구. */
const CREDENTIALS_MESSAGE = '이메일 또는 비밀번호가 올바르지 않습니다.';

function makeSetError<T extends FieldValues = AnyForm>(): UseFormSetError<T> {
  return vi.fn<UseFormSetError<T>>();
}

function makeShowToast(): ReturnType<typeof vi.fn> {
  return vi.fn();
}

function makeHttpError(status: number, code?: string, message?: string) {
  return {
    response: {
      status,
      data: {
        code: code ?? '',
        message: message ?? '',
      },
    },
  };
}

/** shared/api/http 의 인터셉터는 axios 에러를 ApiError(statusCode·code 평면)로 바꿔 넘긴다. */
function makeApiError(statusCode: number, code?: string, message?: string) {
  return { statusCode, code: code ?? '', message: message ?? '' };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('mapServerError — 로그인 컨텍스트', () => {
  it(`비밀번호 불일치(${SERVER_ERROR_CODES.AUTH_PASSWORD_MISMATCH})는 회원 없음과 같은 문구를 쓴다`, () => {
    const setError = makeSetError();
    mapServerError(
      makeHttpError(400, SERVER_ERROR_CODES.AUTH_PASSWORD_MISMATCH, '비밀번호가 일치하지 않습니다'),
      setError,
      makeShowToast(),
      'login'
    );

    expect(setError).toHaveBeenCalledWith(
      'root',
      expect.objectContaining({ message: CREDENTIALS_MESSAGE })
    );
  });

  it(`회원 없음(${SERVER_ERROR_CODES.AUTH_MEMBER_NOT_FOUND})도 같은 문구를 쓴다 (계정 열거 차단)`, () => {
    const setError = makeSetError();
    mapServerError(
      makeHttpError(404, SERVER_ERROR_CODES.AUTH_MEMBER_NOT_FOUND, '회원을 찾을 수 없습니다'),
      setError,
      makeShowToast(),
      'login'
    );

    expect(setError).toHaveBeenCalledWith(
      'root',
      expect.objectContaining({ message: CREDENTIALS_MESSAGE })
    );
  });

  it('ApiError 평면 형태(statusCode·code)로 와도 같은 문구를 쓴다', () => {
    const setError = makeSetError();
    mapServerError(
      makeApiError(400, SERVER_ERROR_CODES.AUTH_PASSWORD_MISMATCH),
      setError,
      makeShowToast(),
      'login'
    );

    expect(setError).toHaveBeenCalledWith(
      'root',
      expect.objectContaining({ message: CREDENTIALS_MESSAGE })
    );
  });

  it('코드 없는 400 은 입력 형식 안내로 남는다', () => {
    const setError = makeSetError();
    mapServerError(makeHttpError(400), setError, makeShowToast(), 'login');

    expect(setError).toHaveBeenCalledWith(
      'root',
      expect.objectContaining({ message: '입력 정보를 확인해 주세요.' })
    );
  });

  it('코드 없는 422 는 password 필드 기본 문구로 떨어진다', () => {
    const setError = makeSetError();
    mapServerError(makeHttpError(422), setError, makeShowToast(), 'login');

    expect(setError).toHaveBeenCalledWith(
      'password',
      expect.objectContaining({ message: expect.stringContaining('비밀번호') })
    );
  });

  it(`RSA 복호화 실패(${SERVER_ERROR_CODES.AUTH_DECRYPT_FAILED})는 사용자 잘못으로 표시하지 않고 일반 오류 토스트를 띄운다`, () => {
    const setError = makeSetError();
    const showToast = makeShowToast();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    mapServerError(
      makeHttpError(422, SERVER_ERROR_CODES.AUTH_DECRYPT_FAILED, '복호화 실패'),
      setError,
      showToast,
      'login'
    );

    expect(setError).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining('알 수 없는 오류') })
    );
    expect(consoleSpy).toHaveBeenCalled();
  });
});

describe('mapServerError — 회원가입 컨텍스트', () => {
  it('404 에러는 "회원을 찾을 수 없습니다." 메시지를 설정한다', () => {
    const setError = makeSetError();
    mapServerError(makeHttpError(404), setError, makeShowToast(), 'signup');

    expect(setError).toHaveBeenCalledWith(
      'root',
      expect.objectContaining({ message: '회원을 찾을 수 없습니다.' })
    );
  });

  it(`이메일 중복(${SERVER_ERROR_CODES.MEMBER_EMAIL_CONFLICT})은 email 필드에 인라인으로 붙는다`, () => {
    const setError = makeSetError();
    mapServerError(
      makeHttpError(409, SERVER_ERROR_CODES.MEMBER_EMAIL_CONFLICT, '이미 사용 중인 이메일입니다.'),
      setError,
      makeShowToast(),
      'signup'
    );

    expect(setError).toHaveBeenCalledWith(
      'email',
      expect.objectContaining({ message: expect.stringContaining('이메일') })
    );
  });

  it(`닉네임 중복(${SERVER_ERROR_CODES.MEMBER_NICKNAME_CONFLICT})은 nickname 필드에 인라인으로 붙는다`, () => {
    const setError = makeSetError();
    mapServerError(
      makeHttpError(
        409,
        SERVER_ERROR_CODES.MEMBER_NICKNAME_CONFLICT,
        '이미 사용 중인 닉네임입니다.'
      ),
      setError,
      makeShowToast(),
      'signup'
    );

    expect(setError).toHaveBeenCalledWith(
      'nickname',
      expect.objectContaining({ message: expect.stringContaining('닉네임') })
    );
  });

  it('코드를 모르는 409 는 root 배너로 떨어진다', () => {
    const setError = makeSetError();
    mapServerError(makeHttpError(409), setError, makeShowToast(), 'signup');

    expect(setError).toHaveBeenCalledWith(
      'root',
      expect.objectContaining({ message: expect.stringContaining('이미 사용 중인') })
    );
  });

  it(`비밀번호 정책 위반(${SERVER_ERROR_CODES.AUTH_PASSWORD_POLICY_WEAK})은 서버 문구 그대로 password 필드에 붙는다`, () => {
    const setError = makeSetError();
    mapServerError(
      makeHttpError(
        422,
        SERVER_ERROR_CODES.AUTH_PASSWORD_POLICY_WEAK,
        '비밀번호는 영문·숫자·특수문자를 포함해야 합니다.'
      ),
      setError,
      makeShowToast(),
      'signup'
    );

    expect(setError).toHaveBeenCalledWith(
      'password',
      expect.objectContaining({
        message: '비밀번호는 영문·숫자·특수문자를 포함해야 합니다.',
      })
    );
  });

  it('코드 없는 422 는 password 필드 기본 문구로 떨어진다', () => {
    const setError = makeSetError();
    mapServerError(makeHttpError(422), setError, makeShowToast(), 'signup');

    expect(setError).toHaveBeenCalledWith(
      'password',
      expect.objectContaining({ message: expect.stringContaining('비밀번호') })
    );
  });

  it(`RSA 복호화 실패(${SERVER_ERROR_CODES.AUTH_DECRYPT_FAILED})는 가입에서도 토스트다`, () => {
    const setError = makeSetError();
    const showToast = makeShowToast();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    mapServerError(
      makeHttpError(422, SERVER_ERROR_CODES.AUTH_DECRYPT_FAILED),
      setError,
      showToast,
      'signup'
    );

    expect(setError).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalled();
  });
});

describe('mapServerError — 알 수 없는 에러', () => {
  it('알 수 없는 상태 코드는 "알 수 없는 오류가 발생했습니다." 토스트를 노출한다', () => {
    const showToast = makeShowToast();
    mapServerError(makeHttpError(500), makeSetError(), showToast, 'login');

    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('알 수 없는 오류'),
      })
    );
  });

  it('응답 없는 에러(network error)도 "알 수 없는 오류" 토스트를 노출한다', () => {
    const showToast = makeShowToast();
    mapServerError(new Error('Network Error'), makeSetError(), showToast, 'login');

    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('알 수 없는 오류'),
      })
    );
  });
});
