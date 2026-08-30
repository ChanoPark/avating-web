import { http, HttpResponse } from 'msw';
import { z } from 'zod';

// endpoint prefix 가 두 갈래다 — 설문·아바타 생성은 /api/persona·avatars, 계정 라이프사이클
// (연결 상태·온보딩 완료)은 /api/onboarding 그대로다. 백엔드가 의도적으로 나눠 둔 것이라
// 하나로 통일하면 안 된다.
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
    connectCode: 'AVT-A1B2-C3',
    expiresIn: 600,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
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

// POST /api/avatars/survey 201 의 고정 부분 — name/description/tags 는 요청을 되울려
// 사용자가 입력한 값이 완료 화면에 그대로 보이게 한다.
export const mockCreatedAvatarSummaryBase = {
  schemaVersion: 1,
  avatarId: 'a2222222-2222-4222-8222-222222222222',
  stats: {
    OPENNESS: 72.5,
    IMAGINATION: 68,
    EXTROVERSION: 80,
    EMPATHY: 65,
    PLANNING_LEVEL: 45,
    HUMOROUS: 88,
    AFFECTION_EXPRESSION: 55,
  },
};

export const surveyQuestionsHandlers = {
  success: http.get(`${BASE_URL}/api/persona/survey/questions`, () => {
    return HttpResponse.json(mockSurveyQuestionsResponse);
  }),

  serverError: http.get(`${BASE_URL}/api/persona/survey/questions`, () => {
    return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
  }),
};

// 되울림에 필요한 필드만 loose 하게 받는다 — 요청 전체 검증은 서버 몫이고 mock 은 echo 만 한다.
const surveySubmitEchoSchema = z.object({
  avatarName: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const surveySubmitHandlers = {
  success: http.post(`${BASE_URL}/api/avatars/survey`, async ({ request }) => {
    const raw: unknown = await request.json();
    const body = surveySubmitEchoSchema.parse(raw);
    return HttpResponse.json(
      {
        data: {
          ...mockCreatedAvatarSummaryBase,
          name: body.avatarName ?? '루나',
          description: body.description ?? '',
          tags: body.tags ?? [],
        },
      },
      { status: 201 }
    );
  }),

  validationError: http.post(`${BASE_URL}/api/avatars/survey`, () => {
    return HttpResponse.json(
      { message: '설문 답변이 올바르지 않습니다.', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }),

  serverError: http.post(`${BASE_URL}/api/avatars/survey`, () => {
    return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
  }),
};

export const connectCodeHandlers = {
  success: http.post(`${BASE_URL}/api/persona/connect/code`, () => {
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

  rateLimit: http.post(`${BASE_URL}/api/persona/connect/code`, () => {
    return HttpResponse.json(
      { message: '잠시 후 다시 시도해주세요.', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429 }
    );
  }),

  serverError: http.post(`${BASE_URL}/api/persona/connect/code`, () => {
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

// POST /api/onboarding/complete 핸들러는 2026-08-30 제거 — 완료 버튼이 API 호출 없이
// 대시보드로 직행한다 (완료 판정의 정본은 대표 아바타 보유).

export const onboardingHandlers = [
  surveyQuestionsHandlers.success,
  surveySubmitHandlers.success,
  connectCodeHandlers.success,
  connectStatusHandlers.active,
];
