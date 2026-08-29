import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InlineError } from './InlineError';

// S-11-06 InlineFail — "화면 전체를 에러로 덮지 않고, 실패한 영역만 교체합니다 · 재시도는 실패한 자리에"
describe('InlineError', () => {
  it('기본 제목·본문·재시도 버튼을 그린다', () => {
    render(<InlineError onRetry={vi.fn()} />);
    expect(screen.getByText('불러오지 못했어요')).toBeInTheDocument();
    expect(screen.getByText('잠시 후 다시 시도해 주세요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
  });

  it('body 를 주면 기본 본문 대신 쓴다', () => {
    render(<InlineError body="아바타 추천을 불러오지 못했어요" onRetry={vi.fn()} />);
    expect(screen.getByText('아바타 추천을 불러오지 못했어요')).toBeInTheDocument();
    expect(screen.queryByText('잠시 후 다시 시도해 주세요')).not.toBeInTheDocument();
  });

  it('재시도 버튼 클릭 시 onRetry 를 호출한다', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<InlineError onRetry={onRetry} />);
    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('onRetry 가 없으면 재시도 버튼을 그리지 않는다', () => {
    render(<InlineError />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('role="alert" 로 실패를 알린다', () => {
    render(<InlineError onRetry={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('불러오지 못했어요');
  });

  // 정본 InlineFail 의 h 기본값 118 / 표 안에서는 130 — 스켈레톤과 같은 높이를 차지해
  // 로드 실패가 레이아웃을 무너뜨리지 않게(CLS) 한다.
  it('panel 은 최소 높이 118px, table 은 130px 을 확보한다', () => {
    const { rerender } = render(<InlineError onRetry={vi.fn()} />);
    expect(screen.getByRole('alert').className).toContain('min-h-[118px]');

    rerender(<InlineError kind="table" onRetry={vi.fn()} />);
    expect(screen.getByRole('alert').className).toContain('min-h-[130px]');
  });

  it('title 을 덮어쓸 수 있다', () => {
    render(<InlineError title="연결이 끊겼어요" onRetry={vi.fn()} />);
    expect(screen.getByText('연결이 끊겼어요')).toBeInTheDocument();
  });

  it('retryLabel 로 버튼 문구를 바꿀 수 있다', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<InlineError retryLabel="다시 연결" onRetry={onRetry} />);
    await user.click(screen.getByRole('button', { name: '다시 연결' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
