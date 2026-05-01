import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusDot } from '../StatusDot';

describe('StatusDot', () => {
  describe('online', () => {
    it('aria-label="온라인" 이다', () => {
      render(<StatusDot status="online" />);
      expect(screen.getByLabelText('온라인')).toBeInTheDocument();
    });

    it('초록(success) 색상 클래스가 적용된다', () => {
      render(<StatusDot status="online" />);
      const dot = screen.getByLabelText('온라인');
      expect(dot.className).toContain('bg-success');
    });
  });

  describe('busy', () => {
    it('aria-label="소개팅 중" 이다', () => {
      render(<StatusDot status="busy" />);
      expect(screen.getByLabelText('소개팅 중')).toBeInTheDocument();
    });

    it('주황(warning) 색상 클래스가 적용된다', () => {
      render(<StatusDot status="busy" />);
      const dot = screen.getByLabelText('소개팅 중');
      expect(dot.className).toContain('bg-warning');
    });
  });

  describe('offline', () => {
    it('aria-label="오프라인" 이다', () => {
      render(<StatusDot status="offline" />);
      expect(screen.getByLabelText('오프라인')).toBeInTheDocument();
    });

    it('회색(text-3) 색상 클래스가 적용된다', () => {
      render(<StatusDot status="offline" />);
      const dot = screen.getByLabelText('오프라인');
      const hasGrayClass =
        dot.className.includes('bg-text-3') ||
        dot.className.includes('bg-gray') ||
        dot.className.includes('text-3');
      expect(hasGrayClass).toBe(true);
    });
  });

  it('색상 + aria-label 이중 표기 (시각 + 보조기술)', () => {
    render(<StatusDot status="online" />);
    const dot = screen.getByLabelText('온라인');
    expect(dot).toBeInTheDocument();
    expect(dot.className).toContain('bg-success');
  });
});
