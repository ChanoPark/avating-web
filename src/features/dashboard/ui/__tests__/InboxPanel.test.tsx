import { describe, it, expect } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@shared/mocks/server';
import {
  invitationHistoryHandler,
  invitationHistoryHandlers,
} from '@shared/mocks/handlers/invitationHistory';
import { matchRequestKeys } from '@entities/match-request';
import type { InvitationHistoryItem } from '@entities/match-request';
import { InboxPanel } from '../InboxPanel';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function received(
  id: string,
  inviterName: string,
  {
    elapsed,
    expiresIn = DAY - elapsed,
    ...rest
  }: Partial<Pick<InvitationHistoryItem, 'status' | 'requestMessage'>> & {
    elapsed: number;
    expiresIn?: number;
  }
): InvitationHistoryItem {
  const now = Date.now();
  return {
    simulationInvitationId: id,
    inviterAvatarId: `inviter-${id}`,
    inviterAvatarName: inviterName,
    inviteeAvatarId: 'my-avatar',
    inviteeAvatarName: '여름',
    status: 'PENDING',
    direction: 'RECEIVED',
    createdAt: new Date(now - elapsed).toISOString(),
    expiredAt: new Date(now + expiresIn).toISOString(),
    ...rest,
  };
}

const PENDING_ITEMS = [
  received('r1', 'Moonlit', { elapsed: 10 * MINUTE, requestMessage: '같이 산책 얘기 해요' }),
  received('r2', '봄날', { elapsed: 2 * HOUR }),
  received('r3', '하늘', { elapsed: 3 * HOUR, requestMessage: '안녕하세요' }),
  received('r4', '노을', { elapsed: 5 * HOUR }),
];

function rows(): HTMLElement[] {
  return within(screen.getByRole('region', { name: '알림' })).getAllByRole('listitem');
}

