import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Tag } from '../Tag';

describe('Tag', () => {
  it('children을 렌더한다', () => {
    render(<Tag>BETA</Tag>);
    expect(screen.getByText('BETA')).toBeInTheDocument();
  });

  it('variant="brand" prop을 수용한다', () => {
    render(<Tag variant="brand">브랜드</Tag>);
    expect(screen.getByText('브랜드')).toBeInTheDocument();
  });

  it('variant="success" prop을 수용한다', () => {
    render(<Tag variant="success">성공</Tag>);
    expect(screen.getByText('성공')).toBeInTheDocument();
  });

  it('variant="warning" prop을 수용한다', () => {
    render(<Tag variant="warning">경고</Tag>);
    expect(screen.getByText('경고')).toBeInTheDocument();
  });

  it('variant="danger" prop을 수용한다', () => {
    render(<Tag variant="danger">위험</Tag>);
    expect(screen.getByText('위험')).toBeInTheDocument();
  });
});
