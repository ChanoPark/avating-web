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
import { WIZARD_ACTIONS, WIZARD_BODY, WIZARD_HEAD } from '@shared/ui/wizard';

// Avating Custom GPT 진입점. 실제 GPT URL 은 배포 시 env 로 주입 예정 (현재는 ChatGPT 홈).
const AVATING_GPT_URL = 'https://chatgpt.com';

// WizardShell(pages/onboarding/ui/WizardShell.tsx) 의 WIZARD_* 와 같은 값이다.

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

  // 액션 바: 좌측 ghost '생성된 결과 확인' / 우측 primary 'Bot과 대화 시작'(새 탭).
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
      <div className={WIZARD_BODY}>
        <p className="text-body-sm text-ink-secondary">연결 코드를 발급하는 중...</p>
      </div>
    );
  }

  if (issueError !== null) {
    const message = issueError.message === '' ? '연결 코드 발급에 실패했어요.' : issueError.message;
    return (
      <div className={WIZARD_BODY}>
        <p
          role="alert"
          className="text-caption text-danger border-danger rounded-sm border px-3 py-2"
        >
          {message}
        </p>
        <div>
          <Button type="button" variant="secondary" onClick={handleReissue}>
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  // 정본(S-02-06)은 Bot 이 발급한 코드를 붙여넣는 흐름이지만, 구현은 앱이 일회용 코드를
  // 발급해 Bot 에 붙여넣는 반대 방향이다. 안내 문구는 실제 흐름을 따른다.
  const connectSteps = [
    'ChatGPT에서 Avating GPT를 검색해 시작합니다',
    '위 ONE-TIME CODE를 붙여넣어 계정을 연결합니다',
    'Avating GPT와 약 10분간 자유롭게 대화합니다',
    '대화가 끝나면 자동으로 다음 단계로 전환됩니다',
  ];

  return (
    <>
      <div className={WIZARD_BODY}>
        <div className={WIZARD_HEAD}>
          <span className="text-micro-cap text-ink-mute uppercase">ChatGPT Bot 연동</span>
          <h1 className="text-heading-lg text-ink">ChatGPT Bot과 대화해 보세요</h1>
          <p className="text-body-sm text-ink-mute">
            대화 내용을 바탕으로 당신과 닮은 아바타를 만들어 드려요.
          </p>
        </div>

        {connectCode && (
          <div className="bg-canvas-soft flex flex-col items-center gap-3 rounded-lg p-5">
            <span className="text-micro-cap text-ink-mute uppercase">ONE-TIME CODE</span>
            <div
              className="text-display-md text-ink tnum tracking-[0.2em]"
              aria-label="ONE-TIME CODE"
            >
              {connectCode.connectCode}
            </div>
            <span role="timer" aria-live="polite" className="text-micro text-ink-mute tnum">
              유효 시간 {countdownDisplay} 남음
            </span>
            <div className="flex items-center gap-2">
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

        <ol className="flex flex-col gap-2">
          {connectSteps.map((text, index) => (
            <li key={text} className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="text-micro tnum border-hairline text-ink-mute bg-surface flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border"
              >
                {index + 1}
              </span>
              <span className="text-caption text-ink-secondary">{text}</span>
            </li>
          ))}
        </ol>

        {!showReissueCta && (
          <p className="text-micro text-ink-mute flex items-center gap-2">
            <span
              aria-hidden="true"
              className="bg-primary h-1.5 w-1.5 shrink-0 rounded-full motion-safe:animate-pulse"
            />
            연결 대기 중… 연결되면 자동으로 다음 단계로 이동해요
          </p>
        )}
      </div>

      <div className={WIZARD_ACTIONS}>
        <Button type="button" variant="ghost" onClick={handleViewResult}>
          생성된 결과 확인
        </Button>
        <Button type="button" onClick={handleOpenGpt}>
          Bot과 대화 시작
          <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true" />
        </Button>
      </div>
    </>
  );
}
