export const matchRequestKeys = {
  all: ['match-request'] as const,
  sent: () => [...matchRequestKeys.all, 'sent'] as const,
  sessions: () => [...matchRequestKeys.all, 'sessions'] as const,
  receivedPending: () => [...matchRequestKeys.all, 'received-pending'] as const,
};
