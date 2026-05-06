import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth';
import { dashboardHandlers } from './handlers/dashboard';
import { onboardingHandlers } from './handlers/onboarding';
import { matchRequestHandlers } from './handlers/matchRequest';

export const server = setupServer(
  ...authHandlers,
  ...dashboardHandlers,
  ...onboardingHandlers,
  ...matchRequestHandlers
);

server.events.on('request:unhandled', ({ request }) => {
  throw new Error(
    `[MSW] 핸들러 없는 요청: ${request.method} ${request.url}\nvitest.config.ts의 test.env.VITE_API_BASE_URL 과 핸들러 BASE_URL 이 일치하는지 확인하세요.`
  );
});
