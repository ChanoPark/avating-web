import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Check, User } from 'lucide-react';
import { Badge } from '@shared/ui/Badge/Badge';
import { Button } from '@shared/ui/Button/Button';
import { Tag } from '@shared/ui/Tag/Tag';
import { clearOnboardingProgress, resolveResumeRoute } from '@entities/onboarding';
import { useOnboardingCompletion } from '@entities/onboarding/api/useOnboardingCompletion';
import { usePrimaryAvatar, PERSONA_STAT_KEYS, PERSONA_STAT_LABELS } from '@entities/avatar';
import type { AvatarSummary } from '@entities/avatar';
import { WIZARD_ACTIONS, WIZARD_BODY, WIZARD_HEAD } from '@shared/ui/wizard';

function StatBarRow({ label, value, testId }: { label: string; value: number; testId: string }) {
  return (
    <>
      <span className="text-caption text-ink-mute w-[72px] shrink-0 text-left">{label}</span>
      <span className="bg-canvas-soft relative h-1.5 flex-1 overflow-hidden rounded-full">
        <span
          data-testid={testId}
          className="bg-primary block h-full rounded-full"
          style={{ width: `${Math.round(value)}%` }}
        />
      </span>
      <span className="text-caption text-ink-secondary tnum w-7 text-right">
        {Math.round(value)}
      </span>
    </>
  );
}

type AvatarContentProps = {
  avatar: AvatarSummary;
  onStart: () => void;
};

function AvatarContent({ avatar, onStart }: AvatarContentProps) {
  // 파싱은 record 라 서버가 모르는 키를 보내도 통과한다 — 표시는 아는 7지표만, 정본 순서대로.
  const statRows = PERSONA_STAT_KEYS.flatMap((key) => {
    const value = avatar.stats[key];
    return value === undefined ? [] : [{ key, label: PERSONA_STAT_LABELS[key], value }];
  });

  return (
    <>
      <div className={WIZARD_BODY}>
        <div className={WIZARD_HEAD}>
          <h1 className="text-heading-lg text-ink">이렇게 생성됐어요</h1>
          <p className="text-body-sm text-ink-mute">내용을 확인한 뒤 완료를 눌러 주세요.</p>
        </div>

        <div className="border-hairline bg-surface shadow-card flex flex-col gap-3 rounded-lg border p-4">
          <div className="flex items-center gap-3">
            {/* 아바타 이미지는 서버가 아직 지원하지 않는다 — 빈 placeholder 로 자리만 잡는다. */}
            <span
              aria-hidden="true"
              data-testid="avatar-image-placeholder"
              className="bg-canvas-soft text-ink-mute flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[11px]"
            >
              <User size={22} strokeWidth={1.5} />
            </span>
            <div className="flex flex-col gap-[3px]">
              <div className="flex items-center gap-[7px]">
                <span className="text-heading-sm text-ink">{avatar.name}</span>
                <Badge variant="success">
                  <Check size={11} strokeWidth={1.5} aria-hidden="true" />
                  생성 완료
                </Badge>
              </div>
              {avatar.description !== '' && (
                <span className="text-caption text-ink-mute">{avatar.description}</span>
              )}
            </div>
          </div>

          <hr className="border-hairline w-full border-0 border-t" />

          <ul className="flex w-full flex-col gap-2">
            {statRows.map(({ key, label, value }) => (
              <li key={key} className="flex items-center gap-2 px-2">
                <StatBarRow label={label} value={value} testId={`stat-bar-fill-${key}`} />
              </li>
            ))}
          </ul>
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
        <Button type="button" onClick={onStart}>
          완료
          <Check size={16} strokeWidth={1.5} aria-hidden="true" />
        </Button>
      </div>
    </>
  );
}

export function CompleteStep() {
  const navigate = useNavigate();
  const { hasPrimaryAvatar, isResolved, isUnknown } = useOnboardingCompletion();
  // 생성 직후에는 useSurveySubmit 이 심어 둔 캐시가, 새로고침 시에는 GET /api/avatars/primary 재조회가 채운다.
  const { data: avatar } = usePrimaryAvatar();

  // 조회 실패(isUnknown)까지 "없음"으로 취급하면 되돌아간 화면이 사용자를 다시 여기로 보내 왕복하게 된다.
  const shouldResume = isResolved && !isUnknown && !hasPrimaryAvatar;

  useEffect(() => {
    if (shouldResume) {
      void navigate(resolveResumeRoute(false), { replace: true });
    }
  }, [shouldResume, navigate]);

  if (shouldResume) return null;

  if (isUnknown) {
    return (
      <div role="alert" className={WIZARD_BODY}>
        <p className="text-body-sm text-ink-secondary">오류가 발생했습니다. 다시 시도해주세요.</p>
      </div>
    );
  }

  if (!isResolved || avatar == null) {
    return (
      <div className={WIZARD_BODY}>
        <p className="text-body-sm text-ink-secondary">아바타 데이터를 불러오는 중...</p>
      </div>
    );
  }

  // 완료는 별도 API 호출 없이 대시보드로 이동한다 — POST /api/onboarding/complete 는
  // 2026-08-30 사용자 결정으로 호출하지 않는다 (완료 판정의 정본은 대표 아바타 보유).
  const handleStart = () => {
    clearOnboardingProgress();
    void navigate('/dashboard');
  };

  return <AvatarContent avatar={avatar} onStart={handleStart} />;
}
