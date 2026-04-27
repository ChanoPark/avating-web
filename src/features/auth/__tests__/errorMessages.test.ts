import { describe, it, expect, vi } from 'vitest';
import { mapServerError } from '../lib/mapServerError';
import type { UseFormSetError, FieldValues } from 'react-hook-form';

type AnyForm = Record<string, unknown>;

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

describe('mapServerError — 로그인 컨텍스트', () => {
  it('400 에러는 "입력 정보를 확인해 주세요." 메시지를 설정한다', () => {
    const setError = makeSetError();
    const showToast = makeShowToast();
    mapServerError(makeHttpError(400), setError, showToast, 'login');

    expect(setError).toHaveBeenCalledWith(
      'root',
      expect.objectContaining({ message: '입력 정보를 확인해 주세요.' })
    );
  });

  it('404 에러는 "이메일 또는 비밀번호가 올바르지 않습니다." 메시지를 설정한다', () => {
    const setError = makeSetError();
    const showToast = makeShowToast();
    mapServerError(makeHttpError(404), setError, showToast, 'login');

    expect(setError).toHaveBeenCalledWith(
      'root',
      expect.objectContaining({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' })
    );
  });

  it('422 에러는 "비밀번호 형식이 올바르지 않습니다." 메시지를 설정한다', () => {
    const setError = makeSetError();
    const showToast = makeShowToast();
    mapServerError(makeHttpError(422), setError, showToast, 'login');

    expect(setError).toHaveBeenCalledWith(
      'root',
      expect.objectContaining({ message: '비밀번호 형식이 올바르지 않습니다.' })
    );
  });
});

describe('mapServerError — 회원가입 컨텍스트', () => {
  it('404 에러는 "회원을 찾을 수 없습니다." 메시지를 설정한다', () => {
    const setError = makeSetError();
    const showToast = makeShowToast();
    mapServerError(makeHttpError(404), setError, showToast, 'signup');

    expect(setError).toHaveBeenCalledWith(
      'root',
      expect.objectContaining({ message: '회원을 찾을 수 없습니다.' })
    );
  });

  it('409 에러는 "이미 사용 중인 이메일 또는 닉네임입니다." 메시지를 설정한다', () => {
    const setError = makeSetError();
    const showToast = makeShowToast();
    mapServerError(makeHttpError(409), setError, showToast, 'signup');

    expect(setError).toHaveBeenCalledWith(
      expect.stringMatching(/root|email|nickname/),
      expect.objectContaining({ message: expect.stringContaining('이미 사용 중인') })
    );
  });

  it('409 EMAIL_CONFLICT는 email 필드에 에러를 설정한다', () => {
    const setError = makeSetError();
    const showToast = makeShowToast();
    mapServerError(
      makeHttpError(409, 'EMAIL_CONFLICT', '이미 사용 중인 이메일이에요.'),
      setError,
      showToast,
      'signup'
    );

    expect(setError).toHaveBeenCalledWith(
      'email',
      expect.objectContaining({ message: expect.stringContaining('이메일') })
    );
  });

  it('409 NICKNAME_CONFLICT는 nickname 필드에 에러를 설정한다', () => {
    const setError = makeSetError();
    const showToast = makeShowToast();
    mapServerError(
      makeHttpError(409, 'NICKNAME_CONFLICT', '이미 사용 중인 닉네임이에요.'),
      setError,
      showToast,
      'signup'
    );

    expect(setError).toHaveBeenCalledWith(
      'nickname',
      expect.objectContaining({ message: expect.stringContaining('닉네임') })
    );
  });

  it('422 에러는 "비밀번호 형식이 올바르지 않습니다." 메시지를 설정한다', () => {
    const setError = makeSetError();
    const showToast = makeShowToast();
    mapServerError(makeHttpError(422), setError, showToast, 'signup');

    expect(setError).toHaveBeenCalledWith(
      expect.stringMatching(/root|password/),
      expect.objectContaining({ message: expect.stringContaining('비밀번호') })
    );
  });
});

describe('mapServerError — 알 수 없는 에러', () => {
  it('알 수 없는 상태 코드는 "알 수 없는 오류가 발생했습니다." 토스트를 노출한다', () => {
    const setError = makeSetError();
    const showToast = makeShowToast();
    mapServerError(makeHttpError(500), setError, showToast, 'login');

    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('알 수 없는 오류'),
      })
    );
  });

  it('응답 없는 에러(network error)도 "알 수 없는 오류" 토스트를 노출한다', () => {
    const setError = makeSetError();
    const showToast = makeShowToast();
    mapServerError(new Error('Network Error'), setError, showToast, 'login');

    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('알 수 없는 오류'),
      })
    );
  });
});
