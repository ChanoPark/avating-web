import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PageTransition } from '../PageTransition';

describe('PageTransition', () => {
  it('children을 렌더한다', () => {
    render(
      <PageTransition>
        <div>페이지 콘텐츠</div>
      </PageTransition>
    );
    expect(screen.getByText('페이지 콘텐츠')).toBeInTheDocument();
  });

  it('className 이 전달되면 motion div 에 적용된다', () => {
    const { container } = render(
      <PageTransition className="test-class">
        <span>콘텐츠</span>
      </PageTransition>
    );
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('className 미전달 시에도 렌더된다', () => {
    render(
      <PageTransition>
        <span>기본</span>
      </PageTransition>
    );
    expect(screen.getByText('기본')).toBeInTheDocument();
  });
});
