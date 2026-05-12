import { describe, it, expect } from 'vitest';
import { server } from '@shared/mocks/server';
import {
  surveyQuestionsHandlers,
  surveySubmitHandlers,
  connectCodeHandlers,
  connectStatusHandlers,
  generatedAvatarHandlers,
  completeOnboardingHandlers,
  mockSurveyQuestionsResponse,
  mockConnectCodeResponse,
  mockConnectStatusConnected,
  mockGeneratedAvatar,
  mockCompleteOnboardingResponse,
} from '../onboarding';
import {
  apiResponseConnectCode,
  apiResponseConnectStatus,
  apiResponseGeneratedAvatar,
  apiResponseSurveyQuestionsSchema,
} from '@entities/onboarding/model';

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
    it('success 핸들러는 201 을 반환한다', async () => {
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

  describe('GET /api/onboarding/avatar', () => {
    it('success 핸들러는 200 + GeneratedAvatar 를 반환한다', async () => {
      server.use(generatedAvatarHandlers.success);

      const res = await fetch(`${BASE_URL}/api/onboarding/avatar`);

      expect(res.status).toBe(200);
      const json = await res.json();
      const parsed = apiResponseGeneratedAvatar.safeParse(json);
      expect(parsed.success).toBe(true);
    });

    it('success 응답 데이터는 mockGeneratedAvatar 와 일치한다', async () => {
      server.use(generatedAvatarHandlers.success);

      const res = await fetch(`${BASE_URL}/api/onboarding/avatar`);
      const json = await res.json();

      expect(json.data.name).toBe(mockGeneratedAvatar.data.name);
      expect(json.data.tags.length).toBeGreaterThan(0);
      expect(json.data.tags.length).toBeLessThanOrEqual(6);
    });

    it('notFound 핸들러는 404 를 반환한다', async () => {
      server.use(generatedAvatarHandlers.notFound);

      const res = await fetch(`${BASE_URL}/api/onboarding/avatar`);

      expect(res.status).toBe(404);
    });

    it('serverError 핸들러는 500 을 반환한다', async () => {
      server.use(generatedAvatarHandlers.serverError);

      const res = await fetch(`${BASE_URL}/api/onboarding/avatar`);

      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/onboarding/complete', () => {
    it('success 핸들러는 200 + completedAt 을 반환한다', async () => {
      server.use(completeOnboardingHandlers.success);

      const res = await fetch(`${BASE_URL}/api/onboarding/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual(mockCompleteOnboardingResponse);
      expect(new Date(json.data.completedAt).getTime()).not.toBeNaN();
    });

    it('conflict 핸들러는 409 를 반환한다', async () => {
      server.use(completeOnboardingHandlers.conflict);

      const res = await fetch(`${BASE_URL}/api/onboarding/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });

      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json).toHaveProperty('code', 'ONBOARDING_ALREADY_COMPLETED');
    });
  });

  describe('onboardingHandlers 기본 export', () => {
    it('6개 핸들러로 구성되어 있다', async () => {
      const { onboardingHandlers } = await import('../onboarding');
      expect(onboardingHandlers).toHaveLength(6);
    });
  });
});
