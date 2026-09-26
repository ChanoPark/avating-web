import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SurveyQuestion } from '../SurveyQuestion';

const OPTIONS = [
  { answerId: 'ANS_1', text: '첫 번째 선택지' },
  { answerId: 'ANS_2', text: '두 번째 선택지' },
  { answerId: 'ANS_3', text: '세 번째 선택지' },
];

describe('SurveyQuestion', () => {
  it('질문 텍스트가 legend 로 렌더된다', () => {
    render(
      <SurveyQuestion
        name="Q_001"
        question="질문 제목입니다"
        options={OPTIONS}
        value={undefined}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByRole('group', { name: /질문 제목입니다/ })).toBeInTheDocument();
  });

  it('옵션 개수만큼 라디오 버튼이 렌더된다', () => {
    render(
      <SurveyQuestion
        name="Q_001"
        question="질문"
        options={OPTIONS}
        value={undefined}
        onChange={vi.fn()}
      />
    );
    expect(screen.getAllByRole('radio')).toHaveLength(OPTIONS.length);
  });

  it('value 와 일치하는 라디오가 checked 된다', () => {
    render(
      <SurveyQuestion
        name="Q_001"
        question="질문"
        options={OPTIONS}
        value="ANS_2"
        onChange={vi.fn()}
      />
    );
    const radio = screen.getByRole('radio', { name: /두 번째 선택지/ }) as HTMLInputElement;
    expect(radio.checked).toBe(true);
  });

  it('라디오 클릭 시 onChange 가 answerId 로 호출된다', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SurveyQuestion
        name="Q_001"
        question="질문"
        options={OPTIONS}
        value={undefined}
        onChange={onChange}
      />
    );
    await user.click(screen.getByRole('radio', { name: /첫 번째 선택지/ }));
    expect(onChange).toHaveBeenCalledWith('ANS_1');
  });

  // 사용자 지시(2026-09-19): 고른 답은 회색이 아니라 포인트 색으로 채운다. 글자가 올라가는 면이라
  // 텍스트용 채움 --action-bg 를 쓴다 — --action-mark 는 글자 없는 면 전용, --action-tint 는 선택 배경 금지.
  it('선택된 선택지는 포인트 색(--action-bg)으로 채우고 글자는 on-action 이다', () => {
    render(
      <SurveyQuestion
        name="Q_001"
        question="질문"
        options={OPTIONS}
        value="ANS_2"
        onChange={vi.fn()}
      />
    );
    const selectedCard = screen.getByRole('radio', { name: /두 번째 선택지/ }).closest('label');
    const plainCard = screen.getByRole('radio', { name: /첫 번째 선택지/ }).closest('label');

    expect(selectedCard).toHaveClass('bg-action');
    expect(selectedCard).toHaveClass('text-on-action');
    expect(selectedCard).not.toHaveClass('bg-selected');
    expect(selectedCard).not.toHaveClass('bg-action-tint');
    expect(plainCard).toHaveClass('bg-surface');
    expect(plainCard).not.toHaveClass('bg-action');
  });

  it('`.onb-opt` 규격 — 선택지 행은 최소 52px · 좌우 16px · card radius 이고 본문 15px 이다', () => {
    render(
      <SurveyQuestion
        name="Q_001"
        question="질문"
        options={OPTIONS}
        value={undefined}
        onChange={vi.fn()}
      />
    );

    for (const radio of screen.getAllByRole('radio')) {
      const card = radio.closest('label');
      expect(card).toHaveClass('min-h-13');
      expect(card).toHaveClass('px-4');
      expect(card).toHaveClass('rounded-card');
      expect(card).toHaveClass('text-body');
    }
  });
});
