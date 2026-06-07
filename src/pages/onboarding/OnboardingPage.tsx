import { Outlet, useLocation } from 'react-router';
import { motion } from 'motion/react';
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
          {/* enter-only 전환: key 변경 시 새 스텝이 즉시 마운트되며 진입 애니메이션만 재생한다.
              AnimatePresence mode="wait" 의 exit 지연을 제거해 클릭 즉시 목적지가 표시되고,
              진행바(크롬)와 콘텐츠가 같은 커밋에서 동기화된다. */}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
