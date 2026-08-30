import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth';
import { dashboardHandlers } from './handlers/dashboard';
import { onboardingHandlers } from './handlers/onboarding';
import { matchRequestHandlers } from './handlers/matchRequest';
import { inboxHandlers } from './handlers/inbox';
import { avatarDetailHandlers } from './handlers/avatarDetail';
import { primaryAvatarDefaultHandlers } from './handlers/primaryAvatar';

export const server = setupServer(
  ...authHandlers,
  ...dashboardHandlers,
  ...onboardingHandlers,
  ...matchRequestHandlers,
  ...inboxHandlers,
  // /api/avatars/primary 가 /api/avatars/:id 보다 먼저 와야 한다 — MSW 는 등록 순서로
  // 매칭하므로 detail 이 앞서면 :id=primary 를 삼켜 detail 응답이 내려온다.
  ...primaryAvatarDefaultHandlers,
  ...avatarDetailHandlers
);

server.events.on('request:unhandled', ({ request }) => {
  throw new Error(
    `[MSW] 핸들러 없는 요청: ${request.method} ${request.url}\nvitest.config.ts의 test.env.VITE_API_BASE_URL 과 핸들러 BASE_URL 이 일치하는지 확인하세요.`
  );
});
