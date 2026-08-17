import { setupWorker } from 'msw/browser';
import { authHandlers } from './handlers/auth';
import { dashboardHandlers } from './handlers/dashboard';
import { onboardingHandlers } from './handlers/onboarding';
import { matchRequestHandlers } from './handlers/matchRequest';
import { inboxHandlers } from './handlers/inbox';
import { avatarDetailHandlers } from './handlers/avatarDetail';
import { primaryAvatarDefaultHandlers } from './handlers/primaryAvatar';

// server.ts(테스트용)와 **같은 핸들러 집합**을 유지한다. 한쪽에만 등록하면
// vitest 는 통과하는데 브라우저에서만 실 백엔드로 passthrough 되는 사각지대가 생긴다
// — 실제로 onboardingHandlers 가 여기 빠져 있어 브라우저에서 온보딩 API 가 401 을
// 받고 로그아웃 → /login 으로 튕겼고, 테스트는 server.ts 를 쓰므로 못 잡았다.
export const worker = setupWorker(
  ...authHandlers,
  ...dashboardHandlers,
  ...onboardingHandlers,
  ...matchRequestHandlers,
  ...inboxHandlers,
  ...avatarDetailHandlers,
  ...primaryAvatarDefaultHandlers
);
