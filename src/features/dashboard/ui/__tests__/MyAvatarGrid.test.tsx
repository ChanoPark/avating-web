import { describe, it, expect } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@shared/mocks/server';
import { mockPrimaryAvatar, primaryAvatarHandlers } from '@shared/mocks/handlers/primaryAvatar';
import { MyAvatarGrid } from '../MyAvatarGrid';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

describe('MyAvatarGrid', () => {
  describe('헤더', () => {
    it('"대표 아바타" 헤딩만 있고 액션 버튼은 없다', async () => {
      server.use(primaryAvatarHandlers.success);
      renderWithProviders(<MyAvatarGrid />);

      await waitFor(() => {
        expect(screen.getByText('루시')).toBeInTheDocument();
      });
      expect(screen.getByRole('heading', { name: '대표 아바타' })).toBeInTheDocument();
      expect(screen.queryAllByRole('button')).toHaveLength(0);
    });
  });

  describe('대표 아바타 요약 (GET /api/avatars/primary)', () => {
    it('이니셜·이름#해시태그·한 줄 소개가 렌더된다', async () => {
      server.use(primaryAvatarHandlers.success);
      renderWithProviders(<MyAvatarGrid />);

      await waitFor(() => {
        expect(screen.getByText('루시')).toBeInTheDocument();
      });
      expect(screen.getByText('#A3K9Z7')).toBeInTheDocument();
      expect(screen.getByText('루')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByText('따뜻하고 유머 감각 넘치는 ENFP')).toBeInTheDocument();
    });

    it('한 줄 소개가 빈 문자열이면 소개 줄을 그리지 않는다', async () => {
      server.use(
        http.get(`${BASE_URL}/api/avatars/primary`, () =>
          HttpResponse.json({ data: { ...mockPrimaryAvatar.data, description: '' } })
        )
      );
      renderWithProviders(<MyAvatarGrid />);

      await waitFor(() => {
        expect(screen.getByText('루시')).toBeInTheDocument();
      });
      expect(screen.queryByText('따뜻하고 유머 감각 넘치는 ENFP')).not.toBeInTheDocument();
    });

    // 서버가 주지 않는 값(상태·진행 중 매칭 수)을 지어내지 않는다.
    it('서버에 없는 상태 배지·진행 중 매칭 행은 그리지 않는다', async () => {
      server.use(primaryAvatarHandlers.success);
      renderWithProviders(<MyAvatarGrid />);

      await waitFor(() => {
        expect(screen.getByText('루시')).toBeInTheDocument();
      });
      expect(screen.queryByText('활성')).not.toBeInTheDocument();
      expect(screen.queryByText('진행 중 매칭')).not.toBeInTheDocument();
    });
  });

  describe('빈 상태', () => {
    it('대표 아바타가 없으면(404) 오류가 아니라 안내 문구를 보여준다', async () => {
      server.use(primaryAvatarHandlers.none);
      renderWithProviders(<MyAvatarGrid />);

      await waitFor(() => {
        expect(screen.getByText(/아직 아바타가 없어요/)).toBeInTheDocument();
      });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  // 디자인 정본은 6축이지만 사용자 결정(2026-09-19)으로 서버 PersonaStatType 7지표를 그린다.
  describe('성향 레이더 + 값 표', () => {
    function primaryWithStats(stats: Record<string, number>) {
      return http.get(`${BASE_URL}/api/avatars/primary`, () =>
        HttpResponse.json({ data: { ...mockPrimaryAvatar.data, stats } })
      );
    }

    it('대표 아바타의 성향 7지표를 레이더와 값 표로 보여준다', async () => {
      server.use(primaryAvatarHandlers.success);
      renderWithProviders(<MyAvatarGrid />);

      const table = await screen.findByRole('table', { name: '성향 지표' });
      expect(screen.getByRole('img', { name: '아바타 스탯 레이더' })).toBeInTheDocument();
      expect(within(table).getAllByRole('row')).toHaveLength(7);

      // 표시 순서는 서버 enum 순서, 값은 반올림(72.5 → 73)해 tabular-nums 로 쓴다.
      const rowHeaders = within(table).getAllByRole('rowheader');
      expect(rowHeaders.map((th) => th.textContent)).toEqual([
        '개방성',
        '상상력',
        '외향성',
        '공감',
        '계획성',
        '유머',
        '애정표현',
      ]);
      // --text-muted 는 AA 미달(3.93:1)이라 읽어야 하는 라벨에 쓰지 않는다 (e2e axe 게이트).
      expect(rowHeaders[0]).toHaveClass('text-secondary');
      const openness = within(table).getByRole('row', { name: /개방성/ });
      const value = within(openness).getByRole('cell');
      expect(value).toHaveTextContent('73');
      expect(value).toHaveClass('tnum');
    });

    it('응답에 없는 지표는 행과 레이더 축에서 함께 빠진다', async () => {
      server.use(
        primaryWithStats({
          OPENNESS: 60,
          EXTROVERSION: 40,
          EMPATHY: 70,
          HUMOROUS: 90,
          IMAGINATION: 55,
        })
      );
      renderWithProviders(<MyAvatarGrid />);

      const table = await screen.findByRole('table', { name: '성향 지표' });
      expect(within(table).getAllByRole('row')).toHaveLength(5);
      const radar = screen.getByRole('img', { name: '아바타 스탯 레이더' });
      expect(within(radar).queryByText('계획성')).not.toBeInTheDocument();
      expect(within(radar).getByText('유머')).toBeInTheDocument();
    });

    it('지표가 3개 미만이면 레이더 없이 값 표만 보여준다', async () => {
      server.use(primaryWithStats({ OPENNESS: 50, EMPATHY: 60 }));
      renderWithProviders(<MyAvatarGrid />);

      const table = await screen.findByRole('table', { name: '성향 지표' });
      expect(within(table).getAllByRole('row')).toHaveLength(2);
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('지표가 하나도 없으면 성향 영역을 그리지 않는다', async () => {
      server.use(primaryWithStats({}));
      renderWithProviders(<MyAvatarGrid />);

      await waitFor(() => {
        expect(screen.getByText('루시')).toBeInTheDocument();
      });
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('로딩 상태', () => {
    // 스켈레톤은 실제 콘텐츠와 같은 상자여야 로드 순간 아래 섹션이 밀리지 않는다.
    it('스켈레톤의 레이더 자리는 실제 레이더와 같은 높이다', async () => {
      server.use(primaryAvatarHandlers.success);
      renderWithProviders(<MyAvatarGrid />);

      const placeholder = screen.getByTestId('stat-radar-skeleton');
      const skeletonHeight = placeholder.getAttribute('height');
      const radar = await screen.findByRole('img', { name: '아바타 스탯 레이더' });
      expect(radar.getAttribute('height')).toBe(skeletonHeight);
    });

    it('불러오는 동안 스켈레톤이 aria-busy 로 로딩 중임을 알린다', async () => {
      server.use(primaryAvatarHandlers.success);
      renderWithProviders(<MyAvatarGrid />);

      expect(screen.getByRole('region', { name: '대표 아바타' })).toHaveAttribute(
        'aria-busy',
        'true'
      );
      await waitFor(() => {
        expect(screen.getByRole('region', { name: '대표 아바타' })).not.toHaveAttribute(
          'aria-busy'
        );
      });
    });
  });

  describe('오류 상태', () => {
    it('500 이면 영역 오류를 보여주고, "다시 시도" 로 재요청해 복구한다', async () => {
      const user = userEvent.setup();
      let callCount = 0;
      server.use(
        http.get(`${BASE_URL}/api/avatars/primary`, () => {
          callCount++;
          return callCount === 1
            ? HttpResponse.json(
                { code: 'COMMON_500_001', message: '서버 오류가 발생했습니다' },
                { status: 500 }
              )
            : HttpResponse.json(mockPrimaryAvatar);
        })
      );
      renderWithProviders(<MyAvatarGrid />);

      expect(await screen.findByText('대표 아바타를 불러오지 못했어요')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: '다시 시도' }));

      await waitFor(() => {
        expect(screen.getByText('루시')).toBeInTheDocument();
      });
      expect(callCount).toBe(2);
    });
  });
});
