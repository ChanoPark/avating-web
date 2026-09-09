import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('connects label to input via htmlFor/id', () => {
    render(<Input label="이메일" placeholder="you@example.com" />);
    const input = screen.getByLabelText('이메일');
    expect(input).toHaveAttribute('placeholder', 'you@example.com');
  });

  it('renders error message and aria-invalid', () => {
    render(<Input label="이메일" errorMessage="형식이 올바르지 않습니다." />);
    const input = screen.getByLabelText('이메일');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/형식이 올바르지 않습니다/)).toBeInTheDocument();
  });

  it('에러는 1px 안쪽 선이다 — 링을 두 겹으로 얹지 않는다', () => {
    render(<Input label="이메일" errorMessage="형식이 올바르지 않습니다." />);
    const cls = screen.getByLabelText('이메일').className;
    expect(cls).toContain('shadow-[inset_0_0_0_1px_var(--danger-text)]');
    expect(cls).not.toContain('focus:shadow-');
  });

  describe('`.cx-input` 규격', () => {
    it('필드는 상자가 아니라 톤이다 — 회색 채움에 테두리가 없다', () => {
      render(<Input label="이메일" />);
      const cls = screen.getByLabelText('이메일').className;
      expect(cls).toContain('bg-surface');
      expect(cls).toContain('border-0');
      expect(cls).not.toContain('bg-canvas');
    });

    it('15px 타입 · 12px 좌우 패딩 · radius 6 · 높이 36 을 갖는다', () => {
      render(<Input label="이메일" />);
      const cls = screen.getByLabelText('이메일').className;
      expect(cls).toContain('text-body');
      expect(cls).toContain('px-3');
      expect(cls).toContain('rounded-chip');
      expect(cls).toContain('h-9');
    });

    it('포커스 링은 필드 가장자리에 붙는다 (offset 0) — 전역 링을 죽이지 않는다', () => {
      render(<Input label="이메일" />);
      const cls = screen.getByLabelText('이메일').className;
      expect(cls).toContain('focus-visible:outline-offset-0');
      expect(cls).not.toContain('outline-none');
    });

    it('disabled 는 별도 필드 채움 + disabled 텍스트다', () => {
      render(<Input label="이메일" disabled />);
      const cls = screen.getByLabelText('이메일').className;
      expect(cls).toContain('disabled:bg-field-disabled');
      expect(cls).toContain('disabled:text-disabled');
      expect(cls).toContain('disabled:cursor-not-allowed');
    });
  });

  describe('`.cx-field` 규격', () => {
    it('help·error 는 13px 이다 (12px meta 가 아니다)', () => {
      const { rerender } = render(<Input label="비밀번호" helperText="8자 이상" />);
      const help = screen.getByText('8자 이상');
      expect(help.className).toContain('text-caption');
      expect(help.className).not.toContain('text-meta');

      rerender(<Input label="비밀번호" errorMessage="너무 짧습니다." />);
      const error = screen.getByText(/너무 짧습니다/);
      expect(error.className).toContain('text-caption');
      expect(error.className).toContain('text-danger');
    });

    it('라벨은 13px / 500 / secondary 다', () => {
      const { container } = render(<Input label="이메일" />);
      const label = container.querySelector('label');
      expect(label?.className).toContain('text-caption');
      expect(label?.className).toContain('font-medium');
      expect(label?.className).toContain('text-secondary');
    });

    it('필드 래퍼는 gap 4 로 묶인다', () => {
      const { container } = render(<Input label="이메일" />);
      expect((container.firstChild as HTMLElement).className).toContain('gap-1');
    });
  });

  it('에러 메시지는 문자 글리프가 아니라 라인 아이콘(svg)을 앞에 둔다', () => {
    render(<Input label="이메일" errorMessage="형식이 올바르지 않습니다." />);
    const message = screen.getByText(/형식이 올바르지 않습니다/);
    expect(message.querySelector('svg')).not.toBeNull();
    expect(message.textContent).not.toContain('✕');
  });

  // text-muted(3.94:1)는 장식 전용이라 AA 미만이다 — placeholder 에 쓰지 않는다.
  it('placeholder 는 text-secondary 이상 대비를 쓴다', () => {
    render(<Input label="이메일" placeholder="you@example.com" />);
    const cls = screen.getByLabelText('이메일').className;
    expect(cls).toContain('placeholder:text-secondary');
    expect(cls).not.toContain('placeholder:text-muted');
  });

  it('renders helperText when no error', () => {
    render(<Input label="비밀번호" helperText="8자 이상" />);
    expect(screen.getByText('8자 이상')).toBeInTheDocument();
  });

  it('hides helper when error is present (error wins)', () => {
    render(
      <Input label="비밀번호" helperText="8자 이상" errorMessage="비밀번호가 너무 짧습니다." />
    );
    expect(screen.queryByText('8자 이상')).not.toBeInTheDocument();
    expect(screen.getByText(/비밀번호가 너무 짧습니다/)).toBeInTheDocument();
  });

  it('forwards user input', async () => {
    const user = userEvent.setup();
    render(<Input label="닉네임" />);
    const input = screen.getByLabelText('닉네임');
    await user.type(input, 'avating');
    expect(input).toHaveValue('avating');
  });

  it('trailingSlot이 있으면 슬롯 콘텐츠가 렌더된다', () => {
    render(<Input label="비밀번호" trailingSlot={<span>show</span>} />);
    expect(screen.getByText('show')).toBeInTheDocument();
  });
});
