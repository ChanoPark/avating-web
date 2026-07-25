import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { onboardingKeys, getOnboardingProgress, setOnboardingProgress } from '@entities/onboarding';
import { useIssueConnectCode } from '../api/useIssueConnectCode';
import { useConnectStatus } from '../api/useConnectStatus';
import { formatCountdown, isExpired } from '../lib/countdown';
import { useToast } from '@shared/ui/Toast/useToast';
import { Button } from '@shared/ui/Button/Button';

// Avating Custom GPT 진입점. 실제 GPT URL 은 배포 시 env 로 주입 예정 (현재는 ChatGPT 홈).
const AVATING_GPT_URL = 'https://chatgpt.com';

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

  // chat17: 'GPT로 이동'(secondary, 새 탭) 좌측 / '생성된 결과 확인'(primary) 우측.
  const handleOpenGpt = () => {
    window.open(AVATING_GPT_URL, '_blank', 'noopener,noreferrer');
  };

  const handleViewResult = () => {
    setOnboardingProgress('complete');
    void navigate('/onboarding/complete');
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

  const connectSteps = [
    { n: '01', text: 'ChatGPT에서 Avating GPT를 검색해 시작합니다' },
    { n: '02', text: '위 ONE-TIME CODE를 붙여넣어 계정을 연결합니다' },
    { n: '03', text: 'Avating GPT와 약 10분간 자유롭게 대화합니다' },
    { n: '04', text: '대화가 끝나면 자동으로 다음 단계로 전환됩니다' },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 py-6">
      <header className="flex flex-col gap-1">
        <span className="text-mono-micro text-text-3 font-mono tracking-wider uppercase">
          STEP 3 / 4 · ChatGPT Bot 연동
        </span>
        <h1 className="font-ui text-title text-text">Avating GPT와 연결</h1>
      </header>

      <div className="bg-brand-soft border-brand-border flex flex-col gap-2 rounded-md border p-4">
        <p className="text-body text-text">
          Avating GPT와 대화하면, 나와 비슷한 아바타가 만들어져요.
        </p>
        <p className="text-body-sm text-text-2">
          대화가 길고 솔직할수록 더 정확한 아바타가 생성됩니다.
        </p>
      </div>

      {connectCode && (
        <div className="border-border bg-bg-elev-2 flex flex-col items-center gap-4 rounded-md border p-6">
          <span className="text-mono-micro text-text-3 font-mono tracking-wider uppercase">
            ONE-TIME CODE
          </span>
          <div className="text-text font-mono text-2xl tracking-[4px]" aria-label="ONE-TIME CODE">
            {connectCode.connectCode}
          </div>
          <span role="timer" aria-live="polite" className="text-mono-meta text-text-3 font-mono">
            유효 시간 {countdownDisplay} 남음
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
        </div>
      )}

      <section className="flex flex-col gap-3">
        <span className="text-mono-micro text-text-3 font-mono tracking-wider uppercase">
          연결 방법
        </span>
        <ol className="flex flex-col gap-2">
          {connectSteps.map((s) => (
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
      </section>

      <div className="flex flex-col gap-3">
        {!showReissueCta && (
          <div className="text-mono-meta text-text-3 flex items-center gap-2 font-mono">
            <span
              aria-hidden="true"
              className="bg-success h-1.5 w-1.5 rounded-full motion-safe:animate-pulse"
            />
            연결 대기 중… 연결되면 자동으로 다음 단계로 이동해요
          </div>
        )}
        <div className="flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleOpenGpt}>
            GPT로 이동
            <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </Button>
          <Button type="button" variant="primary" className="flex-1" onClick={handleViewResult}>
            생성된 결과 확인
          </Button>
        </div>
      </div>
    </div>
  );
}
