export const onboardingKeys = {
  all: ['onboarding'] as const,
  survey: () => [...onboardingKeys.all, 'survey'] as const,
  connectCode: () => [...onboardingKeys.all, 'connect-code'] as const,
  connectStatus: (code: string) => [...onboardingKeys.all, 'connect-status', code] as const,
  avatar: () => [...onboardingKeys.all, 'avatar'] as const,
};
