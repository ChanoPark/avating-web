import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { ONBOARDING_FALLBACK_LABELS } from '@entities/onboarding';

// 디자인 시스템 v2.1 WizardShell — Stripe Checkout 식 2단 구조.
// 정본: .claude/design/2026-07-26-wireframe-v2/LAYOUT-NUMBERS.md § WizardShell.
// 좌측 스텝 레일이 화면에서 유일한 틴트면이고, 우측 폼 페인은 흰 배경 위에 카드를 띄운다.
// 진행 상태는 레일이 전담한다 — 카드 아이브로우의 `STEP n / 4` 중복 표기는 v2.1 에서 제거됐다.

/** 레일 라벨은 entity 가 단일 출처다 (정본 `wf/wf-kit.jsx` 의 `ONB_STEPS`). */
const RAIL_LABELS = ONBOARDING_FALLBACK_LABELS;

type StepState = 'done' | 'current' | 'upcoming';

const STEP_STATE_LABEL: Record<StepState, string> = {
  done: '완료',
  current: '진행 중',
  upcoming: '예정',
};

// 완료 = 파란 체크 원 · 현재 = 파란 링 + wash 후광 · 예정 = hairline 원.
const MARKER_STYLE: Record<StepState, string> = {
  done: 'bg-primary text-on-primary',
  current: 'bg-surface border-primary text-primary border shadow-[0_0_0_4px_var(--primary-wash)]',
  upcoming: 'bg-surface border-hairline text-ink-mute border',
};

const LABEL_STYLE: Record<StepState, string> = {
  done: 'text-ink-secondary',
  current: 'text-ink font-medium',
  upcoming: 'text-ink-mute',
};

function stepStateOf(index: number, currentStep: number): StepState {
  if (index + 1 < currentStep) return 'done';
  if (index + 1 === currentStep) return 'current';
  return 'upcoming';
}

/**
 * 현재 단계의 라벨만 경로에서 받아 덮는다. Step 3 은 설문(`성향 설문`)과
 * Bot 연동(`ChatGPT Bot 대화`) 두 경로가 공유하는데, 레일이 fallback 만 그리면
 * Bot 연동 중에도 `성향 설문 진행 중` 이 뜬다(실서버 QA S8-3).
 */
function railLabels(currentStep: number, currentStepLabel: string | undefined): readonly string[] {
  if (currentStepLabel === undefined) return RAIL_LABELS;
  return RAIL_LABELS.map((label, index) => (index === currentStep - 1 ? currentStepLabel : label));
}

function StepRail({
  currentStep,
  currentStepLabel,
  note,
}: {
  currentStep: number;
  currentStepLabel?: string;
  note?: string;
}) {
  const labels = railLabels(currentStep, currentStepLabel);

  return (
    <nav
      aria-label="온보딩 단계"
      className={cn(
        'bg-canvas border-hairline flex shrink-0 items-center gap-3 border-b px-5 py-4',
        'md:w-[232px] md:flex-col md:items-stretch md:gap-0 md:border-r md:border-b-0 md:px-7 md:py-8'
      )}
    >
      {/* 로고 마크 — 정사각 18, radius = 18 × 0.28 / 워드마크 = 18 × 0.78, weight 500. */}
      <div className="hidden items-center gap-2 md:flex">
        <span
          aria-hidden="true"
          className="bg-primary h-[18px] w-[18px] shrink-0 rounded-[5.04px]"
        />
        <span className="text-ink text-[14.04px] font-medium tracking-[-0.4px]">Avating</span>
      </div>

      <ol className="flex flex-1 items-center md:mt-7 md:flex-none md:flex-col md:items-stretch">
        {labels.map((label, index) => {
          const state = stepStateOf(index, currentStep);
          return (
            <li
              key={label}
              {...(state === 'current' ? { 'aria-current': 'step' as const } : {})}
              className={cn(
                // 스텝 사이 커넥터 — 가로(모바일)에서는 원 사이를 잇는 선, 세로(데스크톱)에서는
                // 원 아래로 내려가는 선. 지나온 구간만 파랗게 채운다.
                'relative flex flex-1 items-center gap-2.5 last:flex-none',
                "after:bg-hairline after:block after:h-px after:flex-1 after:content-[''] last:after:hidden",
                'md:flex-none md:gap-3 md:pb-5 md:last:pb-0',
                'md:after:absolute md:after:top-[26px] md:after:left-[10.5px] md:after:h-[calc(100%-26px)] md:after:w-px md:after:flex-none',
                state === 'done' && 'after:bg-primary'
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'text-micro tnum flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full',
                  MARKER_STYLE[state]
                )}
              >
                {state === 'done' ? <Check size={11} strokeWidth={1.5} /> : index + 1}
              </span>
              <span className={cn('text-caption sr-only md:not-sr-only', LABEL_STYLE[state])}>
                {label}
              </span>
              <span className="sr-only">{STEP_STATE_LABEL[state]}</span>
            </li>
          );
        })}
      </ol>

      {note !== undefined && (
        <p className="text-micro text-ink-mute hidden leading-[1.5] md:mt-auto md:block">{note}</p>
      )}
    </nav>
  );
}

