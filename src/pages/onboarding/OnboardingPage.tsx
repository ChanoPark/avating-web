import { Outlet, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ProgressBar } from '@shared/ui/ProgressBar/ProgressBar';
import {
  ONBOARDING_FALLBACK_LABELS,
  ONBOARDING_STEPS,
  ONBOARDING_TOTAL_STEPS,
  type OnboardingRoute,
} from '@entities/onboarding';

function isOnboardingRoute(pathname: string): pathname is OnboardingRoute {
  return pathname in ONBOARDING_STEPS;
}

export function OnboardingPage() {
  const location = useLocation();
  const descriptor = isOnboardingRoute(location.pathname)
    ? ONBOARDING_STEPS[location.pathname]
    : { step: 1 as const, label: ONBOARDING_FALLBACK_LABELS[0] ?? '시작' };

  const labels = ONBOARDING_FALLBACK_LABELS.map((label, idx) =>
    idx + 1 === descriptor.step ? descriptor.label : label
  );

  return (
    <div className="bg-bg flex min-h-screen flex-col">
      <header className="px-6 pt-8 pb-4">
        <ProgressBar current={descriptor.step} total={ONBOARDING_TOTAL_STEPS} labels={labels} />
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
