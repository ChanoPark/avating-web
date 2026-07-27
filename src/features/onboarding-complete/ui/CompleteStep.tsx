import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate } from 'react-router';
import { Check, SquarePen, X } from 'lucide-react';
import { Badge } from '@shared/ui/Badge/Badge';
import { Button } from '@shared/ui/Button/Button';
import { Tag } from '@shared/ui/Tag/Tag';
import { HexRadar } from '@shared/ui/HexRadar/HexRadar';
import { useToast } from '@shared/ui/Toast/useToast';
import { useFocusTrap } from '@shared/lib/useFocusTrap';
import { cn } from '@shared/lib/cn';
import { clearOnboardingProgress, getOnboardingProgress } from '@entities/onboarding';
import type { GeneratedAvatar } from '@entities/onboarding';
import { isApiError } from '@shared/lib/errors';
import { useGeneratedAvatar } from '../api/useGeneratedAvatar';
import { useCompleteOnboarding } from '../api/useCompleteOnboarding';
import { WIZARD_ACTIONS, WIZARD_BODY, WIZARD_HEAD } from '@shared/ui/wizard';

// WizardShell(pages/onboarding/ui/WizardShell.tsx) 의 WIZARD_* 와 같은 값이다.

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

// StatBar — 라벨 폭 72, 값 tnum (LAYOUT-NUMBERS § 카드 · 데이터 부품).
function StatBarRow({ label, value, testId }: { label: string; value: number; testId: string }) {
  return (
    <>
      <span className="text-caption text-ink-mute w-[72px] shrink-0 text-left">{label}</span>
      <span className="bg-canvas-soft relative h-1.5 flex-1 overflow-hidden rounded-full">
        <span
          data-testid={testId}
          className="bg-primary block h-full rounded-full"
          style={{ width: `${value}%` }}
        />
      </span>
      <span className="text-caption text-ink-secondary tnum w-7 text-right">{value}</span>
    </>
  );
}

type AvatarContentInnerProps = {
  avatar: GeneratedAvatar;
  onStart: () => void;
  isPending: boolean;
};

