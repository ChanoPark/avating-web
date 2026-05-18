import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Meter } from './Meter';

describe('Meter', () => {
  it('role=meter 와 0–100 범위 aria 속성을 노출한다', () => {
    render(<Meter value={64} label="공감 지수" />);
    const meter = screen.getByRole('meter', { name: '공감 지수' });
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
    expect(meter).toHaveAttribute('aria-valuenow', '64');
  });

  it('범위를 벗어난 값은 clamp 된다', () => {
    const { rerender } = render(<Meter value={-10} label="x" />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '0');

    rerender(<Meter value={150} label="x" />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '100');
  });

  it('소수값은 반올림되어 aria-valuenow 로 노출된다', () => {
    render(<Meter value={72.6} label="x" />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '73');
  });
});
