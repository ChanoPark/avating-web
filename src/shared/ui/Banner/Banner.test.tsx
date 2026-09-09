import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Banner } from './Banner';

describe('Banner', () => {
  it('제목과 본문을 함께 렌더한다', () => {
    render(
      <Banner tone="danger" title="저장하지 못했어요">
        서버 문제로 변경 사항이 저장되지 않았어요. 다시 시도해 주세요.
      </Banner>
    );
    expect(screen.getByText('저장하지 못했어요')).toBeInTheDocument();
    expect(
      screen.getByText('서버 문제로 변경 사항이 저장되지 않았어요. 다시 시도해 주세요.')
    ).toBeInTheDocument();
  });

  it('제목 없이 본문만으로도 렌더된다', () => {
    render(<Banner tone="info">다시 로그인하면 보던 화면으로 돌아갑니다.</Banner>);
    expect(screen.getByText('다시 로그인하면 보던 화면으로 돌아갑니다.')).toBeInTheDocument();
  });

  it('danger·warning 은 role="alert" 로, info·success 는 role="status" 로 알린다', () => {
    const { rerender } = render(<Banner tone="danger">실패</Banner>);
    expect(screen.getByRole('alert')).toHaveTextContent('실패');

    rerender(<Banner tone="warning">주의</Banner>);
    expect(screen.getByRole('alert')).toHaveTextContent('주의');

    rerender(<Banner tone="info">안내</Banner>);
    expect(screen.getByRole('status')).toHaveTextContent('안내');

    rerender(<Banner tone="success">완료</Banner>);
    expect(screen.getByRole('status')).toHaveTextContent('완료');
  });

  it('톤 배경은 무채색이고 파괴적 알림만 틴트다 — 같은 색 테두리를 겹치지 않는다', () => {
    const { rerender } = render(<Banner tone="danger">실패</Banner>);
    expect(screen.getByRole('alert').className).toContain('bg-danger-tint');
    expect(screen.getByRole('alert').className).toContain('border-transparent');

    rerender(<Banner tone="info">안내</Banner>);
    expect(screen.getByRole('status').className).toContain('bg-raised');

    rerender(<Banner tone="warning">주의</Banner>);
    expect(screen.getByRole('alert').className).toContain('bg-raised');

    rerender(<Banner tone="success">완료</Banner>);
    expect(screen.getByRole('status').className).toContain('bg-raised');
  });

  it('onClose 를 주면 닫기 버튼이 노출되고 클릭 시 호출된다', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Banner tone="info" title="세션이 만료돼 로그아웃됐어요" onClose={onClose}>
        다시 로그인하면 보던 화면으로 돌아갑니다.
      </Banner>
    );
    await user.click(screen.getByRole('button', { name: '알림 닫기' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('onClose 가 없으면 닫기 버튼을 그리지 않는다', () => {
    render(<Banner tone="danger">실패</Banner>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('아이콘은 장식이므로 접근성 트리에서 제외한다', () => {
    const { container } = render(<Banner tone="danger">실패</Banner>);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});
