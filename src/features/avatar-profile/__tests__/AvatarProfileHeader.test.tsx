import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AvatarProfileHeader } from '../ui/AvatarProfileHeader';
import type { AvatarDetail } from '@entities/avatar';

const avatar: AvatarDetail = {
  id: 'avatar-1',
  initials: 'MN',
  name: 'Moonlit Narrator',
  handle: '@moonlit',
  level: 6,
  status: 'online',
  verified: true,
  type: '내향·낭만형',
  description: '심야의 책방을 좋아하는 낭만가.',
  tags: ['독립서점', '심야 카페'],
  stats: {
    empathy: 1,
    proactivity: 1,
    humor: 1,
    sensitivity: 1,
    listening: 1,
    expressiveness: 1,
  },
  publicInfo: { ageRange: '20대 후반', region: '서울 서북부', job: '콘텐츠 기획' },
};

describe('AvatarProfileHeader', () => {
  it('인증 태그 + 핸들·성향 + 설명 + 태그 리스트를 표시하고, 레벨(Lv) 은 노출하지 않는다', () => {
    render(
      <AvatarProfileHeader
        avatar={avatar}
        renderCta={() => <button type="button">매칭 요청</button>}
      />
    );
    expect(screen.getByRole('heading', { name: 'Moonlit Narrator' })).toBeInTheDocument();
    expect(screen.getByText('인증')).toBeInTheDocument();
    // chat7: 레벨(Lv.x) 은 전 화면에서 제거됨
    expect(screen.queryByText(/^Lv\./)).not.toBeInTheDocument();
    expect(screen.getByText('@moonlit · 내향·낭만형')).toBeInTheDocument();
    expect(screen.getByText('심야의 책방을 좋아하는 낭만가.')).toBeInTheDocument();
    expect(screen.getByText('독립서점')).toBeInTheDocument();
    expect(screen.getByText('심야 카페')).toBeInTheDocument();
  });

  it('verified=false 인 경우 "인증" 태그는 노출되지 않는다', () => {
    render(
      <AvatarProfileHeader
        avatar={{ ...avatar, verified: false }}
        renderCta={() => <button type="button">x</button>}
      />
    );
    expect(screen.queryByText('인증')).not.toBeInTheDocument();
  });

  it('renderCta 콜백 결과가 헤더에 렌더된다', () => {
    render(
      <AvatarProfileHeader
        avatar={avatar}
        renderCta={() => <button type="button">매칭 요청</button>}
      />
    );
    expect(screen.getByRole('button', { name: '매칭 요청' })).toBeInTheDocument();
  });

  it('tags 가 빈 배열이면 리스트가 노출되지 않는다', () => {
    render(<AvatarProfileHeader avatar={{ ...avatar, tags: [] }} renderCta={() => null} />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
