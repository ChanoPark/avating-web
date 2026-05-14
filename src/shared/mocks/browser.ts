import { setupWorker } from 'msw/browser';
import { authHandlers } from './handlers/auth';
import { dashboardHandlers } from './handlers/dashboard';
import { matchRequestHandlers } from './handlers/matchRequest';
import { inboxHandlers } from './handlers/inbox';

export const worker = setupWorker(
  ...authHandlers,
  ...dashboardHandlers,
  ...matchRequestHandlers,
  ...inboxHandlers
);
