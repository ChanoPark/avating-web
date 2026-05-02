import { beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// userEvent.setup()이 navigator.clipboard를 stub getter로 교체하지 않도록 patch.
// 이렇게 하면 테스트의 Object.assign으로 설치한 spy가 userEvent.setup() 이후에도 유지된다.
const _origSetup = userEvent.setup.bind(userEvent);
(userEvent as unknown as { setup: typeof _origSetup }).setup = function (
  options?: Parameters<typeof _origSetup>[0]
) {
  const savedDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  const api = _origSetup(options);
  if (savedDescriptor) {
    Object.defineProperty(navigator, 'clipboard', savedDescriptor);
  }
  return api;
};

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    writable: true,
    value: { writeText: () => Promise.resolve(), readText: () => Promise.resolve('') },
  });
});
