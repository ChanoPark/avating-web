import { Outlet, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ProgressBar } from '@shared/ui/ProgressBar/ProgressBar';

const STEP_MAP: Record<string, number> = {
  '/onboarding/welcome': 1,
  '/onboarding/survey': 2,
  '/onboarding/connect': 3,
  '/onboarding/complete': 4,
};

const ONBOARDING_STEP_LABELS = ['환영합니다', '페르소나 설문', '연결 코드', '완료'] as const;

export function OnboardingPage() {
  const location = useLocation();
  const currentStep = STEP_MAP[location.pathname] ?? 1;

  return (
    <div className="bg-bg flex min-h-screen flex-col">
      <header className="px-6 pt-8 pb-4">
        <ProgressBar current={currentStep} total={4} labels={ONBOARDING_STEP_LABELS} />
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
