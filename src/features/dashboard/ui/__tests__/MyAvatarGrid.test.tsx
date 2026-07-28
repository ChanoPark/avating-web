import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@shared/mocks/server';
import { http, HttpResponse } from 'msw';
import { MyAvatarGrid } from '../MyAvatarGrid';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const myAvatarsHandler = (
  items: Array<{
    id: string;
    initials: string;
    name: string;
    handle: string;
    level: number;
    status: 'online' | 'busy' | 'offline';
    verified: boolean;
    type: string;
    isPrimary: boolean;
    busy: boolean;
  }>
) =>
  http.get(`${BASE_URL}/api/me/avatars`, () => {
    return HttpResponse.json({ data: { items } });
  });

const baseAvatar = {
  level: 1,
  status: 'online' as const,
  verified: true,
  busy: false,
};

describe('MyAvatarGrid', () => {
  describe('헤더', () => {
    it('"내 아바타" 헤딩이 렌더된다', async () => {
      server.use(myAvatarsHandler([]));
      renderWithProviders(<MyAvatarGrid />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /내 아바타/ })).toBeInTheDocument();
      });
    });

    it('아바타 0개일 때 "추가하기 +" 버튼이 렌더된다', async () => {
      server.use(myAvatarsHandler([]));
      renderWithProviders(<MyAvatarGrid />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /추가하기/ })).toBeInTheDocument();
      });
    });

    // 정본(wf-s2-core ScreenDashboard) 카드 헤더의 액션은 `추가하기` 링크 하나뿐이다.
    it('아바타가 3개여도 액션은 "추가하기" 하나뿐이다', async () => {
      server.use(
        myAvatarsHandler([
          {
            ...baseAvatar,
            id: 'a',
            initials: 'AA',
            name: 'avatar-a',
            handle: '@a',
            type: '내향·분석형',
            isPrimary: true,
          },
          {
            ...baseAvatar,
            id: 'b',
            initials: 'BB',
            name: 'avatar-b',
            handle: '@b',
            type: '외향·낭만형',
            isPrimary: false,
          },
          {
            ...baseAvatar,
            id: 'c',
            initials: 'CC',
            name: 'avatar-c',
            handle: '@c',
            type: '외향·분석형',
            isPrimary: false,
          },
        ])
      );
      renderWithProviders(<MyAvatarGrid />);
      await waitFor(() => {
        expect(screen.getByText('avatar-a')).toBeInTheDocument();
      });
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveAccessibleName(/추가하기/);
    });
  });

  describe('아바타 요약', () => {
    // 정본 카드는 대표 아바타 한 명만 보여준다 (폭 300 고정).
    it('대표 아바타 한 명만 요약으로 노출된다', async () => {
      server.use(
        myAvatarsHandler([
          {
            ...baseAvatar,
            id: 'b',
            initials: 'BB',
            name: 'avatar-b',
            handle: '@b',
            type: '외향·낭만형',
            isPrimary: false,
          },
          {
            ...baseAvatar,
            id: 'a',
            initials: 'HW',
            name: 'hyunwoo',
            handle: '@hw',
            type: '내향·분석형',
            isPrimary: true,
          },
        ])
      );
      renderWithProviders(<MyAvatarGrid />);
      await waitFor(() => {
        expect(screen.getByText('hyunwoo')).toBeInTheDocument();
      });
      expect(screen.queryByText('avatar-b')).not.toBeInTheDocument();
    });

    it('online 아바타에 "활성" 배지가 붙는다', async () => {
      server.use(
        myAvatarsHandler([
          {
            ...baseAvatar,
            id: 'a',
            initials: 'HW',
            name: 'hyunwoo',
            handle: '@hw',
            type: '내향·분석형',
            isPrimary: true,
          },
        ])
      );
      renderWithProviders(<MyAvatarGrid />);
      await waitFor(() => {
        expect(screen.getByText('활성')).toBeInTheDocument();
      });
      // 정본 wf-s2-core `ScreenDashboard` 는 `av-badge--success` + `av-badge__dot` 이다.
      // 라벨만 보면 dot 유실을 놓치므로 장식 점의 존재까지 단언한다.
      const dot = screen.getByText('활성').firstElementChild;
      expect(dot).toHaveAttribute('aria-hidden', 'true');
      expect(dot?.className).toContain('rounded-full');
    });

    it('진행 중 매칭이 "매칭 중 아바타 수 / 전체 아바타 수" 로 tnum 표기된다', async () => {
      server.use(
        myAvatarsHandler([
          {
            ...baseAvatar,
            id: 'a',
            initials: 'HW',
            name: 'hyunwoo',
            handle: '@hw',
            type: '내향·분석형',
            isPrimary: true,
            busy: true,
          },
          {
            ...baseAvatar,
            id: 'b',
            initials: 'BB',
            name: 'avatar-b',
            handle: '@b',
            type: '외향·낭만형',
            isPrimary: false,
          },
        ])
      );
      renderWithProviders(<MyAvatarGrid />);
      await waitFor(() => {
        expect(screen.getByText('진행 중 매칭')).toBeInTheDocument();
      });
      expect(screen.getByText('1 / 2')).toHaveClass('tnum');
    });

    it('이니셜·이름·유형이 모두 렌더된다', async () => {
      server.use(
        myAvatarsHandler([
          {
            ...baseAvatar,
            id: 'a',
            initials: 'HW',
            name: 'hyunwoo',
            handle: '@hw',
            type: '내향·분석형',
            isPrimary: true,
          },
        ])
      );
      renderWithProviders(<MyAvatarGrid />);
      await waitFor(() => {
        expect(screen.getByText('HW')).toBeInTheDocument();
        expect(screen.getByText('hyunwoo')).toBeInTheDocument();
        expect(screen.getByText('내향·분석형')).toBeInTheDocument();
      });
    });
  });

  describe('빈 상태', () => {
    it('아바타가 0개면 안내 문구만 노출되고 진행 중 매칭 행은 없다', async () => {
      server.use(myAvatarsHandler([]));
      renderWithProviders(<MyAvatarGrid />);
      await waitFor(() => {
        expect(screen.getByText(/아직 아바타가 없어요/)).toBeInTheDocument();
      });
      expect(screen.queryByText('진행 중 매칭')).not.toBeInTheDocument();
    });
  });
});
