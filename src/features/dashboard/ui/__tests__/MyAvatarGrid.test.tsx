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

    it('아바타가 3개 이상일 때는 "더보기" 버튼이 렌더된다', async () => {
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
        expect(screen.getByRole('button', { name: /더보기/ })).toBeInTheDocument();
      });
    });
  });

  describe('아바타 카드', () => {
    it('isPrimary=true 아바타에 "활성" Tag 가 표시된다', async () => {
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
        expect(screen.getByText(/^활성$/)).toBeInTheDocument();
      });
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

  describe('빈 슬롯', () => {
    it('아바타가 0개일 때 dashed 빈 슬롯 3개가 렌더된다', async () => {
      server.use(myAvatarsHandler([]));
      const { container } = renderWithProviders(<MyAvatarGrid />);
      await waitFor(() => {
        const slots = container.querySelectorAll('[data-empty-slot="true"]');
        expect(slots.length).toBe(3);
      });
    });

    it('아바타가 1개일 때 빈 슬롯 2개가 렌더된다', async () => {
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
        ])
      );
      const { container } = renderWithProviders(<MyAvatarGrid />);
      await waitFor(() => {
        const slots = container.querySelectorAll('[data-empty-slot="true"]');
        expect(slots.length).toBe(2);
      });
    });

    it('아바타가 3개 이상이면 빈 슬롯이 없다', async () => {
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
      const { container } = renderWithProviders(<MyAvatarGrid />);
      await waitFor(() => {
        // 데이터 로드 후
        expect(screen.getByText('avatar-a')).toBeInTheDocument();
      });
      const slots = container.querySelectorAll('[data-empty-slot="true"]');
      expect(slots.length).toBe(0);
    });
  });
});
