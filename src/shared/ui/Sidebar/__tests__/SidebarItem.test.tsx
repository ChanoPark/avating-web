import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { LayoutGrid } from 'lucide-react';
import { SidebarItem } from '../SidebarItem';

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

describe('SidebarItem', () => {
  describe('링크 렌더', () => {
    it('to 가 있을 때 링크 역할의 요소가 렌더된다', () => {
      render(
        <MemoryRouter>
          <SidebarItem icon={LayoutGrid} label="대시보드" to="/dashboard" />
        </MemoryRouter>
      );
      expect(screen.getByRole('link', { name: /대시보드/ })).toBeInTheDocument();
    });

    it('label 텍스트가 렌더된다', () => {
      render(
        <MemoryRouter>
          <SidebarItem icon={LayoutGrid} label="대시보드" to="/dashboard" />
        </MemoryRouter>
      );
      expect(screen.getByText('대시보드')).toBeInTheDocument();
    });
  });

  describe('active 상태', () => {
    it('active=true 시 aria-current="page" 가 적용된다', () => {
      render(
        <MemoryRouter>
          <SidebarItem icon={LayoutGrid} label="대시보드" to="/dashboard" active />
        </MemoryRouter>
      );
      const link = screen.getByRole('link', { name: /대시보드/ });
      expect(link).toHaveAttribute('aria-current', 'page');
    });

    it('active=false 시 aria-current 가 없다', () => {
      render(
        <MemoryRouter>
          <SidebarItem icon={LayoutGrid} label="대시보드" to="/dashboard" active={false} />
        </MemoryRouter>
      );
      const link = screen.getByRole('link', { name: /대시보드/ });
      expect(link).not.toHaveAttribute('aria-current', 'page');
    });

    it('active=true 시 활성 배경 클래스가 링크에 적용된다', () => {
      render(
        <MemoryRouter>
          <SidebarItem icon={LayoutGrid} label="대시보드" to="/dashboard" active />
        </MemoryRouter>
      );
      const link = screen.getByRole('link', { name: /대시보드/ });
      expect(link.className.includes('bg-bg-elev-2')).toBe(true);
    });
  });

  describe('disabled 상태', () => {
    it('disabled=true 시 aria-disabled="true" 가 적용된다', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <LocationDisplay />
          <SidebarItem icon={LayoutGrid} label="아바타 탐색" disabled />
        </MemoryRouter>
      );
      const item = screen.getByText('아바타 탐색').closest('[aria-disabled]');
      expect(item).toHaveAttribute('aria-disabled', 'true');
    });

    it('disabled=true 시 tabIndex=-1 이 적용된다', () => {
      render(
        <MemoryRouter>
          <SidebarItem icon={LayoutGrid} label="아바타 탐색" disabled />
        </MemoryRouter>
      );
      const item = screen.getByText('아바타 탐색').closest('[aria-disabled="true"]');
      expect(item).toHaveAttribute('tabindex', '-1');
    });

    it('disabled 항목 클릭 시 navigate 가 발생하지 않는다', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <LocationDisplay />
          <SidebarItem icon={LayoutGrid} label="아바타 탐색" disabled />
        </MemoryRouter>
      );

      const locationBefore = screen.getByTestId('location').textContent;

      const item = screen.getByText('아바타 탐색').closest('[aria-disabled="true"]');
      if (item) {
        await user.click(item, { pointerEventsCheck: 0 });
      }

      const locationAfter = screen.getByTestId('location').textContent;
      expect(locationBefore).toBe(locationAfter);
    });
  });

  describe('badge', () => {
    it('badge 숫자가 표시된다', () => {
      render(
        <MemoryRouter>
          <SidebarItem icon={LayoutGrid} label="관전중" to="/watching" badge={3} />
        </MemoryRouter>
      );
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('badge 가 있을 때 접근성 라벨에 알림 수가 포함된다', () => {
      render(
        <MemoryRouter>
          <SidebarItem icon={LayoutGrid} label="관전중" to="/watching" badge={3} />
        </MemoryRouter>
      );
      const link = screen.getByRole('link', { name: /관전중/ });
      expect(link.getAttribute('aria-label') ?? link.textContent ?? '').toMatch(/3/);
    });
  });

  describe('onClick 콜백', () => {
    it('클릭 시 onClick 콜백이 호출된다', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <SidebarItem icon={LayoutGrid} label="대시보드" to="/dashboard" onClick={onClick} />
        </MemoryRouter>
      );
      await user.click(screen.getByRole('link', { name: /대시보드/ }));
      expect(onClick).toHaveBeenCalledOnce();
    });
  });
});
