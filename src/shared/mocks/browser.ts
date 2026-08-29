import { setupWorker } from 'msw/browser';
import { authHandlers } from './handlers/auth';
import { dashboardHandlers } from './handlers/dashboard';
import { onboardingHandlers } from './handlers/onboarding';
import { matchRequestHandlers } from './handlers/matchRequest';
import { inboxHandlers } from './handlers/inbox';
import { avatarDetailHandlers } from './handlers/avatarDetail';
import { primaryAvatarDefaultHandlers } from './handlers/primaryAvatar';

// server.ts(테스트용)와 같은 핸들러 집합을 유지한다 — 한쪽만 등록하면 vitest 는 통과해도
// 브라우저에서는 실 백엔드로 새는 사각지대가 생긴다.
export const worker = setupWorker(
  ...authHandlers,
  ...dashboardHandlers,
  ...onboardingHandlers,
  ...matchRequestHandlers,
  ...inboxHandlers,
  ...avatarDetailHandlers,
  ...primaryAvatarDefaultHandlers
);
