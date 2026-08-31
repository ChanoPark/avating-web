import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpressionsField } from '../ExpressionsField';

function Harness({
  initialTags = [] as string[],
  initialExpressions = [] as string[],
}: {
  initialTags?: string[];
  initialExpressions?: string[];
}) {
  const [interestTags, setInterestTags] = useState<string[]>(initialTags);
  const [expressions, setExpressions] = useState<string[]>(initialExpressions);
  return (
    <ExpressionsField
      interestTags={interestTags}
      onInterestTagsChange={setInterestTags}
      expressions={expressions}
      onExpressionsChange={setExpressions}
    />
  );
}

describe('ExpressionsField (관심사 태그 + 자주 쓰는 표현)', () => {
  it('관심사 태그와 자주 쓰는 표현 두 입력이 함께 렌더된다', () => {
    render(<Harness />);
    expect(screen.getByLabelText('관심사 태그 입력')).toBeInTheDocument();
    expect(screen.getByLabelText('자주 쓰는 표현 입력')).toBeInTheDocument();
  });

  it('정본의 추천 태그 6종이 렌더된다', () => {
    render(<Harness />);
    for (const tag of ['독립서점', '전시', '러닝', '필름 사진', '베이킹', '천문']) {
      expect(screen.getByRole('button', { name: `${tag} 추가` })).toBeInTheDocument();
    }
  });

  it('정본의 자주 쓰이는 표현 4종이 렌더된다', () => {
    render(<Harness />);
    for (const expr of ['진짜요?', '오 신기하네', '아 그래서요', '음…']) {
      expect(screen.getByRole('button', { name: `${expr} 추가` })).toBeInTheDocument();
    }
  });

  it('이모지 추천 행은 렌더되지 않는다', () => {
    render(<Harness />);
    expect(screen.queryByText('자주 쓰는 이모지')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '😄 추가' })).not.toBeInTheDocument();
  });

  it('안내 문구는 최대 개수만 안내한다 (이모지 문구 제거 — 2026-08-30 사용자 결정)', () => {
    render(<Harness />);
    expect(screen.getByText('관심사 태그와 표현 모두 최대 10개')).toBeInTheDocument();
    expect(screen.queryByText(/이모지 입력은 받지 않습니다/)).not.toBeInTheDocument();
  });

  it('두 입력 모두 placeholder 가 "입력하고 엔터를 눌러주세요." 다', () => {
    render(<Harness />);
    expect(screen.getAllByPlaceholderText('입력하고 엔터를 눌러주세요.')).toHaveLength(2);
  });

  it('두 입력의 칩은 서로 섞이지 않는다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText('관심사 태그 입력'), '심야 산책{Enter}');
    await user.type(screen.getByLabelText('자주 쓰는 표현 입력'), '그치 그치{Enter}');

    // 추천 태그에 없는 값이라 '삭제' 버튼은 각각 하나씩만 존재해야 한다.
    expect(screen.getAllByRole('button', { name: '심야 산책 삭제' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: '그치 그치 삭제' })).toHaveLength(1);
  });

  it('각 입력의 카운터가 독립적으로 표시된다', () => {
    render(<Harness initialTags={['재즈']} initialExpressions={['그치 그치', '~인 듯']} />);
    expect(screen.getByText('1 / 10')).toBeInTheDocument();
    expect(screen.getByText('2 / 10')).toBeInTheDocument();
  });
});
