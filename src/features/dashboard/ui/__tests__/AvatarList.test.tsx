import { Suspense, useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useSuspenseQuery } from '@tanstack/react-query';
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

  it('"매칭" 버튼 클릭 시 상세 화면과 같은 매칭 요청 모달이 그 후보로 열린다', async () => {
    const user = userEvent.setup();
    server.use(simCandidatesHandlers.success);
    renderWithProviders(<AvatarList onAvatarClick={vi.fn()} />);

    await screen.findByRole('list', { name: '추천 아바타 목록' });
    const [first] = screen.getAllByRole('button', { name: /^매칭$/ });
    await user.click(first!);

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: '이 아바타에게 소개팅을 요청할까요?' })
    ).toBeInTheDocument();
    expect(within(dialog).getByText('하늘')).toBeInTheDocument();
    expect(within(dialog).getByText('#H7K2MP')).toBeInTheDocument();
    expect(
      await within(dialog).findByRole('radiogroup', { name: '요청에 사용할 내 아바타' })
    ).toBeInTheDocument();
  });

  it('모달을 닫으면 포커스가 눌렀던 "매칭" 버튼으로 돌아간다', async () => {
    const user = userEvent.setup();
    server.use(simCandidatesHandlers.success);
    renderWithProviders(<AvatarList onAvatarClick={vi.fn()} />);

    await screen.findByRole('list', { name: '추천 아바타 목록' });
    const [first] = screen.getAllByRole('button', { name: /^매칭$/ });
    await user.click(first!);
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(first).toHaveFocus();
  });

  it('후보가 없으면 빈 상태를 보여주고 필터 초기화는 없다', async () => {
    server.use(simCandidatesHandlers.empty);
    renderWithProviders(<AvatarList onAvatarClick={vi.fn()} />);

    expect(await screen.findByText('추천할 아바타가 없어요')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /필터 초기화/ })).not.toBeInTheDocument();
  });

  it('500 이면 다시 시도 버튼 없이 상단 에러 토스트로 알린다', async () => {
    server.use(simCandidatesHandlers.serverError);
    renderWithProviders(<AvatarList onAvatarClick={vi.fn()} />);

    const toast = (await screen.findByText('추천 아바타를 불러오지 못했어요')).closest(
      '[role="status"]'
    );
    expect(toast).toHaveClass('bg-danger-tint');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument();
  });

  it('실패한 화면을 벗어나면 토스트가 사라지고, 다시 들어오면 재요청해 목록을 보여준다', async () => {
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

    // 실제 앱에서는 그 사이에 다른 화면의 suspense 쿼리가 마운트된다 — 쿼리 에러 리셋 경계에만
    // 기대면 그 쿼리가 리셋 표시를 지워, 돌아왔을 때 캐시된 에러가 재요청 없이 다시 던져진다.
    function OtherScreen() {
      useSuspenseQuery({ queryKey: ['other-screen'], queryFn: () => Promise.resolve('ok') });
      return <p>다른 화면</p>;
    }

    function Screen() {
      const [onDashboard, setOnDashboard] = useState(true);
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setOnDashboard((v) => !v);
            }}
          >
            화면 전환
          </button>
          {onDashboard ? (
            <AvatarList onAvatarClick={vi.fn()} />
          ) : (
            <Suspense fallback={null}>
              <OtherScreen />
            </Suspense>
          )}
        </>
      );
    }
    renderWithProviders(<Screen />);

    await screen.findByText('추천 아바타를 불러오지 못했어요');
    await user.click(screen.getByRole('button', { name: '화면 전환' }));
    expect(await screen.findByText('다른 화면')).toBeInTheDocument();
    expect(screen.queryByText('추천 아바타를 불러오지 못했어요')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '화면 전환' }));

    expect(await screen.findByRole('button', { name: '하늘#H7K2MP' })).toBeInTheDocument();
    expect(callCount).toBe(2);
  });
});
