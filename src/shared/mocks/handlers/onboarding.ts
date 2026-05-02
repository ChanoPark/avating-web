import { http, HttpResponse } from 'msw';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const mockSurveySubmitResponse = {
  data: { avatarId: 'avatar-generated-001' },
};

export const mockSurveyDraftResponse = {
  data: { savedAt: '2026-05-01T12:00:00.000Z' },
};

export const mockConnectCodeResponse = {
  data: {
    code: 'AVT-A1B2-C3',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    status: 'active' as const,
  },
};

export const mockConnectStatusActive = {
  data: { status: 'active' as const },
};

export const mockConnectStatusConnected = {
  data: { status: 'connected' as const },
};

export const mockConnectStatusExpired = {
  data: { status: 'expired' as const },
};

export const mockGeneratedAvatar = {
  data: {
    initials: 'LN',
    name: '루나',
    handle: '@luna_av',
    level: 3,
    type: '내향 · 분석형',
    stats: {
      extroversion: 30,
      sensitivity: 75,
      enthusiasm: 60,
      dateStyle: 85,
    },
    tags: ['독서', '카페투어', '음악감상', '전시관람'],
  },
};

export const mockCompleteOnboardingResponse = {
  data: { completedAt: '2026-05-01T12:00:00.000Z' },
};

export const surveyHandlers = {
  success: http.post(`${BASE_URL}/api/onboarding/survey`, () => {
    return HttpResponse.json(mockSurveySubmitResponse, { status: 201 });
  }),

  validationError: http.post(`${BASE_URL}/api/onboarding/survey`, () => {
    return HttpResponse.json(
      {
        message: '설문 답변이 올바르지 않습니다.',
        code: 'VALIDATION_ERROR',
        field: 'q1',
      },
      { status: 422 }
    );
  }),

  serverError: http.post(`${BASE_URL}/api/onboarding/survey`, () => {
    return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
  }),
};

export const surveyDraftHandlers = {
  success: http.patch(`${BASE_URL}/api/onboarding/survey/draft`, () => {
    return HttpResponse.json(mockSurveyDraftResponse, { status: 200 });
  }),

  serverError: http.patch(`${BASE_URL}/api/onboarding/survey/draft`, () => {
    return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
  }),
};

export const connectCodeHandlers = {
  success: http.post(`${BASE_URL}/api/onboarding/connect-code`, () => {
    return HttpResponse.json(
      {
        data: {
          ...mockConnectCodeResponse.data,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        },
      },
      { status: 201 }
    );
  }),

  rateLimit: http.post(`${BASE_URL}/api/onboarding/connect-code`, () => {
    return HttpResponse.json(
      { message: '잠시 후 다시 시도해주세요.', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429 }
    );
  }),

  serverError: http.post(`${BASE_URL}/api/onboarding/connect-code`, () => {
    return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
  }),
};

export const connectStatusHandlers = {
  active: http.get(`${BASE_URL}/api/onboarding/connect-status`, () => {
    return HttpResponse.json(mockConnectStatusActive);
  }),

  connected: http.get(`${BASE_URL}/api/onboarding/connect-status`, () => {
    return HttpResponse.json(mockConnectStatusConnected);
  }),

  expired: http.get(`${BASE_URL}/api/onboarding/connect-status`, () => {
    return HttpResponse.json(mockConnectStatusExpired);
  }),

  notFound: http.get(`${BASE_URL}/api/onboarding/connect-status`, () => {
    return HttpResponse.json({ message: '코드를 찾을 수 없습니다.' }, { status: 404 });
  }),
};

export const generatedAvatarHandlers = {
  success: http.get(`${BASE_URL}/api/onboarding/avatar`, () => {
    return HttpResponse.json(mockGeneratedAvatar);
  }),

  notFound: http.get(`${BASE_URL}/api/onboarding/avatar`, () => {
    return HttpResponse.json({ message: '아바타를 찾을 수 없습니다.' }, { status: 404 });
  }),

  serverError: http.get(`${BASE_URL}/api/onboarding/avatar`, () => {
    return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
  }),
};

export const completeOnboardingHandlers = {
  success: http.post(`${BASE_URL}/api/onboarding/complete`, () => {
    return HttpResponse.json(mockCompleteOnboardingResponse);
  }),

  conflict: http.post(`${BASE_URL}/api/onboarding/complete`, () => {
    return HttpResponse.json(
      { message: '이미 온보딩이 완료되었습니다.', code: 'ONBOARDING_ALREADY_COMPLETED' },
      { status: 409 }
    );
  }),

  serverError: http.post(`${BASE_URL}/api/onboarding/complete`, () => {
    return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
  }),
};

export const onboardingHandlers = [
  surveyHandlers.success,
  surveyDraftHandlers.success,
  connectCodeHandlers.success,
  connectStatusHandlers.active,
  generatedAvatarHandlers.success,
  completeOnboardingHandlers.success,
];
