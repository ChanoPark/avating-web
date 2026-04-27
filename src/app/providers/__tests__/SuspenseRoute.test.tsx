import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SuspenseRoute } from '../SuspenseRoute';

describe('SuspenseRoute', () => {
  it('children을 렌더한다', () => {
    render(
      <SuspenseRoute>
        <div>라우트 콘텐츠</div>
      </SuspenseRoute>
    );
    expect(screen.getByText('라우트 콘텐츠')).toBeInTheDocument();
  });

  it('에러 바운더리 — 자식 컴포넌트에서 에러가 발생하면 에러 메시지를 렌더한다', () => {
    const ErrorChild = () => {
      throw new Error('테스트 에러');
    };

    const originalConsoleError = console.error;
    console.error = () => undefined;

    render(
      <SuspenseRoute>
        <ErrorChild />
      </SuspenseRoute>
    );

    expect(screen.getByText('테스트 에러')).toBeInTheDocument();

    console.error = originalConsoleError;
  });
});
