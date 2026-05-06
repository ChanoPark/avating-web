export const matchRequestKeys = {
  all: ['match-request'] as const,
  myAvatars: () => [...matchRequestKeys.all, 'my-avatars'] as const,
  sent: () => [...matchRequestKeys.all, 'sent'] as const,
};
