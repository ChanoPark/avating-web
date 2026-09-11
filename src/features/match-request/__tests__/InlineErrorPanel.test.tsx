import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InlineErrorPanel } from '../ui/InlineErrorPanel';

describe('InlineErrorPanel', () => {
  it('네트워크 오류는 흰 서피스 + danger 테두리 패널로 노출된다', () => {
    render(<InlineErrorPanel id="err" />);
    const panel = screen.getByRole('alert');
    expect(panel).toHaveClass('bg-canvas');
    expect(panel).toHaveClass('border-danger-mark');
  });

  it('같은 내용으로 다시 시도할 수 있는 버튼을 제공한다', () => {
    render(<InlineErrorPanel id="err" />);
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeEnabled();
  });

  it('retryDisabled 면 다시 시도 버튼이 비활성화된다', () => {
    render(<InlineErrorPanel id="err" retryDisabled />);
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeDisabled();
  });
});
