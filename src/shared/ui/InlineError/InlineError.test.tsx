import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InlineError } from './InlineError';

describe('InlineError', () => {
  it('기본 제목·본문을 그리고 버튼은 두지 않는다', () => {
    render(<InlineError />);
    expect(screen.getByText('불러오지 못했어요')).toBeInTheDocument();
    expect(screen.getByText('잠시 후 다시 시도해 주세요')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('body 를 주면 기본 본문 대신 쓴다', () => {
    render(<InlineError body="주소가 잘못됐거나 삭제된 아바타일 수 있어요." />);
    expect(screen.getByText('주소가 잘못됐거나 삭제된 아바타일 수 있어요.')).toBeInTheDocument();
    expect(screen.queryByText('잠시 후 다시 시도해 주세요')).not.toBeInTheDocument();
  });

  it('role="alert" 로 실패를 알린다', () => {
    render(<InlineError />);
    expect(screen.getByRole('alert')).toHaveTextContent('불러오지 못했어요');
  });

  // 정본 InlineFail 의 h 기본값 118 / 표 안에서는 130 — 스켈레톤과 같은 높이를 차지해
  // 로드 실패가 레이아웃을 무너뜨리지 않게(CLS) 한다.
  it('panel 은 최소 높이 118px, table 은 130px 을 확보한다', () => {
    const { rerender } = render(<InlineError />);
    expect(screen.getByRole('alert').className).toContain('min-h-[118px]');

    rerender(<InlineError kind="table" />);
    expect(screen.getByRole('alert').className).toContain('min-h-[130px]');
  });

  it('title 을 덮어쓸 수 있다', () => {
    render(<InlineError title="아바타를 찾을 수 없어요" />);
    expect(screen.getByText('아바타를 찾을 수 없어요')).toBeInTheDocument();
  });
});
