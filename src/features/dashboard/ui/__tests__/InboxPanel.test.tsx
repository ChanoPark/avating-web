import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@shared/mocks/server';
import { inboxScenarios } from '@shared/mocks/handlers/inbox';
import { InboxPanel } from '../InboxPanel';

describe('InboxPanel', () => {
  describe('렌더링', () => {
    it('헤더에 "알림" 이 표시된다', async () => {
      server.use(inboxScenarios.success);
      renderWithProviders(<InboxPanel />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /알림/ })).toBeInTheDocument();
      });
    });

    it('"전체 보기" 버튼이 렌더된다', async () => {
      server.use(inboxScenarios.success);
      renderWithProviders(<InboxPanel />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /전체 보기/ })).toBeInTheDocument();
      });
    });
  });

  describe('읽지 않은 알림 카운트', () => {
    it('unreadCount=2 일 때 배지 텍스트 "2" 가 tnum 으로 렌더된다', async () => {
      server.use(inboxScenarios.success);
      renderWithProviders(<InboxPanel />);
      await waitFor(() => {
        const badge = screen.getByLabelText(/읽지 않은 알림 2개/);
        expect(badge).toHaveTextContent('2');
        expect(badge).toHaveClass('tnum');
      });
    });

    it('unreadCount=0 (모두 읽음) 일 때 배지가 없다', async () => {
      server.use(inboxScenarios.empty);
      renderWithProviders(<InboxPanel />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /알림/ })).toBeInTheDocument();
      });
      expect(screen.queryByLabelText(/읽지 않은 알림/)).not.toBeInTheDocument();
    });
  });

  describe('항목 렌더', () => {
    it('각 항목에 알림 내용·발신자·상대시간이 표시된다', async () => {
      server.use(inboxScenarios.success);
      renderWithProviders(<InboxPanel />);
      await waitFor(() => {
        expect(screen.getByText('Moonlit Narrator')).toBeInTheDocument();
        const messageEls = screen.getAllByText(/내 아바타에 호감을 표시했어요/);
        expect(messageEls.length).toBeGreaterThan(0);
      });
    });

    // 정본 `.wf2-noti__dot`(6px 잉크 점) + `.noti-title--unread`(semibold·ink).
    // 행을 통째로 칠하면 목록에서 일부 행만 판이 생겨 리듬이 끊긴다.
    it('읽지 않은 항목은 잉크 점 + 굵은 제목으로 구분되고, 행을 칠하지 않는다', async () => {
      server.use(inboxScenarios.success);
      const { container } = renderWithProviders(<InboxPanel />);
      await waitFor(() => {
        const unreadItems = container.querySelectorAll('[data-unread="true"]');
        expect(unreadItems.length).toBe(2);
      });
      const [first] = container.querySelectorAll('[data-unread="true"]');
      expect(first).not.toHaveClass('bg-selected');
      expect(first?.querySelector('span[aria-hidden="true"]')?.className).toContain('bg-ink');
      expect(first?.querySelector('span:not([aria-hidden]) > span')?.className).toContain(
        'font-semibold'
      );

      const [read] = container.querySelectorAll('[data-unread="false"]');
      expect(read?.querySelector('span[aria-hidden="true"]')?.className).toContain(
        'bg-transparent'
      );
    });
  });

  describe('빈 상태', () => {
    it('items 가 비어있을 때 "새 알림이 없어요" 가 렌더된다', async () => {
      server.use(inboxScenarios.empty);
      renderWithProviders(<InboxPanel />);
      await waitFor(() => {
        expect(screen.getByText(/새 알림이 없어요/)).toBeInTheDocument();
      });
    });
  });
});
