import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '../Sidebar';

describe('Sidebar', () => {
  it('<nav aria-label="메인 내비게이션"> 로 렌더된다', () => {
    render(<Sidebar>내용</Sidebar>);
    const nav = screen.getByRole('navigation', { name: '메인 내비게이션' });
    expect(nav).toBeInTheDocument();
  });

  it('children 을 그대로 렌더한다', () => {
    render(
      <Sidebar>
        <span>사이드바 아이템1</span>
        <span>사이드바 아이템2</span>
      </Sidebar>
    );
    expect(screen.getByText('사이드바 아이템1')).toBeInTheDocument();
    expect(screen.getByText('사이드바 아이템2')).toBeInTheDocument();
  });

  it('collapsed prop 이 없을 때 기본 렌더된다', () => {
    render(<Sidebar>항목</Sidebar>);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('collapsed=true 시 data-collapsed 속성 또는 collapsed 클래스가 적용된다', () => {
    render(<Sidebar collapsed>항목</Sidebar>);
    const nav = screen.getByRole('navigation');
    const hasCollapsedAttr = nav.hasAttribute('data-collapsed');
    const hasCollapsedClass =
      nav.className.includes('collapsed') || nav.className.includes('icon-only');
    expect(hasCollapsedAttr || hasCollapsedClass).toBe(true);
  });

  it('collapsed=false 시 collapsed 속성이 없다', () => {
    render(<Sidebar collapsed={false}>항목</Sidebar>);
    const nav = screen.getByRole('navigation');
    expect(nav).not.toHaveAttribute('data-collapsed', 'true');
  });

  it('collapsed=true 시 56px 폭(w-14) 으로 렌더된다', () => {
    render(<Sidebar collapsed>항목</Sidebar>);
    const nav = screen.getByRole('navigation');
    expect(nav.className.includes('w-14')).toBe(true);
  });

  it('collapsed=false 시 220px 폭(w-[220px]) 으로 렌더된다', () => {
    render(<Sidebar collapsed={false}>항목</Sidebar>);
    const nav = screen.getByRole('navigation');
    expect(nav.className.includes('w-[220px]')).toBe(true);
  });
});
