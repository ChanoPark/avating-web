import { http, HttpResponse } from 'msw';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const mockSurveyQuestionsResponse = {
  data: [
    {
      id: 'AFFECTION_EXPRESSION_0001',
      title: '오늘 만난 상대가 너무 내 이상형입니다. 첫 데이트가 끝날 무렵 당신의 호감 표현은?',
      primaryType: 'AFFECTION_EXPRESSION',
      questionType: 'SINGLE_CHOICE_5' as const,
      answers: [
        { answerId: 'AFFECTION_EXPRESSION_0001_ANS_1', text: '속으로만 생각하고 기다린다.' },
        { answerId: 'AFFECTION_EXPRESSION_0001_ANS_2', text: '기본 인사만 깍듯이 한다.' },
        { answerId: 'AFFECTION_EXPRESSION_0001_ANS_3', text: '우회적이지만 분명한 호감 표시' },
        { answerId: 'AFFECTION_EXPRESSION_0001_ANS_4', text: '구체적인 애프터 제안' },
        { answerId: 'AFFECTION_EXPRESSION_0001_ANS_5', text: '100% 직진 애정 표현' },
      ],
    },
    {
      id: 'EMPATHY_0001',
      title: '상대방이 "오늘 팀장님 때문에 너무 화가 났어!"라며 하소연할 때 당신의 반응은?',
      primaryType: 'EMPATHY',
      questionType: 'SINGLE_CHOICE_5' as const,
      answers: [
        { answerId: 'EMPATHY_0001_ANS_1', text: '무슨 상황이었는데? (상황 파악 우선)' },
        { answerId: 'EMPATHY_0001_ANS_2', text: '가벼운 위로와 추측' },
        { answerId: 'EMPATHY_0001_ANS_3', text: '위로와 기분 전환 제안' },
        { answerId: 'EMPATHY_0001_ANS_4', text: '상대방 편에서 같이 화내줌' },
        { answerId: 'EMPATHY_0001_ANS_5', text: '감정에 깊이 이입하며 진심으로 걱정함' },
      ],
    },
  ],
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

export const surveyQuestionsHandlers = {
  success: http.get(`${BASE_URL}/api/persona/survey/questions`, () => {
    return HttpResponse.json(mockSurveyQuestionsResponse);
  }),

  serverError: http.get(`${BASE_URL}/api/persona/survey/questions`, () => {
    return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
  }),
};

export const surveySubmitHandlers = {
  success: http.post(`${BASE_URL}/api/avatars/survey/`, () => {
    return HttpResponse.json({}, { status: 201 });
  }),

  validationError: http.post(`${BASE_URL}/api/avatars/survey/`, () => {
    return HttpResponse.json(
      { message: '설문 답변이 올바르지 않습니다.', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }),

  serverError: http.post(`${BASE_URL}/api/avatars/survey/`, () => {
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
  surveyQuestionsHandlers.success,
  surveySubmitHandlers.success,
  connectCodeHandlers.success,
  connectStatusHandlers.active,
  generatedAvatarHandlers.success,
  completeOnboardingHandlers.success,
];