describe('InboxPanel', () => {
  describe('조회 계약', () => {
    it('받은 초대 중 응답 대기(PENDING)만 서버 상한 50건으로 조회한다', async () => {
      const requested: string[] = [];
      server.use(
        http.get(`${BASE_URL}/api/simulations/invitations`, ({ request }) => {
          requested.push(new URL(request.url).searchParams.toString());
          return HttpResponse.json({ data: { content: [], hasNext: false } });
        })
      );
      renderWithProviders(<InboxPanel />);

      await screen.findByText('새 매칭 요청이 없어요');
      expect(requested).toEqual(['direction=RECEIVED&status=PENDING&size=50']);
    });
  });

  it('화면 진입에서 기다리는 조회라 실패하면 다시 묻지 않고 바로 실패를 알린다', async () => {
    server.use(invitationHistoryHandler(PENDING_ITEMS));
    const { queryClient } = renderWithProviders(<InboxPanel />);

    await screen.findByText('Moonlit 님이 매칭을 요청했어요');
    const query = queryClient
      .getQueryCache()
      .find({ queryKey: matchRequestKeys.receivedPending() });
    expect(query?.options.retry).toBe(false);
  });

  describe('렌더링', () => {
    it('헤더에 "알림" 이 있고 "전체 보기" 는 매칭 요청 화면으로 가는 링크다', async () => {
      server.use(invitationHistoryHandler(PENDING_ITEMS));
      renderWithProviders(<InboxPanel />);

      expect(await screen.findByRole('heading', { name: '알림' })).toBeInTheDocument();
      expect(await screen.findByRole('link', { name: '전체 보기' })).toHaveAttribute(
        'href',
        '/simulations'
      );
    });
  });

  describe('받은 요청 행', () => {
    it('최근 요청 순으로 3건까지만 보인다', async () => {
      server.use(invitationHistoryHandler(PENDING_ITEMS));
      renderWithProviders(<InboxPanel />);

      await screen.findByText('Moonlit 님이 매칭을 요청했어요');
      expect(
        rows().map((row) => within(row).getAllByText(/님이 매칭을 요청했어요$/)[0]?.textContent)
      ).toEqual([
        'Moonlit 님이 매칭을 요청했어요',
        '봄날 님이 매칭을 요청했어요',
        '하늘 님이 매칭을 요청했어요',
      ]);
    });

    it('행 아래 줄에 요청 메시지를, 메시지가 없으면 어느 내 아바타에게 온 요청인지 보인다', async () => {
      server.use(invitationHistoryHandler(PENDING_ITEMS));
      renderWithProviders(<InboxPanel />);

      await screen.findByText('Moonlit 님이 매칭을 요청했어요');
      const [first, second] = rows();
      expect(within(first as HTMLElement).getByText('같이 산책 얘기 해요')).toBeInTheDocument();
      expect(
        within(second as HTMLElement).getByText('내 아바타 여름에게 온 요청')
      ).toBeInTheDocument();
    });

    it('요청 시각을 상대 시간으로 보인다', async () => {
      server.use(invitationHistoryHandler(PENDING_ITEMS));
      renderWithProviders(<InboxPanel />);

      await screen.findByText('Moonlit 님이 매칭을 요청했어요');
      const [first, second] = rows();
      expect(within(first as HTMLElement).getByText('10분 전')).toBeInTheDocument();
      expect(within(second as HTMLElement).getByText('2시간 전')).toBeInTheDocument();
    });

    // 정본 `.wf2-noti__dot`(6px 잉크 점) + `.noti-title--unread`(semibold·ink).
    it('모든 행이 응답을 기다리는 요청이라 잉크 점과 굵은 제목으로 보이고, 행을 칠하지 않는다', async () => {
      server.use(invitationHistoryHandler(PENDING_ITEMS));
      renderWithProviders(<InboxPanel />);

      await screen.findByText('Moonlit 님이 매칭을 요청했어요');
      for (const row of rows()) {
        expect(row).not.toHaveClass('bg-selected');
        expect(row.querySelector('span[aria-hidden="true"]')).toHaveClass('bg-ink');
        expect(within(row).getByText(/님이 매칭을 요청했어요$/)).toHaveClass('font-semibold');
      }
    });

    it('만료 시각이 지난 대기 요청은 서버가 아직 만료로 바꾸지 않았어도 보이지 않는다', async () => {
      server.use(
        invitationHistoryHandler([
          received('r1', 'Moonlit', { elapsed: 10 * MINUTE }),
          received('old', '노을', { elapsed: DAY + HOUR, expiresIn: -HOUR }),
        ])
      );
      renderWithProviders(<InboxPanel />);

      await screen.findByText('Moonlit 님이 매칭을 요청했어요');
      expect(screen.queryByText('노을 님이 매칭을 요청했어요')).not.toBeInTheDocument();
      expect(screen.getByLabelText('응답을 기다리는 요청 1개')).toBeInTheDocument();
    });
  });

  describe('레이아웃 보존', () => {
    it.each([
      [
        '1건',
        [received('r1', 'Moonlit', { elapsed: 10 * MINUTE })],
        'Moonlit 님이 매칭을 요청했어요',
      ],
      ['0건', [], '새 매칭 요청이 없어요'],
    ])(
      '받은 요청이 %s 이어도 목록 자리에 스켈레톤과 같은 3행 자리를 깔아 로드 뒤 패널 높이가 줄지 않는다',
      async (_label, items, visibleText) => {
        server.use(invitationHistoryHandler(items));
        renderWithProviders(<InboxPanel />);

        const anchorText = await screen.findByText(visibleText);
        const region = screen.getByRole('region', { name: '알림' });
        const spacer = region.querySelector('[data-row-spacer]');
        expect(spacer).toHaveClass('invisible');
        expect(spacer).toHaveAttribute('aria-hidden', 'true');
        expect(spacer?.children).toHaveLength(3);
        expect(spacer?.parentElement).toContainElement(anchorText);
      }
    );
  });

  describe('대기 요청 수', () => {
    it('보이는 3건이 아니라 만료 전 대기 요청 전체 수를 tnum 배지로 보인다', async () => {
      server.use(invitationHistoryHandler(PENDING_ITEMS));
      renderWithProviders(<InboxPanel />);

      const badge = await screen.findByLabelText('응답을 기다리는 요청 4개');
      expect(badge).toHaveTextContent('4');
      expect(badge).toHaveClass('tnum');
    });

    it('대기 요청이 없으면 배지 없이 빈 상태를 보인다', async () => {
      server.use(invitationHistoryHandlers.empty);
      renderWithProviders(<InboxPanel />);

      expect(await screen.findByText('새 매칭 요청이 없어요')).toBeInTheDocument();
      expect(screen.queryByLabelText(/응답을 기다리는 요청/)).not.toBeInTheDocument();
    });
  });

  describe('오류 상태', () => {
    it('500 이면 카드 머리만 남기고 상단 에러 토스트로 알린다', async () => {
      server.use(invitationHistoryHandlers.serverError);
      renderWithProviders(<InboxPanel />);

      const toast = (await screen.findByText('알림을 불러오지 못했어요')).closest(
        '[role="status"]'
      );
      expect(toast).toHaveClass('bg-danger-tint');
      expect(screen.getByRole('region', { name: '알림' })).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument();
    });

    it('실패한 화면을 떠났다 돌아오면 재요청해 받은 요청을 보여준다', async () => {
      server.use(invitationHistoryHandlers.serverError);
      const { queryClient, unmount } = renderWithProviders(<InboxPanel />);
      await screen.findByText('알림을 불러오지 못했어요');
      unmount();

      server.use(invitationHistoryHandler(PENDING_ITEMS));
      renderWithProviders(<InboxPanel />, { queryClient });

      expect(await screen.findByLabelText('응답을 기다리는 요청 4개')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.queryByText('알림을 불러오지 못했어요')).not.toBeInTheDocument();
      });
    });
  });
});
