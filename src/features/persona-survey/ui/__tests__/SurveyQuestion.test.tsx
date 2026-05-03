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

  it('error prop 없을 때 에러 메시지 노드가 DOM 에 없다', () => {
    const { container } = render(
      <SurveyQuestion
        name="Q_001"
        question="질문"
        options={OPTIONS}
        value={undefined}
        onChange={vi.fn()}
      />
    );
    expect(container.querySelector('p.text-danger')).toBeNull();
    expect(screen.queryByText('필수 항목입니다')).not.toBeInTheDocument();
  });

  it('error prop 전달 시 에러 메시지가 렌더된다', () => {
    render(
      <SurveyQuestion
        name="Q_001"
        question="질문"
        options={OPTIONS}
        value={undefined}
        onChange={vi.fn()}
        error="필수 항목입니다"
      />
    );
    expect(screen.getByText('필수 항목입니다')).toBeInTheDocument();
  });

  it('error prop 전달 시 fieldset 에 border-danger 클래스가 적용된다', () => {
    render(
      <SurveyQuestion
        name="Q_001"
        question="질문"
        options={OPTIONS}
        value={undefined}
        onChange={vi.fn()}
        error="오류"
      />
    );
    const fieldset = screen.getByRole('group');
    expect(fieldset).toHaveClass('border-danger');
  });

  it('error prop 없을 때 fieldset 에 border-border 클래스가 적용된다', () => {
    render(
      <SurveyQuestion
        name="Q_001"
        question="질문"
        options={OPTIONS}
        value={undefined}
        onChange={vi.fn()}
      />
    );
    const fieldset = screen.getByRole('group');
    expect(fieldset).toHaveClass('border-border');
    expect(fieldset).not.toHaveClass('border-danger');
  });
});
