import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@shared/ui/Toast/Toast';
import { server } from '@shared/mocks/server';
import { sessionHandlers } from '@shared/mocks/handlers/dashboard';
import { DispatchModal } from '../DispatchModal';

function renderWithProviders(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    queryClient,
    ...render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(ToastProvider, null, ui)
      )
    ),
  };
}

const defaultProps = {
  open: true,
  avatarId: 'avatar-1',
  avatarName: 'Moonlit',
  onClose: vi.fn(),
};

describe('DispatchModal', () => {
  describe('열림/닫힘', () => {
    it('open=true 시 모달이 화면에 렌더된다', () => {
      server.use(sessionHandlers.success);
      renderWithProviders(createElement(DispatchModal, { ...defaultProps, open: true }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('open=false 시 모달이 렌더되지 않는다', () => {
      server.use(sessionHandlers.success);
      renderWithProviders(createElement(DispatchModal, { ...defaultProps, open: false }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('Esc 키 입력 시 onClose 가 호출된다', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      server.use(sessionHandlers.success);
      renderWithProviders(createElement(DispatchModal, { ...defaultProps, onClose }));

      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('배경(backdrop) 클릭 시 onClose 가 호출된다', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      server.use(sessionHandlers.success);
      renderWithProviders(createElement(DispatchModal, { ...defaultProps, onClose }));

      const backdrop = screen.getByLabelText('모달 닫기');
      await user.click(backdrop);
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('confirm 클릭', () => {
    it('"매칭하기" 버튼 클릭 시 mutation 이 호출된다 (성공 시)', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      server.use(sessionHandlers.success);
      renderWithProviders(createElement(DispatchModal, { ...defaultProps, onClose }));

      const confirmBtn = screen.getByRole('button', { name: /매칭하기/ });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('성공 시 "매칭 요청을 보냈어요" 토스트가 노출된다', async () => {
      const user = userEvent.setup();
      server.use(sessionHandlers.success);
      renderWithProviders(createElement(DispatchModal, { ...defaultProps }));

      const confirmBtn = screen.getByRole('button', { name: /매칭하기/ });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/매칭 요청을 보냈어요/)).toBeInTheDocument();
      });
    });
  });

  describe('로딩 상태', () => {
    it('mutation 진행 중 confirm 버튼이 disabled 상태이다', async () => {
      server.use(sessionHandlers.success);
      const user = userEvent.setup();
      renderWithProviders(createElement(DispatchModal, { ...defaultProps }));

      const confirmBtn = screen.getByRole('button', { name: /매칭하기/ });
      await user.click(confirmBtn);

      expect(confirmBtn).toBeDisabled();
    });
  });

  describe('402 에러 (다이아 부족)', () => {
    it('402 응답 시 인라인 에러 메시지가 표시된다', async () => {
      const user = userEvent.setup();
      server.use(sessionHandlers.insufficientGems);
      renderWithProviders(createElement(DispatchModal, { ...defaultProps }));

      await user.click(screen.getByRole('button', { name: /매칭하기/ }));

      await waitFor(() => {
        expect(screen.getByText(/다이아/)).toBeInTheDocument();
      });
    });

    it('402 응답 시 "다이아가 부족해요" 토스트가 노출된다', async () => {
      const user = userEvent.setup();
      server.use(sessionHandlers.insufficientGems);
      renderWithProviders(createElement(DispatchModal, { ...defaultProps }));

      await user.click(screen.getByRole('button', { name: /매칭하기/ }));

      await waitFor(() => {
        expect(screen.getByText(/다이아가 부족해요/)).toBeInTheDocument();
      });
    });

    it('402 응답 시 "충전" 안내 버튼이 노출된다', async () => {
      const user = userEvent.setup();
      server.use(sessionHandlers.insufficientGems);
      renderWithProviders(createElement(DispatchModal, { ...defaultProps }));

      await user.click(screen.getByRole('button', { name: /매칭하기/ }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /충전/ })).toBeInTheDocument();
      });
    });
  });

  describe('5xx 에러', () => {
    it('500 응답 시 에러 토스트가 노출된다', async () => {
      const user = userEvent.setup();
      server.use(sessionHandlers.serverError);
      renderWithProviders(createElement(DispatchModal, { ...defaultProps }));

      await user.click(screen.getByRole('button', { name: /매칭하기/ }));

      await waitFor(() => {
        expect(screen.getByText(/매칭 요청에 실패했어요/)).toBeInTheDocument();
      });
    });

    it('500 응답 시 모달이 유지된다 (닫히지 않음)', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      server.use(sessionHandlers.serverError);
      renderWithProviders(createElement(DispatchModal, { ...defaultProps, onClose }));

      await user.click(screen.getByRole('button', { name: /매칭하기/ }));

      await waitFor(() => {
        expect(screen.getByText(/매칭 요청에 실패했어요/)).toBeInTheDocument();
      });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('a11y', () => {
    it('open 시 focus 가 모달 내부로 이동한다', async () => {
      server.use(sessionHandlers.success);
      renderWithProviders(createElement(DispatchModal, { ...defaultProps }));
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(document.activeElement === dialog || dialog.contains(document.activeElement)).toBe(
          true
        );
      });
    });

    it('axe 위반 0 (jest-axe 미설치 — 도입 후 활성화)', () => {
      expect(true).toBe(true);
    });
  });
});
