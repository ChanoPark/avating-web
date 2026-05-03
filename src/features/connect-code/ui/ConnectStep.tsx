import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { onboardingKeys, getOnboardingProgress, setOnboardingProgress } from '@entities/onboarding';
import { useIssueConnectCode } from '../api/useIssueConnectCode';
import { useConnectStatus } from '../api/useConnectStatus';
import { formatCountdown, isExpired } from '../lib/countdown';
import { useToast } from '@shared/ui/Toast/useToast';
import { Button } from '@shared/ui/Button/Button';

export function ConnectStep() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const guardFailed = getOnboardingProgress() === 'welcome';

  const {
    mutate: issueCode,
    data: connectCode,
    isPending: isIssuing,
    error: issueError,
    reset: resetIssue,
  } = useIssueConnectCode();
  const [localExpired, setLocalExpired] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [now, setNow] = useState(Date.now());

  const pollingEnabled = !guardFailed && connectCode !== undefined;

  const { data: statusData } = useConnectStatus({ enabled: pollingEnabled });

  const navigatedRef = useRef(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const issuedRef = useRef(false);

  useEffect(() => {
    if (guardFailed) {
      void navigate('/onboarding/survey', { replace: true });
    }
  }, [guardFailed, navigate]);

  useEffect(() => {
    if (guardFailed) return;
    if (issuedRef.current) return;
    issuedRef.current = true;
    issueCode();
  }, [guardFailed, issueCode]);

  useEffect(() => {
    if (statusData?.status === 'connected' && !navigatedRef.current) {
      navigatedRef.current = true;
      setOnboardingProgress('complete');
      queryClient.cancelQueries({ queryKey: onboardingKeys.all }).catch(() => undefined);
      void navigate('/onboarding/complete');
    }
  }, [statusData?.status, navigate, queryClient]);

  useEffect(() => {
    if (!connectCode?.expiresAt) return;

    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (isExpired(connectCode.expiresAt)) {
        setLocalExpired(true);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [connectCode?.expiresAt]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    if (!connectCode?.connectCode) return;
    try {
      await navigator.clipboard.writeText(connectCode.connectCode);
      setCopySuccess(true);
      toast.show({ variant: 'success', title: '복사되었습니다' });
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        setCopySuccess(false);
      }, 1000);
    } catch {
      toast.show({ variant: 'error', title: '복사를 사용할 수 없는 환경입니다' });
    }
  };

  const handleReissue = () => {
    setLocalExpired(false);
    navigatedRef.current = false;
    issuedRef.current = true;
    resetIssue();
    queryClient.removeQueries({ queryKey: onboardingKeys.connectStatus('current') });
    issueCode();
  };

  if (guardFailed) return null;

  const showReissueCta = localExpired || statusData?.status === 'expired';

  const countdownDisplay = connectCode?.expiresAt
    ? formatCountdown(connectCode.expiresAt, now)
    : '00:00';

  if (isIssuing) {
    return (
      <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-6 px-4 py-8">
        <p className="text-body text-text-2">연결 코드를 발급하는 중...</p>
      </div>
    );
  }

  if (issueError !== null) {
    const message = issueError.message === '' ? '연결 코드 발급에 실패했어요.' : issueError.message;
    return (
      <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-4 px-4 py-8">
        <p
          role="alert"
          className="text-body-sm text-danger border-danger rounded-sm border px-3 py-2"
        >
          {message}
        </p>
        <Button type="button" variant="primary" onClick={handleReissue}>
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-4 py-8">
      <div className="text-center">
        <h2 className="text-subheading text-text mb-2">Custom GPT 연결</h2>
        <p className="text-body-sm text-text-2">
          아래 코드를 Custom GPT에 입력하면 아바타가 활성화됩니다.
        </p>
      </div>

      {connectCode && (
        <div className="border-border bg-bg-elev-2 flex flex-col items-center gap-4 rounded-md border p-6">
          <div className="text-text font-mono text-2xl tracking-[4px]" aria-label="연결 코드">
            {connectCode.connectCode}
          </div>

          <span role="timer" aria-live="polite" className="text-mono-meta text-text-3 font-mono">
            {countdownDisplay}
          </span>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void handleCopy();
              }}
            >
              {copySuccess ? '복사됨' : '복사'}
            </Button>

            {showReissueCta && (
              <Button type="button" variant="ghost" onClick={handleReissue}>
                재발급
              </Button>
            )}
          </div>
        </div>
      )}

      <p className="text-body-sm text-text-3 text-center">
        연결 후 자동으로 다음 단계로 이동합니다.
      </p>
    </div>
  );
}
