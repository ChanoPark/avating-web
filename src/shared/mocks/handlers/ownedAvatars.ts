import { http, HttpResponse } from 'msw';
import type { OwnedAvatarPage } from '@entities/avatar';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const MY_AVATARS_URL = `${BASE_URL}/api/avatars/me`;

export const mockOwnedAvatars: { data: OwnedAvatarPage } = {
  data: {
    content: [
      {
        avatarId: 'aaaaaaaa-0001-4000-8000-000000000001',
        name: 'hyunwoo',
        hashtag: 'HW4K7Z',
        color: '67C4F2',
        description: '조용한 카페에서 책 읽는 걸 좋아해요',
        isPrimary: true,
        isVisible: true,
        tags: ['독서', '카페투어'],
        canJoinSimulation: true,
      },
      {
        avatarId: 'aaaaaaaa-0002-4000-8000-000000000002',
        name: 'hyun_night',
        hashtag: 'HN8R2Q',
        color: 'E887B6',
        description: '밤 산책과 재즈를 좋아해요',
        isPrimary: false,
        isVisible: true,
        tags: ['재즈'],
        canJoinSimulation: false,
      },
      {
        avatarId: 'aaaaaaaa-0003-4000-8000-000000000003',
        name: 'hyunsoft',
        hashtag: 'HS3M9P',
        color: '2451A9',
        description: '',
        isPrimary: false,
        isVisible: false,
        tags: [],
        canJoinSimulation: true,
      },
    ],
    hasNext: false,
  },
};

const allBusyOwnedAvatars: OwnedAvatarPage = {
  ...mockOwnedAvatars.data,
  content: mockOwnedAvatars.data.content.map((avatar) => ({ ...avatar, canJoinSimulation: false })),
};

export const ownedAvatarsHandlers = {
  success: http.get(MY_AVATARS_URL, () => HttpResponse.json(mockOwnedAvatars)),

  empty: http.get(MY_AVATARS_URL, () =>
    HttpResponse.json({ data: { content: [], hasNext: false } })
  ),

  allBusy: http.get(MY_AVATARS_URL, () => HttpResponse.json({ data: allBusyOwnedAvatars })),

  serverError: http.get(MY_AVATARS_URL, () =>
    HttpResponse.json(
      { code: 'COMMON_500_001', message: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  ),
};

export const ownedAvatarsDefaultHandlers = [ownedAvatarsHandlers.success];
