import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('does not render when closed', () => {
    render(
      <Modal open={false} onClose={() => undefined} title="매칭 불가">
        body
      </Modal>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title and description when open', () => {
    render(
      <Modal
        open
        onClose={() => undefined}
        title="매칭 불가"
        description="이미 매칭이 진행 중입니다."
      >
        body
      </Modal>
    );
    expect(screen.getByRole('dialog', { name: '매칭 불가' })).toBeInTheDocument();
    expect(screen.getByText('이미 매칭이 진행 중입니다.')).toBeInTheDocument();
  });

  it('invokes onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="확인">
        body
      </Modal>
    );
    await user.click(screen.getByRole('button', { name: '모달 닫기' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('Escape 키를 누르면 onClose가 호출된다', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="키보드 닫기 확인">
        body
      </Modal>
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('footer prop이 있으면 footer 영역이 렌더된다', () => {
    render(
      <Modal
        open
        onClose={() => undefined}
        title="확인"
        footer={<button type="button">취소</button>}
      >
        body
      </Modal>
    );
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
  });
});
