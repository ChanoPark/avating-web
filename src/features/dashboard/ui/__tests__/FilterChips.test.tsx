import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterChips } from '../FilterChips';
import type { RecommendedAvatarFilter } from '@entities/dashboard/model';

const initialFilter: RecommendedAvatarFilter = {
  online: false,
  introvert: false,
  extrovert: false,
  verified: false,
};

describe('FilterChips', () => {
  it('칩 5개가 렌더된다 (전체/온라인/내향/외향/인증)', () => {
    render(<FilterChips filter={initialFilter} onFilterChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '전체' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '온라인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '내향' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '외향' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '인증' })).toBeInTheDocument();
  });

  it('초기 상태(모두 false) 에서 "전체" 칩이 active(aria-pressed="true") 이다', () => {
    render(<FilterChips filter={initialFilter} onFilterChange={vi.fn()} />);
    const allChip = screen.getByRole('button', { name: '전체' });
    expect(allChip).toHaveAttribute('aria-pressed', 'true');
  });

  it('초기 상태에서 "온라인" 칩은 비활성(aria-pressed="false") 이다', () => {
    render(<FilterChips filter={initialFilter} onFilterChange={vi.fn()} />);
    const onlineChip = screen.getByRole('button', { name: '온라인' });
    expect(onlineChip).toHaveAttribute('aria-pressed', 'false');
  });

  it('"온라인" 클릭 시 onFilterChange 가 online:true 포함한 필터로 호출된다', async () => {
    const onFilterChange = vi.fn();
    const user = userEvent.setup();
    render(<FilterChips filter={initialFilter} onFilterChange={onFilterChange} />);
    await user.click(screen.getByRole('button', { name: '온라인' }));
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ online: true }));
  });

  it('"전체" 클릭 시 onFilterChange 가 모두 false 인 필터로 호출된다', async () => {
    const onFilterChange = vi.fn();
    const user = userEvent.setup();
    const activeFilter: RecommendedAvatarFilter = {
      online: true,
      introvert: false,
      extrovert: false,
      verified: false,
    };
    render(<FilterChips filter={activeFilter} onFilterChange={onFilterChange} />);
    await user.click(screen.getByRole('button', { name: '전체' }));
    expect(onFilterChange).toHaveBeenCalledWith({
      online: false,
      introvert: false,
      extrovert: false,
      verified: false,
    });
  });

  it('온라인 필터 활성 상태에서 "전체"는 비활성이어야 한다', () => {
    const activeFilter: RecommendedAvatarFilter = {
      online: true,
      introvert: false,
      extrovert: false,
      verified: false,
    };
    render(<FilterChips filter={activeFilter} onFilterChange={vi.fn()} />);
    const allChip = screen.getByRole('button', { name: '전체' });
    const onlineChip = screen.getByRole('button', { name: '온라인' });
    expect(allChip).toHaveAttribute('aria-pressed', 'false');
    expect(onlineChip).toHaveAttribute('aria-pressed', 'true');
  });

  it('모든 칩이 비활성이면 "전체" 가 active 이다 (isAllActive 헬퍼)', () => {
    render(<FilterChips filter={initialFilter} onFilterChange={vi.fn()} />);
    const allChip = screen.getByRole('button', { name: '전체' });
    expect(allChip).toHaveAttribute('aria-pressed', 'true');
  });

  it('각 칩 aria-pressed 가 filter 상태와 동기화된다', () => {
    const multiFilter: RecommendedAvatarFilter = {
      online: true,
      introvert: true,
      extrovert: false,
      verified: false,
    };
    render(<FilterChips filter={multiFilter} onFilterChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '온라인' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '내향' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '외향' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: '인증' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('키보드 Tab 으로 칩 사이를 이동할 수 있다', async () => {
    const user = userEvent.setup();
    render(<FilterChips filter={initialFilter} onFilterChange={vi.fn()} />);
    const allChip = screen.getByRole('button', { name: '전체' });
    allChip.focus();
    await user.tab();
    const onlineChip = screen.getByRole('button', { name: '온라인' });
    expect(onlineChip).toHaveFocus();
  });

  it('유일하게 활성된 칩을 토글 오프 시 isAllActive → resetFilter() 경로가 호출된다', async () => {
    // online 만 true 인 상태에서 "온라인" 클릭 → next = 모두 false → isAllActive(next)=true → resetFilter
    const onFilterChange = vi.fn();
    const user = userEvent.setup();
    const onlyOnlineFilter: RecommendedAvatarFilter = {
      online: true,
      introvert: false,
      extrovert: false,
      verified: false,
    };
    render(<FilterChips filter={onlyOnlineFilter} onFilterChange={onFilterChange} />);
    await user.click(screen.getByRole('button', { name: '온라인' }));
    expect(onFilterChange).toHaveBeenCalledWith({
      online: false,
      introvert: false,
      extrovert: false,
      verified: false,
    });
  });
});
