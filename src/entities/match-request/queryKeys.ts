export const matchRequestKeys = {
  all: ['match-request'] as const,
  myAvatars: () => [...matchRequestKeys.all, 'my-avatars'] as const,
  received: () => [...matchRequestKeys.all, 'received'] as const,
  sent: () => [...matchRequestKeys.all, 'sent'] as const,
  detail: (id: string) => [...matchRequestKeys.all, 'detail', id] as const,
};
