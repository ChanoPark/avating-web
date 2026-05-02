import { Suspense, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate } from 'react-router';
import { Activity, Heart, Sparkles, Star } from 'lucide-react';
import { StatBar } from '@shared/ui/StatBar/StatBar';
import { Button } from '@shared/ui/Button/Button';
import { useToast } from '@shared/ui/Toast/useToast';
import { getOnboardingProgress } from '@entities/onboarding';
import { isApiError } from '@shared/lib/errors';
import { useGeneratedAvatar } from '../api/useGeneratedAvatar';
import { useCompleteOnboarding } from '../api/useCompleteOnboarding';

function AvatarContent() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: avatar } = useGeneratedAvatar();
  const { mutate: complete, isPending } = useCompleteOnboarding();

  const handleStart = () => {
    complete(undefined, {
      onSuccess: () => {
        void navigate('/dashboard');
      },
      onError: (err) => {
        if (isApiError(err) && err.statusCode === 409) {
          toast.show({ variant: 'warning', title: err.message });
        } else {
          toast.show({
            variant: 'error',
            title: err instanceof Error ? err.message : '오류가 발생했습니다.',
          });
        }
      },
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-4 py-8">
      <div className="text-center">
        <div className="bg-brand text-bg-base mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
          {avatar.initials}
        </div>
        <h2 className="text-subheading text-text mb-1">{avatar.name}</h2>
        <p className="text-body-sm text-text-3">{avatar.handle}</p>
        <p className="text-body-sm text-text-2 mt-1">{avatar.type}</p>
      </div>

      <div className="border-border bg-bg-elev-2 flex flex-col gap-4 rounded-md border p-6">
        <StatBar label="extroversion" value={avatar.stats.extroversion} icon={Activity} />
        <StatBar label="sensitivity" value={avatar.stats.sensitivity} icon={Heart} />
        <StatBar label="enthusiasm" value={avatar.stats.enthusiasm} icon={Sparkles} />
        <StatBar label="dateStyle" value={avatar.stats.dateStyle} icon={Star} />
      </div>

      {avatar.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {avatar.tags.map((tag) => (
            <span
              key={tag}
              data-testid="avatar-tag"
              className="border-border bg-bg-elev-2 text-body-sm text-text-2 rounded-full border px-3 py-1"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="primary"
        onClick={handleStart}
        disabled={isPending}
        className="w-full"
      >
        탐색 시작
      </Button>
    </div>
  );
}

function ErrorFallback() {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-8">
      <p className="text-text-2">오류가 발생했습니다. 다시 시도해주세요.</p>
    </div>
  );
}

export function CompleteStep() {
  const navigate = useNavigate();

  useEffect(() => {
    if (getOnboardingProgress() !== 'complete') {
      void navigate('/onboarding/connect', { replace: true });
    }
  }, [navigate]);

  if (getOnboardingProgress() !== 'complete') return null;

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <span className="text-text-2">아바타 데이터를 불러오는 중...</span>
          </div>
        }
      >
        <AvatarContent />
      </Suspense>
    </ErrorBoundary>
  );
}
