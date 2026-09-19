import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@shared/mocks/server';
import { mockSimCandidates, simCandidatesHandlers } from '@shared/mocks/handlers/avatarCandidates';
import { AvatarList } from '../AvatarList';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

describe('AvatarList (GET /api/avatars/candidates)', () => {
  it('후보 아바타마다 카드가 렌더된다', async () => {
    server.use(simCandidatesHandlers.success);
    renderWithProviders(<AvatarList onAvatarClick={vi.fn()} />);

    const list = await screen.findByRole('list', { name: '추천 아바타 목록' });
    expect(within(list).getByRole('button', { name: '하늘#H7K2MP' })).toBeInTheDocument();
    expect(within(list).getByRole('button', { name: '봄날#B3RT9Q' })).toBeInTheDocument();
    expect(within(list).getByRole('button', { name: 'Moonlit#Q5WN8Z' })).toBeInTheDocument();
  });

  it('size 를 실어 한 번 요청한다', async () => {
    const sizes: (string | null)[] = [];
    server.use(
      http.get(`${BASE_URL}/api/avatars/candidates`, ({ request }) => {
        sizes.push(new URL(request.url).searchParams.get('size'));
        return HttpResponse.json(mockSimCandidates);
      })
    );
    renderWithProviders(<AvatarList onAvatarClick={vi.fn()} />);

    await screen.findByRole('list', { name: '추천 아바타 목록' });
    expect(sizes).toHaveLength(1);
    expect(Number(sizes[0])).toBeGreaterThanOrEqual(1);
    expect(Number(sizes[0])).toBeLessThanOrEqual(50);
  });

  it('요청할 수 없는 후보만 매칭 버튼이 비활성화된다', async () => {
    server.use(simCandidatesHandlers.success);
    renderWithProviders(<AvatarList onAvatarClick={vi.fn()} />);

    await screen.findByRole('list', { name: '추천 아바타 목록' });
    const buttons = screen.getAllByRole('button', { name: /^매칭$/ });
    expect(buttons.map((b) => (b as HTMLButtonElement).disabled)).toEqual([false, true, false]);
    expect(screen.getAllByText('매칭 중')).toHaveLength(1);
  });

  it('카드 클릭 시 onAvatarClick(avatarId) 가 호출된다', async () => {
    const onAvatarClick = vi.fn();
    const user = userEvent.setup();
    server.use(simCandidatesHandlers.success);
    renderWithProviders(<AvatarList onAvatarClick={onAvatarClick} />);

    await user.click(await screen.findByRole('button', { name: '하늘#H7K2MP' }));
    expect(onAvatarClick).toHaveBeenCalledWith('22222222-2222-4222-8222-222222222222');
  });

  it('"매칭" 버튼 클릭 시 해당 아바타 이름으로 DispatchModal 이 열린다', async () => {
    const user = userEvent.setup();
    server.use(simCandidatesHandlers.success);
    renderWithProviders(<AvatarList onAvatarClick={vi.fn()} />);

    await screen.findByRole('list', { name: '추천 아바타 목록' });
    const [first] = screen.getAllByRole('button', { name: /^매칭$/ });
    await user.click(first!);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/하늘 아바타와 매칭을 시작할까요/)).toBeInTheDocument();
  });

  it('후보가 없으면 빈 상태를 보여주고 필터 초기화는 없다', async () => {
    server.use(simCandidatesHandlers.empty);
    renderWithProviders(<AvatarList onAvatarClick={vi.fn()} />);

    expect(await screen.findByText('추천할 아바타가 없어요')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /필터 초기화/ })).not.toBeInTheDocument();
  });

  it('500 이면 영역 오류를 보여주고, "다시 시도" 로 재요청해 복구한다', async () => {
    const user = userEvent.setup();
    let callCount = 0;
    server.use(
      http.get(`${BASE_URL}/api/avatars/candidates`, () => {
        callCount++;
        return callCount === 1
          ? HttpResponse.json(
              { code: 'COMMON_500_001', message: '서버 오류가 발생했습니다' },
              { status: 500 }
            )
          : HttpResponse.json(mockSimCandidates);
      })
    );
    renderWithProviders(<AvatarList onAvatarClick={vi.fn()} />);

    expect(await screen.findByText('추천 아바타를 불러오지 못했어요')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByRole('button', { name: '하늘#H7K2MP' })).toBeInTheDocument();
    expect(callCount).toBe(2);
  });
});
