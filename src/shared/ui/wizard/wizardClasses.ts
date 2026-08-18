/* 위저드 셸의 시각 계약 (디자인 시스템 v2.1).
   정본: .claude/design/2026-07-26-wireframe-v2/LAYOUT-NUMBERS.md § WizardShell

   `shared` 에 두는 이유: 위저드 스텝은 `pages/onboarding/*` 와 `features/{persona-survey,
   connect-code, onboarding-complete}` 양쪽에 걸쳐 있다. `features → pages` 는
   eslint-plugin-boundaries 가 막지만 **`shared` 는 두 층 모두에서 import 가능**하므로
   여기가 유일하게 중복 없이 공유되는 자리다. (한때 세 feature 파일이 "boundaries 가
   막아 복제한다" 는 잘못된 주석과 함께 같은 리터럴을 복제하고 있었다.) */

/** 폼 카드 본문 — padding `34px 44px 28px`, gap 18. */
export const WIZARD_BODY = 'flex flex-col gap-[18px] px-11 pt-[34px] pb-7';

/** 레일 없는 플랫 형태(S-02-01 환영) 본문 — padding `38px 44px 30px`, gap 18. */
export const WIZARD_BODY_FLAT = 'flex flex-col gap-[18px] px-11 pt-[38px] pb-[30px]';

/** 액션 바 — padding `16px 44px`, 상단 1px hairline, `--canvas-soft`. */
export const WIZARD_ACTIONS =
  'border-hairline bg-canvas-soft flex items-center justify-between gap-3 border-t px-11 py-4';

/** 헤드 블록 — gap 7 (Eyebrow + 제목 + 서브). */
export const WIZARD_HEAD = 'flex flex-col gap-[7px]';
