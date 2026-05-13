import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate } from 'react-router';
import { Button } from '@shared/ui/Button/Button';
import { Tag } from '@shared/ui/Tag/Tag';
import { HexRadar } from '@shared/ui/HexRadar/HexRadar';
import { useToast } from '@shared/ui/Toast/useToast';
import { useFocusTrap } from '@shared/lib/useFocusTrap';
import { clearOnboardingProgress, getOnboardingProgress } from '@entities/onboarding';
import type { GeneratedAvatar } from '@entities/onboarding';
import { isApiError } from '@shared/lib/errors';
import { useGeneratedAvatar } from '../api/useGeneratedAvatar';
import { useCompleteOnboarding } from '../api/useCompleteOnboarding';

const MAX_TUNE = 3;

type StatKey = 'empathy' | 'proactivity' | 'humor' | 'sensitivity' | 'listening' | 'expressiveness';

const STAT_ORDER: readonly StatKey[] = [
  'empathy',
  'proactivity',
  'humor',
  'sensitivity',
  'listening',
  'expressiveness',
];

const STAT_LABEL: Record<StatKey, string> = {
  empathy: '공감',
  proactivity: '적극성',
  humor: '유머',
  sensitivity: '감성',
  listening: '경청',
  expressiveness: '표현력',
};

const RADAR_LABELS: readonly string[] = STAT_ORDER.map((key) => STAT_LABEL[key]);

type TuneSurveyEntry = { question: string; options: readonly string[]; deltas: readonly number[] };

const TUNE_SURVEY: Record<StatKey, TuneSurveyEntry> = {
  empathy: {
    question: '상대방 감정에 얼마나 잘 공감하나요?',
    options: ['매우 잘 공감', '보통', '잘 못 공감'],
    deltas: [10, 0, -10],
  },
  proactivity: {
    question: '대화에서 먼저 행동하는 편인가요?',
    options: ['항상 먼저', '상황에 따라', '상대방 따라'],
    deltas: [10, 0, -10],
  },
  humor: {
    question: '유머를 얼마나 자주 활용하나요?',
    options: ['자주 사용', '가끔', '거의 안 함'],
    deltas: [10, 0, -10],
  },
  sensitivity: {
    question: '감성적인 표현을 자주 하나요?',
    options: ['매우 자주', '보통', '거의 안 함'],
    deltas: [10, 0, -10],
  },
  listening: {
    question: '상대방 말을 얼마나 잘 경청하나요?',
    options: ['매우 집중', '보통', '자주 놓침'],
    deltas: [10, 0, -10],
  },
  expressiveness: {
    question: '자신의 생각을 잘 표현하나요?',
    options: ['매우 잘함', '보통', '표현 어려움'],
    deltas: [10, 0, -10],
  },
};

function clampStat(value: number): number {
  return Math.min(100, Math.max(10, value));
}

type AvatarContentInnerProps = {
  avatar: GeneratedAvatar;
  onStart: () => void;
  isPending: boolean;
};

