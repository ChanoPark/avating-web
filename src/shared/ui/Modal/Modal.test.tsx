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
      // Sheet 의 첫 포커스 가능 요소는 헤더 행의 닫기 아이콘이다.
      const close = screen.getByRole('button', { name: '닫기' });
      const confirm = screen.getByRole('button', { name: '확인' });

      confirm.focus();
      await user.tab();
      expect(close).toHaveFocus();

      await user.tab({ shift: true });
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
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      // 열릴 때 포커스가 다이얼로그로 이동하는지도 함께 확인한다(§5.1 item 1) — 복귀 단언만으로는
      // 이 회귀를 못 잡는다.
      expect(dialog).toHaveFocus();

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  describe('시맨틱 톤 (components.css `.av-badge--*`)', () => {
    // v2 Sheet 는 상단 레일이 아니라 헤더 배지 행으로 톤을 표시한다.
    it.each([
      ['info', 'bg-primary-wash'],
      ['success', 'bg-success-wash'],
      ['warning', 'bg-warning-wash'],
      ['danger', 'bg-danger-wash'],
    ] as const)('tone="%s" 이면 헤더에 %s 톤 배지를 렌더한다', (tone, washClass) => {
      render(
        <Modal open onClose={() => undefined} title="확인" tone={tone}>
          body
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      const badge = dialog.querySelector('span[aria-hidden="true"]');
      expect(badge).not.toBeNull();
      expect(badge?.className).toContain(washClass);
      expect(badge?.className).toContain('border-transparent');
      expect(badge?.querySelector('svg')).not.toBeNull();
    });

    it('tone 기본값(neutral)은 톤 배지를 렌더하지 않는다', () => {
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

  describe('Sheet 규격 (LAYOUT-NUMBERS § Sheet)', () => {
    it('폭 560 · radius 16 · hairline · shadow-float 를 갖는다', () => {
      render(
        <Modal open onClose={() => undefined} title="규격">
          body
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toContain('max-w-140');
      expect(dialog.className).toContain('rounded-xl');
      expect(dialog.className).toContain('border-hairline');
      expect(dialog.className).toContain('shadow-float');
    });

    it('헤더 행의 닫기 아이콘을 누르면 onClose 가 호출된다', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <Modal open onClose={onClose} title="닫기 아이콘">
          body
        </Modal>
      );
      await user.click(screen.getByRole('button', { name: '닫기' }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('액션 바는 상단 hairline 으로 본문과 분리된다', () => {
      render(
        <Modal
          open
          onClose={() => undefined}
          title="액션 바"
          footer={<button type="button">확인</button>}
        >
          body
        </Modal>
      );
      const bar = screen.getByRole('button', { name: '확인' }).parentElement;
      expect(bar?.className).toContain('border-t');
      expect(bar?.className).toContain('border-hairline');
    });

    it('footnote 는 가운데 정렬 각주로 렌더된다', () => {
      render(
        <Modal
          open
          onClose={() => undefined}
          title="각주"
          footer={<button type="button">확인</button>}
          footnote="수락 시 매칭이 시작됩니다."
        >
          body
        </Modal>
      );
      const note = screen.getByText('수락 시 매칭이 시작됩니다.');
      expect(note.className).toContain('text-micro');
      expect(note.className).toContain('text-center');
    });
  });
});