/**
 * 폼 카드 폭 — 정본 `Page` 는 `maxWidth = max(max, 440) + 88` 로 계산한다
 * (`.claude/design/2026-08-18-wireframe-v2.5/wf/wf-kit.jsx`).
 * `default` = max 460 → 548 · `wide` = max 780 → 868 (S-02-01 환영의 방법 카드 3열).
 */
const FORM_MAX_WIDTH = {
  default: 'max-w-[548px]',
  wide: 'max-w-[868px]',
} as const;

type WizardShellProps = {
  /** 1~4 = 레일 있는 형태, null = 레일 없는 플랫 형태(S-02-01 환영). */
  currentStep: 1 | 2 | 3 | 4 | null;
  /** 현재 경로의 라벨. 같은 단계를 공유하는 경로(설문 / Bot 연동)를 구분한다. */
  currentStepLabel?: string;
  /**
   * 각주 — 화면마다 다르고 없는 화면도 있다. 레일이 있으면 레일 하단에,
   * 플랫 형태에서는 정본대로 폼 카드 **바깥 아래**에 가운데 정렬로 붙는다.
   */
  note?: string;
  /** 폼 카드 폭. 기본값은 정본 `Page` 의 `max=460`. */
  formWidth?: keyof typeof FORM_MAX_WIDTH;
  /** 스텝 전환 애니메이션 키 — 라우트 경로. */
  animationKey: string;
  children: ReactNode;
};

export function WizardShell({
  currentStep,
  currentStepLabel,
  note,
  formWidth = 'default',
  animationKey,
  children,
}: WizardShellProps) {
  const hasRail = currentStep !== null;

  return (
    <div className="bg-surface text-ink flex min-h-screen flex-col md:flex-row">
      {hasRail && (
        <StepRail
          currentStep={currentStep}
          {...(currentStepLabel !== undefined ? { currentStepLabel } : {})}
          {...(note !== undefined ? { note } : {})}
        />
      )}

      {/* 폼 페인 — 레일 있는 형태 padding `48px 40px`, 플랫 형태 `56px 40px`. 둘 다 가운데 정렬. */}
      <main
        className={cn(
          'flex min-w-0 flex-1 flex-col items-center justify-center overflow-y-auto px-10',
          hasRail ? 'py-12' : 'py-14'
        )}
      >
        {/* enter-only 전환: key 변경 시 새 스텝이 즉시 마운트되며 진입 애니메이션만 재생한다.
            AnimatePresence mode="wait" 의 exit 지연을 제거해 클릭 즉시 목적지가 표시된다. */}
        <motion.div
          key={animationKey}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
          // 폼 카드 — 흰 서피스 + hairline + 옅은 중립 그림자. 폭은 화면이 정한다.
          className={cn(
            'bg-surface border-hairline shadow-card flex w-full flex-col overflow-hidden rounded-xl border',
            FORM_MAX_WIDTH[formWidth]
          )}
        >
          {children}
        </motion.div>

        {/* 플랫 형태의 각주는 카드 아래 16px, 가운데 정렬 (정본 `Page` 의 `!steps` 분기).
            레일이 있는 화면에서는 같은 값이 레일 하단으로 간다. */}
        {!hasRail && note !== undefined && (
          <p className="text-micro text-ink-mute mt-4 text-center text-pretty">{note}</p>
        )}
      </main>
    </div>
  );
}
