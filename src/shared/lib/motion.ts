/**
 * motion/react 용 모션 상수 — `app/styles/codex/tokens/motion.css` 의 CSS 변수를 그대로 옮긴 것.
 *
 * JS 애니메이션은 CSS 변수를 읽지 못하므로 값을 중복해서 들고 있어야 한다. 세 곳(PageTransition ·
 * AppShellLayout · WizardShell)이 각자 숫자를 적어 두는 바람에 0.18s/0.2s/0.16s 와
 * `[0.25,0.1,0.25,1]`(CSS `ease` 기본값) 처럼 **토큰에 없는 값**으로 갈라져 있었다.
 * 토큰이 바뀌면 여기 한 곳만 고친다.
 */

/* --dur-fast(100ms)는 JS 애니메이션 쪽 소비처가 없다 — hover 전이는 전부 CSS 라
   `duration-[var(--dur-fast)]` 로 토큰을 직접 읽는다. 필요해지면 그때 더한다. */

/** --dur-base 150ms */
export const DUR_BASE = 0.15;
/** --dur-slow 220ms */
export const DUR_SLOW = 0.22;

/** --ease-standard cubic-bezier(.2,.6,.25,1) */
export const EASE_STANDARD = [0.2, 0.6, 0.25, 1] as const;
/** --ease-out cubic-bezier(.16,.84,.34,1) */
export const EASE_OUT = [0.16, 0.84, 0.34, 1] as const;
