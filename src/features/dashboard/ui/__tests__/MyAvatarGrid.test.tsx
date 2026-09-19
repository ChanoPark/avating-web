import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@shared/mocks/server';
import { mockPrimaryAvatar, primaryAvatarHandlers } from '@shared/mocks/handlers/primaryAvatar';
import { MyAvatarGrid } from '../MyAvatarGrid';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

describe('MyAvatarGrid', () => {
  describe('헤더', () => {
    it('"내 아바타" 헤딩과 "추가하기" 액션 하나만 렌더된다', async () => {
      server.use(primaryAvatarHandlers.success);
      renderWithProviders(<MyAvatarGrid />);

      await waitFor(() => {
        expect(screen.getByText('루시')).toBeInTheDocument();
      });
      expect(screen.getByRole('heading', { name: /내 아바타/ })).toBeInTheDocument();
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveAccessibleName(/추가하기/);
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

      expect(await screen.findByText('내 아바타를 불러오지 못했어요')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: '다시 시도' }));

      await waitFor(() => {
        expect(screen.getByText('루시')).toBeInTheDocument();
      });
      expect(callCount).toBe(2);
    });
  });
});
