import type { RequestHandler } from 'msw';
import { surveyQuestionsHandlers } from './handlers/onboarding';
import { primaryAvatarHandlers } from './handlers/primaryAvatar';
import {
  invitationRejectHandlers,
  mockManyReceivedInvitations,
  mockNoReceivedPendingInvitations,
  seedInvitationHistory,
} from './handlers/invitationHistory';

// ?mock= 이 빠진 주소로 새로고침해도 유지되도록 sessionStorage 에 둔다.
const STORAGE_KEY = 'avating:mock-scenarios';
const OFF = 'off';

type Scenario = { handlers?: RequestHandler[]; seed?: () => void };

const SCENARIOS: Record<string, Scenario> = {
  'survey-empty': {
    handlers: [surveyQuestionsHandlers.empty, primaryAvatarHandlers.none],
  },
  'many-requests': {
    seed: () => {
      seedInvitationHistory(mockManyReceivedInvitations);
    },
  },
  'no-requests': {
    seed: () => {
      seedInvitationHistory(mockNoReceivedPendingInvitations);
    },
  },
  'reject-error': { handlers: [invitationRejectHandlers.serverError] },
  'reject-processed': { handlers: [invitationRejectHandlers.notPending] },
};

function readScenarioNames(): string[] {
  const fromQuery = new URLSearchParams(window.location.search).get('mock');
  try {
    if (fromQuery === OFF) {
      sessionStorage.removeItem(STORAGE_KEY);
      return [];
    }
    if (fromQuery !== null) sessionStorage.setItem(STORAGE_KEY, fromQuery);
    return (sessionStorage.getItem(STORAGE_KEY) ?? '').split(',').filter(Boolean);
  } catch {
    return fromQuery === null || fromQuery === OFF ? [] : fromQuery.split(',').filter(Boolean);
  }
}

export function activeMockScenarios(): { handlers: RequestHandler[]; names: string[] } {
  const names = readScenarioNames().filter((name) => Object.hasOwn(SCENARIOS, name));
  const scenarios = names.flatMap((name) => SCENARIOS[name] ?? []);
  scenarios.forEach((scenario) => scenario.seed?.());
  return { handlers: scenarios.flatMap((scenario) => scenario.handlers ?? []), names };
}
