import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { server } from '@shared/mocks/server';
import { surveyQuestionsHandlers } from '@shared/mocks/handlers/onboarding';
import { useSurveyQuestions } from '../useSurveyQuestions';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(
        ErrorBoundary,
        { fallback: createElement('div', { 'data-testid': 'error-boundary' }, '에러') },
        createElement(Suspense, { fallback: createElement('div', null, '로딩 중') }, children)
      )
    );
  };
}

describe('useSurveyQuestions', () => {
  it('정상 200 응답 시 질문 배열을 반환한다', async () => {
    server.use(surveyQuestionsHandlers.success);
    const { result } = renderHook(() => useSurveyQuestions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0]!.id).toBe('AFFECTION_EXPRESSION_0001');
    expect(result.current.data![0]!.questionType).toBe('SINGLE_CHOICE_5');
    expect(result.current.data![0]!.answers).toHaveLength(5);
  });

  it('각 질문에 id, title, primaryType, questionType, answers 필드가 있다', async () => {
    server.use(surveyQuestionsHandlers.success);
    const { result } = renderHook(() => useSurveyQuestions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    const question = result.current.data![0]!;
    expect(question).toHaveProperty('id');
    expect(question).toHaveProperty('title');
    expect(question).toHaveProperty('primaryType');
    expect(question).toHaveProperty('questionType');
    expect(question).toHaveProperty('answers');
  });

  it('각 답변에 answerId 와 text 필드가 있다', async () => {
    server.use(surveyQuestionsHandlers.success);
    const { result } = renderHook(() => useSurveyQuestions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    const answer = result.current.data![0]!.answers[0]!;
    expect(answer).toHaveProperty('answerId');
    expect(answer).toHaveProperty('text');
  });

  it('staleTime 이 Infinity 라 refetch 없이 캐시된 데이터를 재사용한다', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    server.use(surveyQuestionsHandlers.success);

    let fetchCount = 0;
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result: r1 } = renderHook(() => useSurveyQuestions(), { wrapper });
    await waitFor(() => {
      expect(r1.current.data).toBeDefined();
    });

    fetchCount = queryClient.getQueryCache().findAll().length;

    const { result: r2 } = renderHook(() => useSurveyQuestions(), { wrapper });
    await waitFor(() => {
      expect(r2.current.data).toBeDefined();
    });

    expect(queryClient.getQueryCache().findAll()).toHaveLength(fetchCount);
  });

  it('5xx 응답 시 isError 가 true 가 된다', async () => {
    server.use(surveyQuestionsHandlers.serverError);
    const { result } = renderHook(() => useSurveyQuestions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
