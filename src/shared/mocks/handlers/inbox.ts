import { http, HttpResponse } from 'msw';
import type { InboxItem } from '@entities/inbox';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const mockInboxItems: InboxItem[] = [
  {
    id: 'inbox-1',
    sender: { initials: 'MN', name: 'Moonlit Narrator' },
    message: '내 아바타에 호감을 표시했어요',
    occurredAt: '2026-05-14T07:50:00+09:00',
    read: false,
  },
  {
    id: 'inbox-2',
    sender: { initials: 'SP', name: 'spring_light' },
    message: '내 아바타에 호감을 표시했어요',
    occurredAt: '2026-05-14T07:48:00+09:00',
    read: false,
  },
  {
    id: 'inbox-3',
    sender: { initials: 'RB', name: 'red_bean' },
    message: '호감도 80 달성!',
    occurredAt: '2026-05-14T07:36:00+09:00',
    read: true,
  },
];

export const inboxHandlers = [
  http.get(`${BASE_URL}/api/inbox`, () => {
    const unreadCount = mockInboxItems.filter((item) => !item.read).length;
    return HttpResponse.json({ data: { items: mockInboxItems, unreadCount } });
  }),
];

export const inboxScenarios = {
  success: http.get(`${BASE_URL}/api/inbox`, () => {
    const unreadCount = mockInboxItems.filter((item) => !item.read).length;
    return HttpResponse.json({ data: { items: mockInboxItems, unreadCount } });
  }),
  empty: http.get(`${BASE_URL}/api/inbox`, () => {
    return HttpResponse.json({ data: { items: [], unreadCount: 0 } });
  }),
  error: http.get(`${BASE_URL}/api/inbox`, () => {
    return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
  }),
};
