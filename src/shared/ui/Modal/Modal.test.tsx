import { useState } from 'react';
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

  describe('키보드 포커스 (a11y § 5.1)', () => {
    it('Tab 포커스가 다이얼로그 내부에서 순환한다 (마지막→처음, 처음→마지막)', async () => {
      const user = userEvent.setup();
      render(
        <Modal
          open
          onClose={() => undefined}
          title="포커스 트랩"
          footer={
            <>
              <button type="button">취소</button>
              <button type="button">확인</button>
            </>
          }
        >
          body
        </Modal>
      );
      const cancel = screen.getByRole('button', { name: '취소' });
      const confirm = screen.getByRole('button', { name: '확인' });

      confirm.focus();
      await user.tab(); // 마지막 → 처음 순환
      expect(cancel).toHaveFocus();

      await user.tab({ shift: true }); // 처음 → 마지막 역방향
      expect(confirm).toHaveFocus();
    });

    it('배경 오버레이 버튼은 탭 순서에서 제외된다 (tabIndex=-1)', () => {
      render(
        <Modal open onClose={() => undefined} title="탭 제외">
          body
        </Modal>
      );
      expect(screen.getByRole('button', { name: '모달 닫기' })).toHaveAttribute('tabindex', '-1');
    });

    it('닫히면 포커스가 열기 직전 트리거 요소로 복귀한다', async () => {
      const user = userEvent.setup();
      function Harness() {
        const [open, setOpen] = useState(false);
        return (
          <>
            <button type="button" onClick={() => setOpen(true)}>
              열기
            </button>
            <Modal open={open} onClose={() => setOpen(false)} title="복귀 확인">
              body
            </Modal>
          </>
        );
      }
      render(<Harness />);
      const trigger = screen.getByRole('button', { name: '열기' });
      trigger.focus();
      await user.click(trigger);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  describe('시맨틱 톤 (Modal Toast System 정본)', () => {
    // 비-neutral 톤은 상단 2px 액센트 레일 + 헤더 글리프 배지를 렌더한다.
    it.each([
      ['info', 'border-t-brand'],
      ['success', 'border-t-success'],
      ['warning', 'border-t-warning'],
      ['danger', 'border-t-danger'],
    ] as const)('tone="%s" 이면 상단 레일(%s)과 톤 아이콘 배지를 렌더한다', (tone, railClass) => {
      render(
        <Modal open onClose={() => undefined} title="확인" tone={tone}>
          body
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('border-t-2', railClass);
      // 배지(aria-hidden span) 안에 톤 아이콘(svg)이 렌더된다.
      const badge = dialog.querySelector('span[aria-hidden="true"]');
      expect(badge).not.toBeNull();
      expect(badge?.querySelector('svg')).not.toBeNull();
    });

    it('tone 기본값(neutral)은 액센트 레일/배지를 렌더하지 않는다', () => {
      render(
        <Modal open onClose={() => undefined} title="단순 확인">
          body
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).not.toHaveClass('border-t-2');
      expect(dialog.querySelector('span[aria-hidden="true"]')).toBeNull();
    });
  });
});
