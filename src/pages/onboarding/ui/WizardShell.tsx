import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { ONBOARDING_FALLBACK_LABELS } from '@entities/onboarding';

// 진행 상태는 레일이 전담한다 — 카드 아이브로우에 단계를 중복 표기하지 않는다.

/** 레일 라벨은 entity 가 단일 출처다. */
const RAIL_LABELS = ONBOARDING_FALLBACK_LABELS;

type StepState = 'done' | 'current' | 'upcoming';

const STEP_STATE_LABEL: Record<StepState, string> = {
  done: '완료',
  current: '진행 중',
  upcoming: '예정',
};

const MARKER_STYLE: Record<StepState, string> = {
  done: 'bg-ink text-on-ink',
  current: 'bg-canvas border-ink text-ink border-2',
  upcoming: 'bg-canvas border-subtle text-secondary border',
};

const LABEL_STYLE: Record<StepState, string> = {
  done: 'text-secondary',
  current: 'text-primary font-medium',
  upcoming: 'text-secondary',
};

function stepStateOf(index: number, currentStep: number): StepState {
  if (index + 1 < currentStep) return 'done';
  if (index + 1 === currentStep) return 'current';
  return 'upcoming';
}

/**
 * Step 2 는 설문·Bot 연동 두 경로가 공유해 fallback 라벨만 쓰면 Bot 연동 중에도
 * `성향 설문 진행 중` 이 뜬다 — 현재 단계 라벨만 경로에서 받아 덮는다.
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
        'bg-canvas border-subtle flex shrink-0 items-center gap-3 border-b px-5 py-4',
        'md:w-[232px] md:flex-col md:items-stretch md:gap-0 md:border-r md:border-b-0 md:px-7 md:py-8'
      )}
    >
      <div className="hidden items-center gap-2 md:flex">
        <span aria-hidden="true" className="bg-action rounded-chip h-[18px] w-[18px] shrink-0" />
        <span className="text-primary text-[14.04px] font-medium tracking-[-0.4px]">Avating</span>
      </div>

      <ol className="flex flex-1 items-center md:mt-7 md:flex-none md:flex-col md:items-stretch">
        {labels.map((label, index) => {
          const state = stepStateOf(index, currentStep);
          return (
            <li
              key={label}
              {...(state === 'current' ? { 'aria-current': 'step' as const } : {})}
              className={cn(
                // 스텝 사이 커넥터 — 모바일은 가로선, 데스크톱은 세로선이며 지나온 구간만 파랗게 채운다.
                'relative flex flex-1 items-center gap-2.5 last:flex-none',
                "after:bg-subtle after:block after:h-px after:flex-1 after:content-[''] last:after:hidden",
                'md:flex-none md:gap-3 md:pb-5 md:last:pb-0',
                'md:after:absolute md:after:top-[26px] md:after:left-[10.5px] md:after:h-[calc(100%-26px)] md:after:w-px md:after:flex-none',
                state === 'done' && 'after:bg-ink'
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'text-meta tnum flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full',
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
        <p className="text-meta text-secondary hidden leading-[1.5] md:mt-auto md:block">{note}</p>
      )}
    </nav>
  );
}

// 정본 `Page` 폭 공식(wf-kit.jsx): maxWidth = max(max, 440) + 88.
const FORM_MAX_WIDTH = {
  default: 'max-w-[548px]',
  wide: 'max-w-[868px]',
} as const;

type WizardShellProps = {
  /** 1~3 = 레일 있는 형태, null = 레일 없는 플랫 형태(S-02-01 환영). */
  currentStep: 1 | 2 | 3 | null;
  currentStepLabel?: string;
  note?: string;
  formWidth?: keyof typeof FORM_MAX_WIDTH;
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
    <div className="bg-canvas text-primary flex min-h-screen flex-col md:flex-row">
      {hasRail && (
        <StepRail
          currentStep={currentStep}
          {...(currentStepLabel !== undefined ? { currentStepLabel } : {})}
          {...(note !== undefined ? { note } : {})}
        />
      )}

      <main
        className={cn(
          'flex min-w-0 flex-1 flex-col items-center justify-center overflow-y-auto px-10',
          hasRail ? 'py-12' : 'py-14'
        )}
      >
        {/* key 변경 시 새 스텝이 즉시 마운트된다 — AnimatePresence 로 exit 지연을 넣으면 전환이 늦어진다. */}
        <motion.div
          key={animationKey}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
          className={cn(
            'bg-canvas border-subtle rounded-card flex w-full flex-col overflow-hidden border',
            FORM_MAX_WIDTH[formWidth]
          )}
        >
          {children}
        </motion.div>

        {!hasRail && note !== undefined && (
          <p className="text-meta text-secondary mt-4 text-center text-pretty">{note}</p>
        )}
      </main>
    </div>
  );
}
