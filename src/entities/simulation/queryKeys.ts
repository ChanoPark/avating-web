export const simulationKeys = {
  all: ['simulation'] as const,
  turns: (sessionId: string) => [...simulationKeys.all, 'turns', sessionId] as const,
};
