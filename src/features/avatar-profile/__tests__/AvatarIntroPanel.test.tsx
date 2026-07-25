import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AvatarIntroPanel } from '../ui/AvatarIntroPanel';

const publicInfo = {
  ageRange: '20대 후반',
  region: '서울 서북부',
  job: '콘텐츠 기획',
};

describe('AvatarIntroPanel', () => {
  it('"공개 정보" 헤딩과 나이대/지역/직군 행을 표시한다', () => {
    render(<AvatarIntroPanel publicInfo={publicInfo} />);
    expect(screen.getByRole('heading', { name: '공개 정보' })).toBeInTheDocument();
    expect(screen.getByText('나이대')).toBeInTheDocument();
    expect(screen.getByText('20대 후반')).toBeInTheDocument();
    expect(screen.getByText('지역')).toBeInTheDocument();
    expect(screen.getByText('서울 서북부')).toBeInTheDocument();
    expect(screen.getByText('직군')).toBeInTheDocument();
    expect(screen.getByText('콘텐츠 기획')).toBeInTheDocument();
  });

  it('호감도·턴 등 세션 이력성 정보는 노출하지 않는다 (프라이버시)', () => {
    render(<AvatarIntroPanel publicInfo={publicInfo} />);
    expect(screen.queryByText(/호감도/)).not.toBeInTheDocument();
    expect(screen.queryByText(/TURN/i)).not.toBeInTheDocument();
  });
});
