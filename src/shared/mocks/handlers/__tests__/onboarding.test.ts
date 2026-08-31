import { describe, it, expect } from 'vitest';
import { server } from '@shared/mocks/server';
import {
  surveyQuestionsHandlers,
  surveySubmitHandlers,
  connectCodeHandlers,
  connectStatusHandlers,
  mockSurveyQuestionsResponse,
  mockConnectCodeResponse,
  mockConnectStatusConnected,
} from '../onboarding';
import {
  apiResponseConnectCode,
  apiResponseConnectStatus,
  apiResponseSurveyQuestionsSchema,
} from '@entities/onboarding/model';
import { apiResponseAvatarSummary } from '@entities/avatar';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

describe('onboarding MSW 핸들러', () => {
  describe('GET /api/persona/survey/questions', () => {
    it('success 핸들러는 200 + 질문 배열을 반환한다', async () => {
      server.use(surveyQuestionsHandlers.success);

      const res = await fetch(`${BASE_URL}/api/persona/survey/questions`);

      expect(res.status).toBe(200);
      const json = await res.json();
      const parsed = apiResponseSurveyQuestionsSchema.safeParse(json);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.data.length).toBeGreaterThan(0);
        expect(parsed.data.data[0].questionType).toBe('SINGLE_CHOICE_5');
      }
    });

    it('success 응답 데이터는 mockSurveyQuestionsResponse 와 일치한다', async () => {
      server.use(surveyQuestionsHandlers.success);

      const res = await fetch(`${BASE_URL}/api/persona/survey/questions`);
      const json = await res.json();

      expect(json.data[0].id).toBe(mockSurveyQuestionsResponse.data[0].id);
      expect(json.data[0].answers.length).toBe(5);
    });

    it('serverError 핸들러는 500 을 반환한다', async () => {
      server.use(surveyQuestionsHandlers.serverError);

      const res = await fetch(`${BASE_URL}/api/persona/survey/questions`);

      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/avatars/survey', () => {
    it('success 핸들러는 201 + AvatarSummaryResponse 를 반환하고 요청의 이름·소개를 되울린다', async () => {
      server.use(surveySubmitHandlers.success);

      const res = await fetch(`${BASE_URL}/api/avatars/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarName: '루나',
          description: '소개글',
          answers: [
            { questionId: 'Q_001', questionType: 'SINGLE_CHOICE_5', answerId: 'Q_001_ANS_1' },
          ],
        }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      const parsed = apiResponseAvatarSummary.safeParse(json);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.data.name).toBe('루나');
        expect(parsed.data.data.description).toBe('소개글');
        expect(Object.keys(parsed.data.data.stats)).toHaveLength(7);
      }
    });

    it('validationError 핸들러는 400 을 반환한다', async () => {
      server.use(surveySubmitHandlers.validationError);

      const res = await fetch(`${BASE_URL}/api/avatars/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('serverError 핸들러는 500 을 반환한다', async () => {
      server.use(surveySubmitHandlers.serverError);

      const res = await fetch(`${BASE_URL}/api/avatars/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });

      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/persona/connect/code', () => {
    it('success 핸들러는 201 + ConnectCode 를 반환한다', async () => {
      server.use(connectCodeHandlers.success);

      const res = await fetch(`${BASE_URL}/api/persona/connect/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      const parsed = apiResponseConnectCode.safeParse(json);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.data.connectCode).toBe(mockConnectCodeResponse.data.connectCode);
      }
    });

    it('success 응답의 connectCode 는 mockConnectCodeResponse 와 일치한다', async () => {
      server.use(connectCodeHandlers.success);

      const res = await fetch(`${BASE_URL}/api/persona/connect/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });

      const json = await res.json();
      expect(json.data.connectCode).toBe(mockConnectCodeResponse.data.connectCode);
    });

    it('rateLimit 핸들러는 429 를 반환한다', async () => {
      server.use(connectCodeHandlers.rateLimit);

      const res = await fetch(`${BASE_URL}/api/persona/connect/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });

      expect(res.status).toBe(429);
      const json = await res.json();
      expect(json).toHaveProperty('code', 'RATE_LIMIT_EXCEEDED');
    });
  });

  describe('GET /api/onboarding/connect-status', () => {
    it('active 핸들러는 200 + status: active 를 반환한다', async () => {
      server.use(connectStatusHandlers.active);

      const res = await fetch(`${BASE_URL}/api/onboarding/connect-status`);

      expect(res.status).toBe(200);
      const json = await res.json();
      const parsed = apiResponseConnectStatus.safeParse(json);
      expect(parsed.success).toBe(true);
      expect(json.data.status).toBe('active');
    });

    it('connected 핸들러는 200 + status: connected 를 반환한다', async () => {
      server.use(connectStatusHandlers.connected);

      const res = await fetch(`${BASE_URL}/api/onboarding/connect-status`);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual(mockConnectStatusConnected);
    });

    it('expired 핸들러는 200 + status: expired 를 반환한다', async () => {
      server.use(connectStatusHandlers.expired);

      const res = await fetch(`${BASE_URL}/api/onboarding/connect-status`);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('expired');
    });

    it('notFound 핸들러는 404 를 반환한다', async () => {
      server.use(connectStatusHandlers.notFound);

      const res = await fetch(`${BASE_URL}/api/onboarding/connect-status`);

      expect(res.status).toBe(404);
    });
  });

  describe('onboardingHandlers 기본 export', () => {
    it('4개 핸들러로 구성되어 있다 (onboarding/avatar 는 생성 응답 재사용, onboarding/complete 는 미호출로 폐지)', async () => {
      const { onboardingHandlers } = await import('../onboarding');
      expect(onboardingHandlers).toHaveLength(4);
    });
  });
});
