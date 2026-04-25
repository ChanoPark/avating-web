import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children as label', () => {
    render(<Button>가입하기</Button>);
    expect(screen.getByRole('button', { name: '가입하기' })).toBeInTheDocument();
  });

  it('invokes onClick when pressed', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>로그인</Button>);
    await user.click(screen.getByRole('button', { name: '로그인' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies the primary variant by default', () => {
    render(<Button>기본</Button>);
    expect(screen.getByRole('button', { name: '기본' }).className).toContain('bg-brand');
  });
});
