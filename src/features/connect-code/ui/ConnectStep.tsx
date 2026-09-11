import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { onboardingKeys, getOnboardingProgress, setOnboardingProgress } from '@entities/onboarding';
import { useOnboardingCompletion } from '@entities/onboarding/api/useOnboardingCompletion';
import { useConnectCode } from '../api/useConnectCode';
import { useConnectStatus } from '../api/useConnectStatus';
import { formatCountdown, isExpired } from '../lib/countdown';
import { useToast } from '@shared/ui/Toast/useToast';
import { Button } from '@shared/ui/Button/Button';
import { WIZARD_ACTIONS, WIZARD_BODY, WIZARD_HEAD } from '@shared/ui/wizard';

// GPT URL 은 배포 시 env 로 주입할 예정이다 — 지금은 ChatGPT 홈으로 고정해 둔다.
const AVATING_GPT_URL = 'https://chatgpt.com';

export function ConnectStep() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const onboardingProgress = getOnboardingProgress();
  const { hasPrimaryAvatar } = useOnboardingCompletion();
  // complete 기록만으론 완료를 보장 못한다 — 대표 아바타가 없으면 여기 머문다 (되돌리면 왕복만 생긴다).
  const guardFailed =
    onboardingProgress !== 'creating' && !(onboardingProgress === 'complete' && !hasPrimaryAvatar);

  const {
    data: connectCode,
    isPending,
    isFetching,
    error: issueError,
    refetch: refetchCode,
  } = useConnectCode({ enabled: !guardFailed });
  // 재발급 시 isPending 은 false 다 — isFetching 을 함께 안 보면 만료된 옛 코드가 그대로 보인다.
  const isIssuing = isPending || isFetching;
  const [localExpired, setLocalExpired] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [now, setNow] = useState(Date.now());

  // 폴링 중단은 useConnectStatus 내부 refetchInterval 이 담당한다 — 여기서 status 조건을 더하면 관리 지점이 두 곳으로 나뉜다.
  const pollingEnabled = !guardFailed && connectCode !== undefined;

  const { data: statusData } = useConnectStatus({ enabled: pollingEnabled });

  const navigatedRef = useRef(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!guardFailed) return;
    if (onboardingProgress === 'welcome') {
      void navigate('/onboarding/welcome', { replace: true });
    } else {
      void navigate('/onboarding/complete', { replace: true });
    }
  }, [guardFailed, onboardingProgress, navigate]);

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
    queryClient.removeQueries({ queryKey: onboardingKeys.connectStatus('current') });
    void refetchCode();
  };

  const handleOpenGpt = () => {
    window.open(AVATING_GPT_URL, '_blank', 'noopener,noreferrer');
  };

  // connected 이전에 complete 를 기록하면 아바타 없는 사용자가 완료 처리돼 재진입 시 이 화면을 건너뛴다.
  const handleViewResult = () => {
    if (statusData?.status !== 'connected') {
      toast.show({
        variant: 'warning',
        title: '아직 연결되지 않았어요',
        description: 'Bot과 대화를 마치면 결과 화면으로 자동 이동해요.',
      });
      return;
    }
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
        <p className="text-caption text-secondary">연결 코드를 발급하는 중...</p>
      </div>
    );
  }

  if (issueError !== null) {
    const message = issueError.message === '' ? '연결 코드 발급에 실패했어요.' : issueError.message;
    return (
      <div className={WIZARD_BODY}>
        <p
          role="alert"
          className="text-caption text-danger border-danger-mark rounded-chip border px-3 py-2"
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

  // spec-divergence: 정본(S-02-06)은 Bot 발급 코드를 붙여넣는 흐름이나, 구현은 반대 방향이다.
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
          <span className="text-label text-secondary uppercase">ChatGPT Bot 연동</span>
          <h1 className="text-title text-primary">ChatGPT Bot과 대화해 보세요</h1>
          <p className="text-caption text-secondary">
            대화 내용을 바탕으로 당신과 닮은 아바타를 만들어 드려요.
          </p>
        </div>

        {/* isIssuing·issueError 를 위에서 걸렀으므로 여기서는 코드가 반드시 있다. */}
        <div className="bg-surface rounded-card flex flex-col items-center gap-3 p-5">
          <span className="text-label text-secondary uppercase">ONE-TIME CODE</span>
          <div className="text-title text-primary tnum tracking-[0.2em]" aria-label="ONE-TIME CODE">
            {connectCode.connectCode}
          </div>
          <span role="timer" aria-live="polite" className="text-meta text-secondary tnum">
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

        <ol className="flex flex-col gap-2">
          {connectSteps.map((text, index) => (
            <li key={text} className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="text-meta tnum border-subtle text-secondary bg-canvas flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border"
              >
                {index + 1}
              </span>
              <span className="text-caption text-secondary">{text}</span>
            </li>
          ))}
        </ol>

        {!showReissueCta && (
          <p className="text-meta text-secondary flex items-center gap-2">
            <span
              aria-hidden="true"
              className="bg-secondary h-1.5 w-1.5 shrink-0 rounded-full motion-safe:animate-pulse"
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
