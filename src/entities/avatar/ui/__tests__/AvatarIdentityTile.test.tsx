import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AvatarIdentityTile } from '../AvatarIdentityTile';

describe('AvatarIdentityTile', () => {
  it('이름 첫 글자를 identity 색 위에 올린다', () => {
    render(<AvatarIdentityTile name="루시" color="E887B6" data-testid="tile" />);
    const tile = screen.getByTestId('tile');
    expect(tile).toHaveTextContent('루');
    expect(tile).toHaveClass('bg-id-pink', 'text-id-pink-fg');
  });

  it('장식이라 보조기기에 읽히지 않는다 — 이름은 옆 글자가 알린다', () => {
    render(<AvatarIdentityTile name="루시" data-testid="tile" />);
    expect(screen.getByTestId('tile')).toHaveAttribute('aria-hidden', 'true');
  });

  it('색이 없으면 --id-none 회색이다', () => {
    render(<AvatarIdentityTile name="루시" data-testid="tile" />);
    expect(screen.getByTestId('tile')).toHaveClass('bg-id-none');
  });

  it('크기·모양은 호출하는 자리가 정한다', () => {
    render(<AvatarIdentityTile name="루시" className="h-11 w-11" data-testid="tile" />);
    expect(screen.getByTestId('tile')).toHaveClass('h-11', 'w-11');
  });
});
