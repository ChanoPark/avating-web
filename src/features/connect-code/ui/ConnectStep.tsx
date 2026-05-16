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

  const onboardingProgress = getOnboardingProgress();
  const guardFailed = onboardingProgress !== 'creating';

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

  // expired 상태 후 폴링 중단은 useConnectStatus 내부 refetchInterval 이 담당
  // (active 일 때만 15초 간격, 그 외 false) — 여기서 status 조건을 추가하면 이중 관리.
  const pollingEnabled = !guardFailed && connectCode !== undefined;

  const { data: statusData } = useConnectStatus({ enabled: pollingEnabled });

  const navigatedRef = useRef(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const issuedRef = useRef(false);

  useEffect(() => {
    if (!guardFailed) return;
    if (onboardingProgress === 'welcome') {
      void navigate('/onboarding/welcome', { replace: true });
    } else if (onboardingProgress === 'method') {
      void navigate('/onboarding/method', { replace: true });
    } else {
      void navigate('/onboarding/complete', { replace: true });
    }
  }, [guardFailed, onboardingProgress, navigate]);

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

  const steps = [
    { n: '01', text: 'Avating Bot과 자유롭게 대화합니다' },
    { n: '02', text: '대화 분석 후 아바타 스탯이 자동 생성됩니다' },
    { n: '03', text: '결과를 확인하고 확정합니다' },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 py-6">
      <header className="flex flex-col gap-1">
        <span className="text-mono-micro text-text-3 font-mono tracking-wider uppercase">
          STEP 3 / 4 · ChatGPT Bot 대화
        </span>
        <h1 className="font-ui text-title text-text">ChatGPT Bot과 대화해보세요</h1>
      </header>

      <div className="bg-brand-soft border-brand-border flex flex-col gap-2 rounded-md border p-4">
        <p className="text-body text-text">
          ChatGPT Bot과 대화해서, 나와 비슷한 아바타를 생성해보세요.
        </p>
        <p className="text-body-sm text-text-2">
          대화 내용을 바탕으로 당신과 딱 맞는 아바타를 생성해드립니다.
        </p>
      </div>

      <ol className="flex flex-col gap-2">
        {steps.map((s) => (
          <li key={s.n} className="text-body-sm text-text-2 flex items-center gap-3">
            <span
              aria-hidden="true"
              className="bg-bg-elev-2 border-border-hi text-text-3 text-mono-meta flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border font-mono"
            >
              {s.n}
            </span>
            {s.text}
          </li>
        ))}
      </ol>

      <div
        role="note"
        className="border-border bg-bg-elev-2 flex items-start gap-2 rounded-sm border p-3"
      >
        <span className="text-warning mt-px text-base" aria-hidden="true">
          !
        </span>
        <p className="text-body-sm text-text-2">
          약 10분 소요 · 대화가 길수록 더 정확한 아바타가 생성됩니다
        </p>
      </div>

      {connectCode && (
        <div className="border-border bg-bg-elev-2 flex flex-col items-center gap-4 rounded-md border p-6">
          <span className="text-mono-micro text-text-3 font-mono tracking-wider uppercase">
            연결 코드
          </span>
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
              size="sm"
              onClick={() => {
                void handleCopy();
              }}
            >
              {copySuccess ? '복사됨' : '복사'}
            </Button>

            {showReissueCta && (
              <Button type="button" variant="ghost" size="sm" onClick={handleReissue}>
                재발급
              </Button>
            )}
          </div>

          <p className="text-mono-meta text-text-3 font-mono">
            연결 후 자동으로 다음 단계로 이동합니다
          </p>
        </div>
      )}
    </div>
  );
}
