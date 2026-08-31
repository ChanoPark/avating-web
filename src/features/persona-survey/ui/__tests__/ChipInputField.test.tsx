import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChipInputField } from '../ChipInputField';

const SUGGESTIONS = ['독립서점', '전시', '러닝'] as const;

function Harness({ initial = [] as string[], max = 10 }: { initial?: string[]; max?: number }) {
  const [value, setValue] = useState<string[]>(initial);
  return (
    <ChipInputField
      label="관심사 태그"
      placeholder="입력하고 Enter — 예) 심야 산책"
      value={value}
      onChange={setValue}
      max={max}
      suggestions={SUGGESTIONS}
      suggestionsLabel="추천 태그"
    />
  );
}

describe('ChipInputField', () => {
  it('라벨·입력·추천 칩이 렌더된다', () => {
    render(<Harness />);
    expect(screen.getByLabelText('관심사 태그 입력')).toBeInTheDocument();
    expect(screen.getByText('추천 태그')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '독립서점 추가' })).toBeInTheDocument();
  });

  it('카운터가 "n / max" 로 렌더된다', () => {
    render(<Harness initial={['재즈']} />);
    expect(screen.getByText('1 / 10')).toBeInTheDocument();
  });

  it('입력 후 Enter 로 칩이 추가된다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText('관심사 태그 입력'), '심야 산책{Enter}');

    expect(screen.getByRole('button', { name: '심야 산책 삭제' })).toBeInTheDocument();
  });

  // 한글 IME 조합을 마치는 Enter 는 keydown 에 isComposing=true 로 온다 — 이때 추가하면
  // 조합 중인 마지막 글자가 잘린 값이 들어가고 입력만 지워져 "추가가 안 되는" 증상이 된다.
  it('IME 조합 중 Enter 는 무시한다 (입력 유지, 칩 미추가)', () => {
    render(<Harness />);
    const input = screen.getByLabelText('관심사 태그 입력');

    fireEvent.change(input, { target: { value: '심야 산챇' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });

    expect(screen.queryByRole('button', { name: /삭제$/ })).not.toBeInTheDocument();
    expect(input).toHaveValue('심야 산챇');
  });

  it('"추가" 버튼 클릭 시 현재 입력값이 칩으로 추가되고 입력이 비워진다', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('관심사 태그 입력');

    await user.type(input, '심야 산책');
    await user.click(screen.getByRole('button', { name: '관심사 태그 추가' }));

    expect(screen.getByRole('button', { name: '심야 산책 삭제' })).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('공백만 입력 후 Enter 시 칩이 추가되지 않는다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText('관심사 태그 입력'), '   {Enter}');

    expect(screen.queryByRole('button', { name: /삭제$/ })).not.toBeInTheDocument();
  });

  it('이미 있는 값은 중복 추가되지 않는다', async () => {
    const user = userEvent.setup();
    render(<Harness initial={['재즈']} />);

    await user.type(screen.getByLabelText('관심사 태그 입력'), '재즈{Enter}');

    expect(screen.getAllByRole('button', { name: '재즈 삭제' })).toHaveLength(1);
  });

  // 정본 note 가 "이모지 입력은 받지 않습니다" 라고 사용자에게 약속하므로 입력 단계에서 막는다.
  it('이모지가 섞인 입력은 칩으로 추가되지 않는다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText('관심사 태그 입력'), '재즈🔥{Enter}');

    expect(screen.queryByRole('button', { name: /삭제$/ })).not.toBeInTheDocument();
  });

  // 같은 이유로 "최대 10개" 도 표시만 하지 않고 실제로 막는다.
  it('max 에 도달하면 더 추가되지 않는다', async () => {
    const user = userEvent.setup();
    render(<Harness initial={['하나', '둘']} max={2} />);

    await user.type(screen.getByLabelText('관심사 태그 입력'), '셋{Enter}');

    expect(screen.queryByRole('button', { name: '셋 삭제' })).not.toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  it('"추가" 버튼을 누르면 입력 필드로 포커스가 이동한다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: '관심사 태그 추가' }));

    expect(screen.getByLabelText('관심사 태그 입력')).toHaveFocus();
  });

  it('추천 칩 클릭 시 칩이 추가된다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: '전시 추가' }));

    expect(screen.getByRole('button', { name: '전시 삭제' })).toBeInTheDocument();
  });

  it('이미 선택된 추천 칩은 비활성화된다', () => {
    render(<Harness initial={['러닝']} />);
    expect(screen.getByRole('button', { name: '러닝 추가' })).toBeDisabled();
  });

  it('칩 삭제 버튼 클릭 시 해당 값이 제거된다', async () => {
    const user = userEvent.setup();
    render(<Harness initial={['재즈']} />);

    await user.click(screen.getByRole('button', { name: '재즈 삭제' }));

    expect(screen.queryByRole('button', { name: '재즈 삭제' })).not.toBeInTheDocument();
  });
});
