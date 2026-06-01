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
  // 와이어프레임 v2: welcome 은 진행바 없는 브랜드 환영 모멘트(pre-step)라 단계 매핑에서 제외된다.
  // 매핑된 단계(intro~complete)에서만 진행바를 렌더한다.
  const descriptor = isOnboardingRoute(location.pathname)
    ? ONBOARDING_STEPS[location.pathname]
    : null;

  const labels = ONBOARDING_FALLBACK_LABELS.map((label, idx) =>
    descriptor !== null && idx + 1 === descriptor.step ? descriptor.label : label
  );

  return (
    <div className="bg-bg flex min-h-screen flex-col">
      {descriptor !== null && (
        <header className="px-6 pt-8 pb-4">
          <ProgressBar current={descriptor.step} total={ONBOARDING_TOTAL_STEPS} labels={labels} />
        </header>
      )}

      <main
        className={`flex flex-1 justify-center px-4 pb-8 ${
          descriptor === null ? 'items-center' : 'items-start'
        }`}
      >
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
