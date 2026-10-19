import { setupWorker } from 'msw/browser';
import { authHandlers } from './handlers/auth';
import { dashboardHandlers } from './handlers/dashboard';
import { onboardingHandlers } from './handlers/onboarding';
import { matchRequestHandlers } from './handlers/matchRequest';
import { invitationHistoryDefaultHandlers } from './handlers/invitationHistory';
import { simulationWatchDefaultHandlers } from './handlers/simulationWatch';
import { avatarDetailHandlers } from './handlers/avatarDetail';
import { primaryAvatarDefaultHandlers } from './handlers/primaryAvatar';
import { simCandidatesDefaultHandlers } from './handlers/avatarCandidates';
import { ownedAvatarsDefaultHandlers } from './handlers/ownedAvatars';
import { activeMockScenarios } from './scenarios';

const scenarios = activeMockScenarios();

// server.ts(테스트용)와 같은 핸들러 집합을 유지한다 — 한쪽만 등록하면 vitest 는 통과해도
// 브라우저에서는 실 백엔드로 새는 사각지대가 생긴다.
export const worker = setupWorker(
  ...scenarios.handlers,
  ...authHandlers,
  ...dashboardHandlers,
  ...onboardingHandlers,
  ...matchRequestHandlers,
  ...invitationHistoryDefaultHandlers,
  ...simulationWatchDefaultHandlers,
  // /api/avatars/primary · /candidates · /me 가 /api/avatars/:id 보다 먼저 와야 한다 — MSW 는 등록 순서로
  // 매칭하므로 detail 이 앞서면 :id=primary 를 삼켜 detail 응답이 내려온다.
  ...primaryAvatarDefaultHandlers,
  ...simCandidatesDefaultHandlers,
  ...ownedAvatarsDefaultHandlers,
  ...avatarDetailHandlers
);

if (scenarios.names.length > 0) {
  console.info(`[mock] scenarios: ${scenarios.names.join(', ')}`);
}
