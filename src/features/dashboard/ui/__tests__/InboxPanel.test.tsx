import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@shared/mocks/server';
import { inboxScenarios } from '@shared/mocks/handlers/inbox';
import { InboxPanel } from '../InboxPanel';

describe('InboxPanel', () => {
  describe('렌더링', () => {
    it('헤더에 "메시지함" 이 표시된다', async () => {
      server.use(inboxScenarios.success);
      renderWithProviders(<InboxPanel />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /메시지함/ })).toBeInTheDocument();
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

  describe('읽지 않은 메시지 카운트', () => {
    it('unreadCount=2 일 때 배지 텍스트 "2" 가 렌더된다', async () => {
      server.use(inboxScenarios.success);
      renderWithProviders(<InboxPanel />);
      await waitFor(() => {
        const badge = screen.getByLabelText(/읽지 않은 메시지 2개/);
        expect(badge).toHaveTextContent('2');
      });
    });

    it('unreadCount=0 (모두 읽음) 일 때 배지가 없다', async () => {
      server.use(inboxScenarios.empty);
      renderWithProviders(<InboxPanel />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /메시지함/ })).toBeInTheDocument();
      });
      expect(screen.queryByLabelText(/읽지 않은 메시지/)).not.toBeInTheDocument();
    });
  });

  describe('항목 렌더', () => {
    it('각 항목에 발신자 이니셜·이름·메시지·상대시간이 표시된다', async () => {
      server.use(inboxScenarios.success);
      renderWithProviders(<InboxPanel />);
      await waitFor(() => {
        expect(screen.getByText('Moonlit Narrator')).toBeInTheDocument();
        expect(screen.getByText('MN')).toBeInTheDocument();
        const messageEls = screen.getAllByText(/내 아바타에 호감을 표시했어요/);
        expect(messageEls.length).toBeGreaterThan(0);
      });
    });

    it('읽지 않은 항목에 data-unread="true" 가 적용된다', async () => {
      server.use(inboxScenarios.success);
      const { container } = renderWithProviders(<InboxPanel />);
      await waitFor(() => {
        const unreadItems = container.querySelectorAll('[data-unread="true"]');
        expect(unreadItems.length).toBe(2);
      });
    });
  });

  describe('빈 상태', () => {
    it('items 가 비어있을 때 "새 메시지가 없습니다" 가 렌더된다', async () => {
      server.use(inboxScenarios.empty);
      renderWithProviders(<InboxPanel />);
      await waitFor(() => {
        expect(screen.getByText(/새 메시지가 없습니다/)).toBeInTheDocument();
      });
    });
  });
});
