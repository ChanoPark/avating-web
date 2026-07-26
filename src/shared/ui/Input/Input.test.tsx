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

  it('에러 시 입력에 위험색 테두리가 적용된다', () => {
    render(<Input label="이메일" errorMessage="형식이 올바르지 않습니다." />);
    expect(screen.getByLabelText('이메일').className).toContain('border-danger');
  });

  // forms.css `.av-field--invalid .av-input:focus{box-shadow:0 0 0 3px var(--danger-wash)}`
  it('에러 상태 focus 링은 danger-wash 를 쓴다', () => {
    render(<Input label="이메일" errorMessage="형식이 올바르지 않습니다." />);
    expect(screen.getByLabelText('이메일').className).toContain(
      'focus:shadow-[0_0_0_3px_var(--danger-wash)]'
    );
  });

  describe('`.av-input` 규격 (forms.css)', () => {
    // `background: var(--surface)` — 입력칸은 흰색이다. 회색은 disabled 신호로만 쓴다.
    it('기본 배경은 흰 서피스이고, 회색 채움은 disabled 에만 쓴다', () => {
      render(<Input label="이메일" />);
      const cls = screen.getByLabelText('이메일').className;
      expect(cls).toContain('bg-surface');
      expect(cls).not.toContain('bg-canvas ');
      expect(cls).toContain('disabled:bg-canvas-soft');
      expect(cls).not.toContain('disabled:bg-surface');
    });

    // `font-size:15px; padding:9px 12px; border-radius:var(--r-sm); min-height:40px`
    it('15px 타입 · 9px 12px 패딩 · radius 6 · min-height 40 을 갖는다', () => {
      render(<Input label="이메일" />);
      const cls = screen.getByLabelText('이메일').className;
      expect(cls).toContain('text-body');
      expect(cls).toContain('px-3');
      expect(cls).toContain('py-2.25');
      expect(cls).toContain('rounded-sm');
      expect(cls).toContain('min-h-10');
    });

    // `:focus{border-color:var(--primary);box-shadow:var(--focus-ring)}`
    it('focus 시 파란 테두리와 포커스 링을 함께 쓴다', () => {
      render(<Input label="이메일" />);
      const cls = screen.getByLabelText('이메일').className;
      expect(cls).toContain('focus:border-primary');
      expect(cls).toContain('focus:shadow-focus');
    });

    // `:disabled{background:var(--canvas-soft);color:var(--ink-mute)}`
    it('disabled 는 canvas-soft 채움 + ink-mute 텍스트다', () => {
      render(<Input label="이메일" disabled />);
      const cls = screen.getByLabelText('이메일').className;
      expect(cls).toContain('disabled:bg-canvas-soft');
      expect(cls).toContain('disabled:text-ink-mute');
      expect(cls).toContain('disabled:cursor-not-allowed');
    });
  });

  describe('`.av-field` 규격 (forms.css)', () => {
    it('help·error 는 13px 이다 (11px micro 가 아니다)', () => {
      const { rerender } = render(<Input label="비밀번호" helperText="8자 이상" />);
      const help = screen.getByText('8자 이상');
      expect(help.className).toContain('text-caption');
      expect(help.className).not.toContain('text-micro');

      rerender(<Input label="비밀번호" errorMessage="너무 짧습니다." />);
      const error = screen.getByText(/너무 짧습니다/);
      expect(error.className).toContain('text-caption');
      expect(error.className).toContain('text-danger');
    });

    it('라벨은 13px / 500 / ink-secondary 다', () => {
      const { container } = render(<Input label="이메일" />);
      const label = container.querySelector('label');
      expect(label?.className).toContain('text-caption');
      expect(label?.className).toContain('font-medium');
      expect(label?.className).toContain('text-ink-secondary');
    });

    it('필드 래퍼는 gap 6 으로 묶인다', () => {
      const { container } = render(<Input label="이메일" />);
      expect((container.firstChild as HTMLElement).className).toContain('gap-1.5');
    });
  });

  // 문자 글리프(✕)는 Pretendard 에 없어 시스템 폰트로 폴백한다 — 라인 아이콘만 쓴다.
  it('에러 메시지는 문자 글리프가 아니라 라인 아이콘(svg)을 앞에 둔다', () => {
    render(<Input label="이메일" errorMessage="형식이 올바르지 않습니다." />);
    const message = screen.getByText(/형식이 올바르지 않습니다/);
    expect(message.querySelector('svg')).not.toBeNull();
    expect(message.textContent).not.toContain('✕');
  });

  // placeholder 에 `--ink-faint` 를 쓰지 않는다 (colors.css — 장식 전용).
  it('placeholder 는 ink-mute 이상 대비를 쓴다', () => {
    render(<Input label="이메일" placeholder="you@example.com" />);
    const cls = screen.getByLabelText('이메일').className;
    expect(cls).toContain('placeholder:text-ink-mute');
    expect(cls).not.toContain('placeholder:text-ink-faint');
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
