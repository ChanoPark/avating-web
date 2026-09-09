import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Plus } from 'lucide-react';
import { Button } from './Button';

// 정본: `_ds/components/cx-components.css` `.cx-btn`
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

  it('기본 CTA 는 검정 잉크다 — 파란 채움이 아니다', () => {
    render(<Button>기본</Button>);
    const cls = screen.getByRole('button', { name: '기본' }).className;
    expect(cls).toContain('bg-ink');
    expect(cls).not.toContain('bg-action');
  });

  it('radius 는 card(10) 이고 테두리가 없다 — pill 이 아니다', () => {
    render(<Button>기본</Button>);
    const cls = screen.getByRole('button', { name: '기본' }).className;
    expect(cls).toContain('rounded-card');
    expect(cls).toContain('border-0');
    expect(cls).not.toContain('rounded-full');
  });

  it('라벨은 크기와 무관하게 14/600 하나다 (본문 스케일이 아니다)', () => {
    render(
      <>
        <Button size="sm">작게</Button>
        <Button size="lg">크게</Button>
      </>
    );
    expect(screen.getByRole('button', { name: '작게' }).className).toContain('text-btn');
    expect(screen.getByRole('button', { name: '크게' }).className).toContain('text-btn');
  });

  it.each([
    ['sm', 'h-8'],
    ['md', 'h-10'],
    ['lg', 'h-11'],
  ] as const)('size="%s" 이면 높이 %s 가 적용된다', (size, heightClass) => {
    render(<Button size={size}>크기</Button>);
    expect(screen.getByRole('button', { name: '크기' }).className).toContain(heightClass);
  });

  it('brand 는 시스템에서 유일한 파란 채움이다', () => {
    render(<Button variant="brand">시작하기</Button>);
    const cls = screen.getByRole('button', { name: '시작하기' }).className;
    expect(cls).toContain('bg-action');
    expect(cls).toContain('text-on-action');
  });

  it('secondary 는 무채색 약한 채움이다 — 파란 테두리가 아니다', () => {
    render(<Button variant="secondary">보조</Button>);
    const cls = screen.getByRole('button', { name: '보조' }).className;
    expect(cls).toContain('bg-fill-weak');
    expect(cls).toContain('text-primary');
    expect(cls).not.toContain('border-mark');
  });

  it('danger 는 텍스트다 — 빨간 채움은 확인 다이얼로그 전용이라 여기 없다', () => {
    render(<Button variant="danger">삭제</Button>);
    const cls = screen.getByRole('button', { name: '삭제' }).className;
    expect(cls).toContain('text-danger');
    expect(cls).toContain('bg-transparent');
    expect(cls.split(' ')).not.toContain('bg-danger');
  });

  it('비활성은 opacity 가 아니라 색 토큰으로 표현한다', () => {
    render(<Button disabled>비활성</Button>);
    const cls = screen.getByRole('button', { name: '비활성' }).className;
    expect(cls).toContain('disabled:bg-raised');
    expect(cls).toContain('disabled:text-muted');
    expect(cls).not.toContain('opacity');
  });

  it('누를 때 transform 을 쓰지 않는다', () => {
    render(<Button>기본</Button>);
    expect(screen.getByRole('button', { name: '기본' }).className).not.toContain('translate-y');
  });

  it('focus-visible 포커스 링을 갖는다', () => {
    render(<Button>포커스</Button>);
    expect(screen.getByRole('button', { name: '포커스' }).className).not.toContain('outline-none');
  });

  it('block 이면 폭 100% 로 늘어난다', () => {
    render(<Button block>전체 폭</Button>);
    expect(screen.getByRole('button', { name: '전체 폭' }).className).toContain('w-full');
  });

  it('icon 이면 좌우 패딩 대신 정사각 폭을 갖는다', () => {
    render(
      <Button icon aria-label="추가">
        <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
      </Button>
    );
    const cls = screen.getByRole('button', { name: '추가' }).className;
    expect(cls).toContain('w-10');
    expect(cls).not.toContain('px-4');
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
