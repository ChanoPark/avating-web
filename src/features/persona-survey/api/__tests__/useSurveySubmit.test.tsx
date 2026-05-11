import { describe, it, expect } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@shared/mocks/server';
import { surveySubmitHandlers } from '@shared/mocks/handlers/onboarding';
import { ZodError } from 'zod';
import type { AvatarCreateFromSurveyRequest } from '@entities/onboarding/model';
import { useSurveySubmit } from '../useSurveySubmit';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

const validPayload: AvatarCreateFromSurveyRequest = {
  avatarName: '루나',
  description: '내향적인 아바타',
  answers: [
    {
      questionId: 'AFFECTION_EXPRESSION_0001',
      questionType: 'SINGLE_CHOICE_5',
      answerId: 'AFFECTION_EXPRESSION_0001_ANS_1',
    },
  ],
};

describe('useSurveySubmit', () => {
  it('정상 201 응답 시 isSuccess 가 true 가 된다', async () => {
    server.use(surveySubmitHandlers.success);
    const { result } = renderHook(() => useSurveySubmit(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync(validPayload);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('정상 응답 시 mutateAsync 가 avatarId 를 반환한다', async () => {
    server.use(surveySubmitHandlers.success);
    const { result } = renderHook(() => useSurveySubmit(), { wrapper: createWrapper() });

    let returned: { avatarId: string } | undefined;
    await act(async () => {
      returned = await result.current.mutateAsync(validPayload);
    });

    expect(returned?.avatarId).toBe('avatar-generated-001');
  });

  it('백엔드가 avatarId 없는 응답을 반환하면 ZodError 가 throw 된다', async () => {
    server.use(
      http.post(`${BASE_URL}/api/avatars/survey`, () => {
        return HttpResponse.json({ data: {} }, { status: 201 });
      })
    );
    const { result } = renderHook(() => useSurveySubmit(), { wrapper: createWrapper() });

    let caught: unknown = null;
    await act(async () => {
      try {
        await result.current.mutateAsync(validPayload);
      } catch (err: unknown) {
        caught = err;
      }
    });

    expect(caught).toBeInstanceOf(ZodError);
  });

  it('서버 5xx 응답 시 isError 가 true 가 된다', async () => {
    server.use(surveySubmitHandlers.serverError);
    const { result } = renderHook(() => useSurveySubmit(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync(validPayload).catch(() => {});
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('400 validationError 응답 시 isError 가 true 가 된다', async () => {
    server.use(surveySubmitHandlers.validationError);
    const { result } = renderHook(() => useSurveySubmit(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync(validPayload).catch(() => {});
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('avatarName 빈 문자열 입력 시 Zod 경계 검증이 실패해 ZodError 가 throw 된다', async () => {
    server.use(surveySubmitHandlers.success);
    const { result } = renderHook(() => useSurveySubmit(), { wrapper: createWrapper() });

    const invalidPayload = { ...validPayload, avatarName: '' };

    await expect(
      act(async () => {
        await result.current.mutateAsync(invalidPayload);
      })
    ).rejects.toBeInstanceOf(ZodError);
  });

  it('answers 가 빈 배열이면 Zod 경계 검증이 실패한다', async () => {
    server.use(surveySubmitHandlers.success);
    const { result } = renderHook(() => useSurveySubmit(), { wrapper: createWrapper() });

    const invalidPayload = { ...validPayload, answers: [] };

    await expect(
      act(async () => {
        await result.current.mutateAsync(invalidPayload);
      })
    ).rejects.toBeInstanceOf(ZodError);
  });
});
