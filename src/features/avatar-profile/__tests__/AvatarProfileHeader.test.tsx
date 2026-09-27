import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AvatarProfileHeader } from '../ui/AvatarProfileHeader';
import type { AvatarDetail } from '@entities/avatar';

const avatar: AvatarDetail = {
  avatarId: '11111111-1111-4111-8111-111111111111',
  name: 'Moonlit Narrator',
  hashtag: 'A3K9Z7',
  description: '심야의 책방을 좋아하는 낭만가.',
  color: '67C4F2',
  stats: { EMPATHY: 81 },
  tags: ['독립서점', '심야 카페'],
  canRequestSimulation: true,
};

describe('AvatarProfileHeader', () => {
  it('identity 타일 + 이름 + 해시태그 뱃지 + 설명 + 태그 리스트를 표시하고, 레벨(Lv) 은 노출하지 않는다', () => {
    render(<AvatarProfileHeader avatar={avatar} />);
    expect(screen.getByRole('heading', { name: 'Moonlit Narrator' })).toBeInTheDocument();
    expect(screen.getByText('#A3K9Z7')).toBeInTheDocument();
    expect(screen.getByText('M')).toHaveClass('bg-id-sky');
    expect(screen.queryByText(/^Lv\./)).not.toBeInTheDocument();
    expect(screen.getByText('심야의 책방을 좋아하는 낭만가.')).toBeInTheDocument();
    expect(screen.getByText('독립서점')).toBeInTheDocument();
    expect(screen.getByText('심야 카페')).toBeInTheDocument();
  });

  // 서버 상세 응답에 인증 여부가 없다 — 지어내지 않는다.
  it('서버에 없는 인증 배지는 그리지 않는다', () => {
    render(<AvatarProfileHeader avatar={avatar} />);
    expect(screen.queryByText('인증')).not.toBeInTheDocument();
  });

  it('color 가 없으면 identity 타일은 --id-none 회색이다', () => {
    const { color: _omit, ...withoutColor } = avatar;
    render(<AvatarProfileHeader avatar={withoutColor} />);
    expect(screen.getByText('M')).toHaveClass('bg-id-none');
  });

  it('헤더에는 CTA 버튼이 없다', () => {
    render(<AvatarProfileHeader avatar={avatar} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('description 이 빈 문자열이면 설명 줄을 그리지 않는다', () => {
    render(<AvatarProfileHeader avatar={{ ...avatar, description: '' }} />);
    expect(screen.queryByText('심야의 책방을 좋아하는 낭만가.')).not.toBeInTheDocument();
  });

  it('tags 가 빈 배열이면 리스트가 노출되지 않는다', () => {
    render(<AvatarProfileHeader avatar={{ ...avatar, tags: [] }} />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
