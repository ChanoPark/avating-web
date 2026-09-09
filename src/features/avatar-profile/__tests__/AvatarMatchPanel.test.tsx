import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AvatarMatchPanel } from '../ui/AvatarMatchPanel';

describe('AvatarMatchPanel', () => {
  it('채워진 파란 CTA 는 "매칭 요청 보내기" 하나뿐이다', () => {
    render(<AvatarMatchPanel onRequest={vi.fn()} requestOpen={false} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAccessibleName(/매칭 요청 보내기/);
    expect(buttons[0]).toHaveClass('bg-action');
  });

  it('강조는 파란 테두리가 아니라 안에 놓인 Brand 버튼이 만든다', () => {
    render(<AvatarMatchPanel onRequest={vi.fn()} requestOpen={false} />);
    const panel = screen.getByRole('region', { name: '매칭 요청' });
    expect(panel).toHaveClass('bg-canvas');
    expect(panel.className).not.toContain('border-mark');
  });

  it('CTA 클릭 시 onRequest 가 호출된다', async () => {
    const onRequest = vi.fn();
    const user = userEvent.setup();
    render(<AvatarMatchPanel onRequest={onRequest} requestOpen={false} />);
    await user.click(screen.getByRole('button', { name: /매칭 요청 보내기/ }));
    expect(onRequest).toHaveBeenCalledOnce();
  });

  it('disabled=true 면 CTA 가 비활성화되고 사유가 title 로 노출된다', () => {
    render(
      <AvatarMatchPanel
        onRequest={vi.fn()}
        requestOpen={false}
        disabled
        disabledReason="이미 매칭 중인 아바타입니다"
      />
    );
    const cta = screen.getByRole('button', { name: /매칭 요청 보내기/ });
    expect(cta).toBeDisabled();
    expect(cta).toHaveAttribute('title', '이미 매칭 중인 아바타입니다');
  });
});
