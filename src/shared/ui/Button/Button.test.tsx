import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Plus } from 'lucide-react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children as label', () => {
    render(<Button>가입하기</Button>);
    expect(screen.getByRole('button', { name: '가입하기' })).toBeInTheDocument();
  });

  it('invokes onClick when pressed', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>로그인</Button>);
    await user.click(screen.getByRole('button', { name: '로그인' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies the primary variant by default', () => {
    render(<Button>기본</Button>);
    expect(screen.getByRole('button', { name: '기본' }).className).toContain('bg-primary');
  });

  // components.css `.av-btn` — 모든 버튼은 pill · height 40(sm 32 · lg 48).
  it('pill 반경과 기본 높이 40px 를 갖는다', () => {
    render(<Button>기본</Button>);
    const btn = screen.getByRole('button', { name: '기본' });
    expect(btn.className).toContain('rounded-pill');
    expect(btn.className).toContain('h-10');
  });

  it.each([
    ['sm', 'h-8'],
    ['md', 'h-10'],
    ['lg', 'h-12'],
  ] as const)('size="%s" 이면 높이 %s 가 적용된다', (size, heightClass) => {
    render(<Button size={size}>크기</Button>);
    expect(screen.getByRole('button', { name: '크기' }).className).toContain(heightClass);
  });

  // `.av-btn--secondary{background:var(--surface);color:var(--primary);border-color:var(--primary)}`
  // — 틴트 채움이 아니라 흰 서피스 + 파란 테두리다.
  it('secondary 는 흰 서피스 + 파란 테두리 + 파란 텍스트다', () => {
    render(<Button variant="secondary">보조</Button>);
    const cls = screen.getByRole('button', { name: '보조' }).className;
    expect(cls).toContain('bg-surface');
    expect(cls).toContain('border-primary');
    expect(cls).toContain('text-primary');
  });

  it('dark variant 는 brand-dark 를 채운다', () => {
    render(<Button variant="dark">다크</Button>);
    expect(screen.getByRole('button', { name: '다크' }).className).toContain('bg-brand-dark');
  });

  it('danger variant 는 위험색을 채운다', () => {
    render(<Button variant="danger">삭제</Button>);
    expect(screen.getByRole('button', { name: '삭제' }).className).toContain('bg-danger');
  });

  // `.av-btn:focus-visible{box-shadow:var(--focus-ring)}` — 인터랙션 5상태 중 focus.
  it('focus-visible 포커스 링을 갖는다', () => {
    render(<Button>포커스</Button>);
    expect(screen.getByRole('button', { name: '포커스' }).className).toContain(
      'focus-visible:shadow-focus'
    );
  });

  it('block 이면 폭 100% 로 늘어난다', () => {
    render(<Button block>전체 폭</Button>);
    expect(screen.getByRole('button', { name: '전체 폭' }).className).toContain('w-full');
  });

  // `.av-btn--icon{width:40px;padding:0}` — 좌우 패딩 대신 높이와 같은 정사각 폭.
  it('icon 이면 좌우 패딩 대신 정사각 폭을 갖는다', () => {
    render(
      <Button icon aria-label="추가">
        <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
      </Button>
    );
    const cls = screen.getByRole('button', { name: '추가' }).className;
    expect(cls).toContain('w-10');
    expect(cls).not.toContain('px-4.5');
  });

  it('disabled 이면 클릭이 무시된다', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        비활성
      </Button>
    );
    const btn = screen.getByRole('button', { name: '비활성' });
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});
