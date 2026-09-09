// 위저드 스텝은 pages/onboarding/* 와
// features/{persona-survey, connect-code, onboarding-complete} 양쪽에 걸쳐 쓰인다 —
// features→pages import 는 eslint-plugin-boundaries 가 막지만 shared 는 두 층 모두에서
// 쓸 수 있어 여기가 유일한 공유 지점이다. 복제하지 않는다.

export const WIZARD_BODY = 'flex flex-col gap-[18px] px-11 pt-[34px] pb-7';

/** 레일 없는 플랫 형태(S-02-01 환영)용 — WIZARD_BODY 대신 이걸 쓴다. */
export const WIZARD_BODY_FLAT = 'flex flex-col gap-[18px] px-11 pt-[38px] pb-[30px]';

export const WIZARD_ACTIONS =
  'border-subtle bg-surface flex items-center justify-between gap-3 border-t px-11 py-4';

export const WIZARD_HEAD = 'flex flex-col gap-[7px]';
