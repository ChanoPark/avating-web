import { describe, it, expect } from 'vitest';
import { server } from '@shared/mocks/server';
import {
  surveyHandlers,
  surveyDraftHandlers,
  connectCodeHandlers,
  connectStatusHandlers,
  generatedAvatarHandlers,
  completeOnboardingHandlers,
  mockSurveySubmitResponse,
  mockConnectCodeResponse,
  mockConnectStatusConnected,
  mockGeneratedAvatar,
  mockCompleteOnboardingResponse,
} from '../onboarding';
import {
  apiResponseConnectCode,
  apiResponseConnectStatus,
  apiResponseGeneratedAvatar,
} from '@entities/onboarding/model';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

describe('onboarding MSW 핸들러', () => {
  describe('POST /api/onboarding/survey', () => {
    it('success 핸들러는 201 + avatarId 를 반환한다', async () => {
      server.use(surveyHandlers.success);

      const res = await fetch(`${BASE_URL}/api/onboarding/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q1: 'solo',
          q2: 'wait',
          q3: 'cafe',
          q4: 'brief',
          q5: 'calm',
          q6: 'conversation',
        }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json).toEqual(mockSurveySubmitResponse);
      expect(typeof json.data.avatarId).toBe('string');
      expect(json.data.avatarId.length).toBeGreaterThan(0);
    });

    it('validationError 핸들러는 422 를 반환한다', async () => {
      server.use(surveyHandlers.validationError);

      const res = await fetch(`${BASE_URL}/api/onboarding/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q1: 'invalid' }),
      });

      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('serverError 핸들러는 500 을 반환한다', async () => {
      server.use(surveyHandlers.serverError);

      const res = await fetch(`${BASE_URL}/api/onboarding/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });

      expect(res.status).toBe(500);
    });
  });

  describe('PATCH /api/onboarding/survey/draft', () => {
    it('success 핸들러는 200 + savedAt 을 반환한다', async () => {
      server.use(surveyDraftHandlers.success);

      const res = await fetch(`${BASE_URL}/api/onboarding/survey/draft`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q1: 'solo' }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toHaveProperty('savedAt');
      expect(new Date(json.data.savedAt).getTime()).not.toBeNaN();
    });

    it('serverError 핸들러는 500 을 반환한다', async () => {
      server.use(surveyDraftHandlers.serverError);

      const res = await fetch(`${BASE_URL}/api/onboarding/survey/draft`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });

      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/onboarding/connect-code', () => {
    it('success 핸들러는 201 + ConnectCode 를 반환한다', async () => {
      server.use(connectCodeHandlers.success);

      const res = await fetch(`${BASE_URL}/api/onboarding/connect-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      const parsed = apiResponseConnectCode.safeParse(json);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.data.code).toMatch(/^AVT-[A-Z0-9]{4}-[A-Z0-9]{2}$/);
      }
    });

    it('success 응답의 code 는 mockConnectCodeResponse 와 일치한다', async () => {
      server.use(connectCodeHandlers.success);

      const res = await fetch(`${BASE_URL}/api/onboarding/connect-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });

      const json = await res.json();
      expect(json.data.code).toBe(mockConnectCodeResponse.data.code);
    });

    it('rateLimit 핸들러는 429 를 반환한다', async () => {
      server.use(connectCodeHandlers.rateLimit);

      const res = await fetch(`${BASE_URL}/api/onboarding/connect-code`, {
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