function AvatarContentInner({ avatar, onStart, isPending }: AvatarContentInnerProps) {
  const toast = useToast();
  // 기본은 읽기 전용 확인. "스탯 다듬기" 진입 시에만 튜닝 가능.
  const [tuning, setTuning] = useState(false);
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
      requestAnimationFrame(() => {
        statButtonRefs.current.get(triggerKey)?.focus();
      });
    }
  }, []);

  useEffect(() => {
    if (activeStat === null) return;
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
    <>
      <div className={WIZARD_BODY}>
        <div className="flex items-start justify-between gap-3">
          <div className={WIZARD_HEAD}>
            <h1 className="text-heading-lg text-ink">
              {tuning ? '스탯 다듬기' : '이렇게 생성됐어요'}
            </h1>
            <p className="text-body-sm text-ink-mute">
              {tuning
                ? '마음에 안 드는 스탯을 눌러 재조정해보세요.'
                : '내용을 확인한 뒤 완료를 눌러 주세요.'}
            </p>
          </div>
          {tuning && (
            <div
              className="flex shrink-0 items-center gap-1.5"
              aria-label={`튜닝 ${tuneCount} / ${MAX_TUNE}`}
            >
              {Array.from({ length: MAX_TUNE }).map((_, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className={cn(
                    'border-hairline-input h-1.5 w-1.5 rounded-full border',
                    i < tuneCount ? 'bg-primary' : 'bg-canvas-soft'
                  )}
                />
              ))}
              <span
                className={cn(
                  'text-micro tnum',
                  tuneCount >= MAX_TUNE ? 'text-danger' : 'text-ink-mute'
                )}
              >
                {tuneCount}/{MAX_TUNE}
              </span>
            </div>
          )}
        </div>

        {/* 생성 결과 카드 — 아바타 46 + 이름 + 배지 + 성향 · divider · 스탯 (S-02-07). */}
        <div className="border-hairline bg-surface shadow-card flex flex-col gap-3 rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="bg-primary-wash text-primary flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[11px] text-[15.64px] font-semibold"
            >
              {avatar.initials}
            </span>
            <div className="flex flex-col gap-[3px]">
              <div className="flex items-center gap-[7px]">
                <span className="text-heading-sm text-ink">{avatar.name}</span>
                <Badge variant="success">
                  <Check size={11} strokeWidth={1.5} aria-hidden="true" />
                  생성 완료
                </Badge>
              </div>
              <span className="text-caption text-ink-mute">{avatar.type}</span>
            </div>
          </div>

          <hr className="border-hairline w-full border-0 border-t" />

          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <HexRadar stats={radarValues} labels={[...RADAR_LABELS]} size={140} />
            <ul className="flex w-full flex-1 flex-col gap-2">
              {STAT_ORDER.map((key) => {
                const v = stats[key];
                if (!tuning) {
                  return (
                    <li key={key} className="flex items-center gap-2 px-2">
                      <StatBarRow
                        label={STAT_LABEL[key]}
                        value={v}
                        testId={`stat-bar-fill-${key}`}
                      />
                    </li>
                  );
                }

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
                        disabled ? '(튜닝 한도 초과)' : '- 클릭해 재조정'
                      }`}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-sm border px-2 py-1 text-left transition-colors duration-[var(--dur-fast)]',
                        isActive ? 'border-primary' : 'hover:bg-canvas-soft border-transparent',
                        disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                      )}
                    >
                      <StatBarRow
                        label={STAT_LABEL[key]}
                        value={v}
                        testId={`stat-bar-fill-${key}`}
                      />
                      <SquarePen
                        size={13}
                        strokeWidth={1.5}
                        aria-hidden="true"
                        className="text-ink-mute shrink-0"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {avatar.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {avatar.tags.map((tag) => (
              <Tag key={tag} variant="neutral">
                <span data-testid="avatar-tag">{tag}</span>
              </Tag>
            ))}
          </div>
        )}
      </div>

      <div className={WIZARD_ACTIONS}>
        {tuning ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setTuning(false);
            }}
          >
            확인으로 돌아가기
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setTuning(true);
              }}
            >
              스탯 다듬기
            </Button>
            <Button type="button" onClick={onStart} disabled={isPending}>
              완료
              <Check size={16} strokeWidth={1.5} aria-hidden="true" />
            </Button>
          </>
        )}
      </div>

      {tuning && activeStat !== null && (
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
            className="border-hairline bg-surface shadow-float relative mx-auto w-full max-w-[560px] rounded-xl border p-6"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-micro-cap text-primary uppercase">
                {STAT_LABEL[activeStat]} 재조정
              </span>
              <button
                type="button"
                aria-label="다이얼로그 닫기"
                className="text-ink-mute hover:text-ink cursor-pointer"
                onClick={() => {
                  closeDialog(true);
                }}
              >
                <X size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
            <p id="tune-survey-title" className="text-body-sm text-ink mb-3">
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
                  className="border-hairline bg-surface text-caption text-ink hover:border-primary cursor-pointer rounded-md border px-3 py-2 text-left transition-colors duration-[var(--dur-fast)]"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
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
            title: err.message || '오류가 발생했습니다.',
          });
        }
      },
    });
  };

  return <AvatarContentInner avatar={avatar} onStart={handleStart} isPending={isPending} />;
}

function ErrorFallback() {
  return (
    <div role="alert" className={WIZARD_BODY}>
      <p className="text-body-sm text-ink-secondary">오류가 발생했습니다. 다시 시도해주세요.</p>
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
          <div className={WIZARD_BODY}>
            <p className="text-body-sm text-ink-secondary">아바타 데이터를 불러오는 중...</p>
          </div>
        }
      >
        <AvatarContent />
      </Suspense>
    </ErrorBoundary>
  );
}
