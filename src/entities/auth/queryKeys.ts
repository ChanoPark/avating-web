export const authKeys = {
  all: ['auth'] as const,
  publicKey: () => [...authKeys.all, 'public-key'] as const,
};
