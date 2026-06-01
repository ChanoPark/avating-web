import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpressionsField } from '../ExpressionsField';

function Harness({ initial = [] as string[] }: { initial?: string[] }) {
  const [value, setValue] = useState<string[]>(initial);
  return <ExpressionsField value={value} onChange={setValue} />;
}

describe('ExpressionsField (자주 쓰는 표현 chip 입력)', () => {
  it('입력 필드와 추천 표현·이모지 칩이 렌더된다', () => {
    render(<Harness />);
    expect(screen.getByLabelText('자주 쓰는 표현 입력')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ㅎㅎㅎ 추가' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '😄 추가' })).toBeInTheDocument();
  });

  it('입력 후 Enter 로 칩이 추가된다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText('자주 쓰는 표현 입력'), 'ㅋㅋ{Enter}');

    expect(screen.getByRole('button', { name: 'ㅋㅋ 삭제' })).toBeInTheDocument();
  });

  it('공백만 입력 후 Enter 시 칩이 추가되지 않는다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText('자주 쓰는 표현 입력'), '   {Enter}');

    expect(screen.queryByRole('button', { name: /삭제$/ })).not.toBeInTheDocument();
  });

  it('이미 있는 표현은 중복 추가되지 않는다', async () => {
    const user = userEvent.setup();
    render(<Harness initial={['ㅋㅋ']} />);

    await user.type(screen.getByLabelText('자주 쓰는 표현 입력'), 'ㅋㅋ{Enter}');

    expect(screen.getAllByRole('button', { name: 'ㅋㅋ 삭제' })).toHaveLength(1);
  });

  it('추천 표현 칩 클릭 시 칩이 추가된다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'ㅎㅎㅎ 추가' }));

    expect(screen.getByRole('button', { name: 'ㅎㅎㅎ 삭제' })).toBeInTheDocument();
  });

  it('추천 이모지 클릭 시 칩이 추가된다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: '🥲 추가' }));

    expect(screen.getByRole('button', { name: '🥲 삭제' })).toBeInTheDocument();
  });

  it('칩 삭제 버튼 클릭 시 해당 표현이 제거된다', async () => {
    const user = userEvent.setup();
    render(<Harness initial={['그치 그치']} />);

    await user.click(screen.getByRole('button', { name: '그치 그치 삭제' }));

    expect(screen.queryByRole('button', { name: '그치 그치 삭제' })).not.toBeInTheDocument();
  });
});
