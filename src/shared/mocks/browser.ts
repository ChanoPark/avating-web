import { setupWorker } from 'msw/browser';
import { authHandlers } from './handlers/auth';
import { dashboardHandlers } from './handlers/dashboard';

export const worker = setupWorker(...authHandlers, ...dashboardHandlers);
