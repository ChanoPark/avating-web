import type { AxiosError } from 'axios';

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string | undefined;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

function extractResponseBody(error: AxiosError): { message?: string; code?: string } {
  const data = error.response?.data;
  if (data !== null && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const result: { message?: string; code?: string } = {};
    if (typeof obj.message === 'string') result.message = obj.message;
    if (typeof obj.code === 'string') result.code = obj.code;
    return result;
  }
  return {};
}

export function parseApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  const axiosError = error as AxiosError;
  if (axiosError.isAxiosError) {
    const response = axiosError.response;
    const status = response !== undefined ? response.status : 0;
    const body = extractResponseBody(axiosError);
    const message = body.message ?? axiosError.message;
    const code = body.code;
    return new ApiError(status, message, code);
  }

  if (error instanceof Error) {
    return new ApiError(0, error.message);
  }

  return new ApiError(0, 'Unknown error');
}
