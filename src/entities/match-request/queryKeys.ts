export const matchRequestKeys = {
  all: ['match-request'] as const,
  sent: () => [...matchRequestKeys.all, 'sent'] as const,
};
