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
});
