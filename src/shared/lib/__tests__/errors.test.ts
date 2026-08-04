import { describe, it, expect } from 'vitest';
import { ApiError, parseApiError, isApiError } from '../errors';
import type { AxiosError } from 'axios';

describe('ApiError', () => {
  it('statusCode와 message를 가진 ApiError를 생성할 수 있다', () => {
    const error = new ApiError(404, '회원을 찾을 수 없습니다.');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('회원을 찾을 수 없습니다.');
  });

  it('code 옵션 필드를 포함할 수 있다', () => {
    const error = new ApiError(409, '이미 사용 중인 이메일이에요.', 'MEMBER_409_001');
    expect(error.code).toBe('MEMBER_409_001');
  });

  it('code 없이 생성하면 code는 undefined이다', () => {
    const error = new ApiError(400, '잘못된 요청');
    expect(error.code).toBeUndefined();
  });
});

describe('isApiError', () => {
  it('ApiError 인스턴스에 대해 true를 반환한다', () => {
    const error = new ApiError(404, '회원을 찾을 수 없습니다.');
    expect(isApiError(error)).toBe(true);
  });

  it('일반 Error에 대해 false를 반환한다', () => {
    const error = new Error('일반 에러');
    expect(isApiError(error)).toBe(false);
  });

  it('null에 대해 false를 반환한다', () => {
    expect(isApiError(null)).toBe(false);
  });

  it('undefined에 대해 false를 반환한다', () => {
    expect(isApiError(undefined)).toBe(false);
  });
});

describe('parseApiError', () => {
  function makeAxiosError(status: number, data: unknown): AxiosError {
    return {
      isAxiosError: true,
      response: {
        status,
        data,
        headers: {},
        config: {} as AxiosError['config'],
        statusText: String(status),
      },
      message: 'Request failed',
      name: 'AxiosError',
      config: {} as AxiosError['config'],
      toJSON: () => ({}),
    } as unknown as AxiosError;
  }

  it('AxiosError를 ApiError로 변환한다', () => {
    const axiosError = makeAxiosError(404, { message: '회원 없음', code: 'NOT_FOUND' });
    const apiError = parseApiError(axiosError);

    expect(apiError).toBeInstanceOf(ApiError);
    expect(apiError.statusCode).toBe(404);
  });

  it('응답 body의 message를 ApiError.message에 반영한다', () => {
    const axiosError = makeAxiosError(409, { message: '이미 사용 중인 이메일이에요.' });
    const apiError = parseApiError(axiosError);

    expect(apiError.message).toBe('이미 사용 중인 이메일이에요.');
  });

  it('응답 body의 code를 ApiError.code에 반영한다', () => {
    const axiosError = makeAxiosError(409, {
      message: '이미 사용 중인 이메일이에요.',
      code: 'MEMBER_409_001',
    });
    const apiError = parseApiError(axiosError);

    expect(apiError.code).toBe('MEMBER_409_001');
  });

  it('응답이 없는 AxiosError는 statusCode 0의 ApiError로 변환한다', () => {
    const axiosError = {
      isAxiosError: true,
      response: undefined,
      message: 'Network Error',
      name: 'AxiosError',
      config: {} as AxiosError['config'],
      toJSON: () => ({}),
    } as unknown as AxiosError;

    const apiError = parseApiError(axiosError);
    expect(apiError.statusCode).toBe(0);
  });

  it('일반 Error를 parseApiError에 넘기면 statusCode 0으로 래핑된다', () => {
    const error = new Error('네트워크 실패');
    const apiError = parseApiError(error);
    expect(apiError).toBeInstanceOf(ApiError);
    expect(apiError.statusCode).toBe(0);
  });

  it('응답 data가 null이면 message/code 없이 ApiError를 반환한다', () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 422,
        data: null,
        headers: {},
        config: {} as AxiosError['config'],
        statusText: '422',
      },
      message: 'Unprocessable',
      name: 'AxiosError',
      config: {} as AxiosError['config'],
      toJSON: () => ({}),
    } as unknown as AxiosError;

    const apiError = parseApiError(axiosError);
    expect(apiError.statusCode).toBe(422);
    expect(apiError.message).toBe('Unprocessable');
  });

  it('ApiError를 그대로 넘기면 동일한 인스턴스를 반환한다', () => {
    const original = new ApiError(409, '이미 사용 중인 이메일', 'MEMBER_409_001');
    const result = parseApiError(original);
    expect(result).toBe(original);
  });

  it('문자열을 parseApiError에 넘기면 statusCode 0의 ApiError를 반환한다', () => {
    const apiError = parseApiError('unknown error string');
    expect(apiError).toBeInstanceOf(ApiError);
    expect(apiError.statusCode).toBe(0);
  });
});
