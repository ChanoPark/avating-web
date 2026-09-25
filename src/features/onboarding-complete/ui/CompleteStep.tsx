import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Check } from 'lucide-react';
import { Badge } from '@shared/ui/Badge/Badge';
import { Button } from '@shared/ui/Button/Button';
import { Tag } from '@shared/ui/Tag/Tag';
import { clearOnboardingProgress, resolveResumeRoute } from '@entities/onboarding';
import { useOnboardingCompletion } from '@entities/onboarding/api/useOnboardingCompletion';
import {
  AvatarIdentityTile,
  AvatarTagBadge,
  PersonaStats,
  usePrimaryAvatar,
  personaStatRows,
} from '@entities/avatar';
import type { AvatarSummary } from '@entities/avatar';
import { WIZARD_ACTIONS, WIZARD_BODY, WIZARD_HEAD } from '@shared/ui/wizard';

type AvatarContentProps = {
  avatar: AvatarSummary;
  onStart: () => void;
};

function AvatarContent({ avatar, onStart }: AvatarContentProps) {
  // 파싱은 record 라 서버가 모르는 키를 보내도 통과한다 — 표시는 아는 7지표만, 정본 순서대로.
  const statRows = personaStatRows(avatar.stats);

  return (
    <>
      <div className={WIZARD_BODY}>
        <div className={WIZARD_HEAD}>
          <h1 className="text-title text-primary">이렇게 생성됐어요</h1>
          <p className="text-caption text-secondary">내용을 확인한 뒤 완료를 눌러주세요.</p>
        </div>

        {/* @container — PersonaStats 가 카드 폭을 보고 레이더·값 표를 나란히 둘지 쌓을지 정한다. */}
        <div className="border-subtle bg-canvas rounded-card @container flex flex-col gap-3 border p-4">
          <div className="flex items-center gap-3">
            {/* 아바타 이미지는 서버가 아직 지원하지 않는다 — 정본(S-02-06 IdCircle)대로 identity 색 + 이니셜로 채운다. */}
            <AvatarIdentityTile
              name={avatar.name}
              color={avatar.color}
              className="text-body h-[46px] w-[46px] rounded-[11px]"
            />
            {/* 태그는 이름 옆이 아니라 이름 아래 뱃지다(정본 badge 형 · 사용자 요청 2026-09-25). 이름 ↔ 뱃지 4px 는 .cx-aname--badge gap. */}
            <div className="flex min-w-0 flex-col gap-1">
              {/* 좁은 폭(390px)에서 긴 이름이면 "생성 완료" 배지가 카드 밖으로 밀리므로 다음 줄로 접는다. */}
              <div className="flex flex-wrap items-center gap-x-[7px] gap-y-1">
                <span className="text-lead text-primary min-w-0 break-all">{avatar.name}</span>
                <Badge>
                  <Check size={11} strokeWidth={1.5} aria-hidden="true" />
                  생성 완료
                </Badge>
              </div>
              <AvatarTagBadge hashtag={avatar.hashtag} />
              {avatar.description !== '' && (
                <span className="text-caption text-secondary">{avatar.description}</span>
              )}
            </div>
          </div>

          {statRows.length > 0 && (
            <>
              <hr className="border-subtle w-full border-0 border-t" />
              {/* 대시보드와 같은 레이더 + 값 표(사용자 요청 2026-09-25) — 형태만으로 값을 전하지 않는다. */}
              <PersonaStats rows={statRows} />
            </>
          )}
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
        <p className="text-caption text-secondary">오류가 생겼어요. 다시 시도해주세요.</p>
      </div>
    );
  }

  if (!isResolved || avatar == null) {
    return (
      <div className={WIZARD_BODY}>
        <p className="text-caption text-secondary">아바타 데이터를 불러오는 중…</p>
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
