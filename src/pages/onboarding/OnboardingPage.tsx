import { Outlet, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ProgressBar } from '@shared/ui/ProgressBar/ProgressBar';

const STEP_MAP: Record<string, number> = {
  '/onboarding/welcome': 1,
  '/onboarding/method': 2,
  '/onboarding/survey': 3,
  '/onboarding/connect': 3,
  '/onboarding/complete': 4,
};

const STEP_LABEL_BY_ROUTE: Record<string, string> = {
  '/onboarding/welcome': '시작',
  '/onboarding/method': '방법 선택',
  '/onboarding/survey': '성향 설문',
  '/onboarding/connect': 'Bot 대화',
  '/onboarding/complete': '아바타 확인',
};

const FALLBACK_LABELS = ['시작', '방법 선택', '아바타 생성', '아바타 확인'] as const;

export function OnboardingPage() {
  const location = useLocation();
  const currentStep = STEP_MAP[location.pathname] ?? 1;
  const currentLabel = STEP_LABEL_BY_ROUTE[location.pathname] ?? FALLBACK_LABELS[currentStep - 1];

  const labels = FALLBACK_LABELS.map((label, idx) => {
    if (idx + 1 === currentStep && currentLabel !== undefined) return currentLabel;
    return label;
  });

  return (
    <div className="bg-bg flex min-h-screen flex-col">
      <header className="px-6 pt-8 pb-4">
        <ProgressBar current={currentStep} total={4} labels={labels} />
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