function AvatarContentInner({ avatar, onStart, isPending }: AvatarContentInnerProps) {
  const toast = useToast();
  const [stats, setStats] = useState(avatar.stats);
  const [tuneCount, setTuneCount] = useState(0);
  const [activeStat, setActiveStat] = useState<StatKey | null>(null);

  const radarValues = useMemo(() => STAT_ORDER.map((key) => stats[key]), [stats]);

  const statButtonRefs = useRef<Map<StatKey, HTMLButtonElement>>(new Map());
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstDialogButtonRef = useRef<HTMLButtonElement>(null);
  const triggerStatRef = useRef<StatKey | null>(null);

  useFocusTrap(activeStat !== null, dialogRef);

  const closeDialog = useCallback((restoreFocus: boolean) => {
    const triggerKey = triggerStatRef.current;
    setActiveStat(null);
    if (restoreFocus && triggerKey !== null) {
      // 다음 paint 에서 트리거 버튼으로 포커스 복원
      requestAnimationFrame(() => {
        statButtonRefs.current.get(triggerKey)?.focus();
      });
    }
  }, []);

  useEffect(() => {
    if (activeStat === null) return;
    // 다이얼로그 오픈 시 첫 답변 버튼으로 포커스 이동
    firstDialogButtonRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDialog(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [activeStat, closeDialog]);

  const handleStatClick = (key: StatKey) => {
    if (tuneCount >= MAX_TUNE) {
      toast.show({ variant: 'warning', title: '더 이상 조정할 수 없습니다.' });
      return;
    }
    triggerStatRef.current = key;
    setActiveStat(key);
  };

  const handleAnswer = (deltaIndex: number) => {
    if (activeStat === null) return;
    const entry = TUNE_SURVEY[activeStat];
    const delta = entry.deltas[deltaIndex] ?? 0;
    const key = activeStat;
    setStats((prev) => ({ ...prev, [key]: clampStat(prev[key] + delta) }));
    setTuneCount((c) => c + 1);
    closeDialog(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 py-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-mono-micro text-text-3 font-mono tracking-wider uppercase">
            STEP 4 / 4 · 아바타 확인
          </span>
          <div className="flex items-center gap-1.5" aria-label={`튜닝 ${tuneCount} / ${MAX_TUNE}`}>
            {Array.from({ length: MAX_TUNE }).map((_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`border-border-hi h-1.5 w-1.5 rounded-full border ${
                  i < tuneCount ? 'bg-brand' : 'bg-bg-elev-3'
                }`}
              />
            ))}
            <span
              className={`text-mono-meta font-mono ${
                tuneCount >= MAX_TUNE ? 'text-danger' : 'text-text-3'
              }`}
            >
              {tuneCount}/{MAX_TUNE}
            </span>
          </div>
        </div>
        <h1 className="font-ui text-title text-text">생성된 아바타를 확인하세요</h1>
        <p className="text-body-sm text-text-2">
          마음에 안드는 스탯을 눌러서 관련된 스탯을 재조정해보세요.
        </p>
      </header>

      <div className="border-border bg-bg-elev-2 flex items-center gap-3 rounded-md border p-4">
        <div
          aria-hidden="true"
          className="bg-bg-elev-3 border-border-hi text-text-2 font-ui flex h-12 w-12 shrink-0 items-center justify-center rounded-md border text-base font-semibold"
        >
          {avatar.initials}
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-ui text-subheading text-text">{avatar.name}</span>
          <div className="flex items-center gap-2">
            <Tag>{avatar.type}</Tag>
            <Tag variant="brand">Lv.{avatar.level}</Tag>
          </div>
        </div>
      </div>

      <div className="border-border bg-bg-elev-2 grid grid-cols-[140px_1fr] items-center gap-4 rounded-md border p-4">
        <div className="flex items-center justify-center">
          <HexRadar stats={radarValues} labels={[...RADAR_LABELS]} size={140} />
        </div>
        <ul className="flex flex-col gap-1.5">
          {STAT_ORDER.map((key) => {
            const v = stats[key];
            const isActive = activeStat === key;
            const disabled = tuneCount >= MAX_TUNE;
            return (
              <li key={key}>
                <button
                  type="button"
                  ref={(el) => {
                    if (el) statButtonRefs.current.set(key, el);
                    else statButtonRefs.current.delete(key);
                  }}
                  onClick={() => {
                    handleStatClick(key);
                  }}
                  aria-disabled={disabled}
                  aria-label={`${STAT_LABEL[key]} 스탯 ${v}${
                    disabled ? ' (튜닝 한도 초과)' : ' - 클릭해 재조정'
                  }`}
                  className={`group flex w-full items-center gap-2 rounded-sm border px-2 py-1 text-left transition-colors ${
                    isActive
                      ? 'border-brand-border bg-brand-soft'
                      : 'hover:bg-bg-elev-3 border-transparent'
                  } ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                >
                  <span className="text-mono-meta text-text-3 w-10 font-mono">
                    {STAT_LABEL[key]}
                  </span>
                  <span className="bg-bg-elev-3 relative h-1 flex-1 overflow-hidden rounded-sm">
                    <span
                      data-testid={`stat-bar-fill-${key}`}
                      className="bg-brand block h-full"
                      style={{ width: `${v}%` }}
                    />
                  </span>
                  <span className="text-mono-meta text-text-2 w-6 text-right font-mono">{v}</span>
                  <span aria-hidden="true" className="text-text-4 text-xs">
                    ✎
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {avatar.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {avatar.tags.map((tag) => (
            <Tag key={tag}>
              <span data-testid="avatar-tag">{tag}</span>
            </Tag>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="primary"
        onClick={onStart}
        disabled={isPending}
        className="w-full"
      >
        시작하기
      </Button>

      <p className="text-mono-meta text-text-3 text-center font-mono">
        확정 이후 스탯은 튜닝 기능을 통해 조정할 수 있습니다
      </p>

      {activeStat !== null && (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-end px-4 pb-4">
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="absolute inset-0 cursor-default bg-black/50"
            onClick={() => {
              closeDialog(true);
            }}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tune-survey-title"
            className="border-border-hi bg-bg-elev-1 relative mx-auto w-full max-w-[480px] rounded-md border p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-mono-meta text-brand font-mono">
                {STAT_LABEL[activeStat]} 재조정
              </span>
              <button
                type="button"
                aria-label="다이얼로그 닫기"
                className="text-text-3 hover:text-text"
                onClick={() => {
                  closeDialog(true);
                }}
              >
                ✕
              </button>
            </div>
            <p id="tune-survey-title" className="font-ui text-subheading text-text mb-3">
              {TUNE_SURVEY[activeStat].question}
            </p>
            <div className="flex flex-col gap-2">
              {TUNE_SURVEY[activeStat].options.map((opt, oi) => (
                <button
                  key={opt}
                  ref={oi === 0 ? firstDialogButtonRef : undefined}
                  type="button"
                  onClick={() => {
                    handleAnswer(oi);
                  }}
                  className="border-border bg-bg-elev-2 text-body text-text hover:border-border-hi rounded-sm border px-3 py-2 text-left"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AvatarContent() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: avatar } = useGeneratedAvatar();
  const { mutate: complete, isPending } = useCompleteOnboarding();

  const handleStart = () => {
    complete(undefined, {
      onSuccess: () => {
        clearOnboardingProgress();
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

  return <AvatarContentInner avatar={avatar} onStart={handleStart} isPending={isPending} />;
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
      void navigate('/onboarding/welcome', { replace: true });
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
