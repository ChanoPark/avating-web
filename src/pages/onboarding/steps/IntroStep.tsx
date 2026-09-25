import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, CircleAlert } from 'lucide-react';
import { Button } from '@shared/ui/Button/Button';
import { FIELD_CLASS, FIELD_ERROR_CLASS, TEXTAREA_CLASS } from '@shared/ui/Input';
import { cn } from '@shared/lib/cn';
import {
  AVATAR_IDENTITY_COLORS,
  DEFAULT_AVATAR_IDENTITY,
  identityFromHex,
  identityHex,
} from '@entities/avatar';
import type { AvatarIdentityName } from '@entities/avatar';
import { getOnboardingMethod, setOnboardingProgress } from '@entities/onboarding';
import { useOnboardingCompletion } from '@entities/onboarding/api/useOnboardingCompletion';
import { loadDraft, saveDraft } from '@features/persona-survey/lib/draftStorage';
import { WIZARD_ACTIONS, WIZARD_BODY, WIZARD_HEAD } from '@shared/ui/wizard';
import { AvatarColorPicker } from '../ui/AvatarColorPicker';

// 정본 UI 제한(20/120)은 백엔드 제출 한도(50/200)의 부분집합이라 항상 유효하다 — 둘을 맞출 필요 없다.
const NAME_MAX = 20;
const DESC_MAX = 120;

// z.enum 은 비어 있지 않은 튜플만 받는데 .map() 결과는 그걸 증명하지 못한다 — 정본 10색은 상수라 늘 1개 이상이다.
const IDENTITY_NAMES = AVATAR_IDENTITY_COLORS.map((color) => color.name) as [
  AvatarIdentityName,
  ...AvatarIdentityName[],
];

// draft 에 풀 밖 색(또는 색 없음)이 남아 있으면 정본 기본값으로 시작한다.
function initialIdentity(hex: string | undefined): AvatarIdentityName {
  const identity = identityFromHex(hex);
  return identity === 'none' ? DEFAULT_AVATAR_IDENTITY : identity;
}

const introFormSchema = z.object({
  avatarName: z.string().trim().min(1, '아바타 이름을 입력해주세요').max(NAME_MAX),
  // 서버 SurveyAvatarCreateRequest 에서 description 은 필수다 — 입력받는 화면은 여기뿐이라 안 받으면 고칠 방법이 없다.
  description: z.string().trim().min(1, '아바타 설명을 입력해주세요').max(DESC_MAX),
  color: z.enum(IDENTITY_NAMES),
});
type IntroFormValues = z.infer<typeof introFormSchema>;

export function IntroStep() {
  const navigate = useNavigate();

  const initialDraft = loadDraft();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<IntroFormValues>({
    resolver: zodResolver(introFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      avatarName: initialDraft?.avatarName ?? '',
      description: initialDraft?.description ?? '',
      color: initialIdentity(initialDraft?.color),
    },
  });

  // 진행 기록(progress)이 아니라 대표 아바타 보유 여부로 판단한다 — 기록은 아바타 없이도
  // complete 로 올라갈 수 있어, 그걸 믿으면 만든 적 없는 사용자까지 튕겨낸다.
  const { hasPrimaryAvatar } = useOnboardingCompletion();
  useEffect(() => {
    if (hasPrimaryAvatar) {
      void navigate('/onboarding/complete', { replace: true });
    }
  }, [hasPrimaryAvatar, navigate]);

  const nameLength = watch('avatarName').length;
  const descLength = watch('description').length;
  const avatarName = watch('avatarName');
  const selectedColor = watch('color');

  const onSubmit = handleSubmit((values) => {
    const existing = loadDraft();
    saveDraft({
      answers: existing?.answers ?? {},
      avatarName: values.avatarName.trim(),
      description: values.description.trim(),
      // draft 에는 늘 저장하지만 제출에 싣는 건 설문 경로뿐이다 — connect(Bot) 경로는 서버가 코드로
      // 아바타를 만들어 이름·설명과 마찬가지로 색을 보낼 자리가 없다(spec-gap).
      color: identityHex(values.color),
      ...(existing?.expressions ? { expressions: existing.expressions } : {}),
    });
    // 방법은 S-02-01 환영 카드에서 이미 골라 두었다.
    const method = getOnboardingMethod();
    if (method === null) {
      // URL 직접 진입 등으로 방법이 없으면, 임의로 하나를 고르지 않고 고르는 자리(환영)로 되돌린다.
      void navigate('/onboarding/welcome');
      return;
    }
    setOnboardingProgress('creating');
    void navigate(method === 'survey' ? '/onboarding/survey' : '/onboarding/connect');
  });

  return (
    <form
      onSubmit={(e) => {
        void onSubmit(e);
      }}
      noValidate
      className="flex flex-col"
    >
      <div className={WIZARD_BODY}>
        <div className={WIZARD_HEAD}>
          <h1 className="text-title text-primary">아바타의 이름과 설명을 알려주세요</h1>
          <p className="text-caption text-secondary">설문 전에 아바타를 어떻게 부를지 정해요.</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="intro-name" className="text-caption text-secondary font-medium">
                아바타 이름 <span className="text-danger">*</span>
              </label>
              <span className="text-meta text-secondary tnum">
                {nameLength} / {NAME_MAX}
              </span>
            </div>
            <input
              id="intro-name"
              type="text"
              maxLength={NAME_MAX}
              placeholder="예) hyunwoo"
              aria-required="true"
              aria-invalid={errors.avatarName ? 'true' : undefined}
              aria-describedby={errors.avatarName ? 'intro-name-error' : undefined}
              className={cn(FIELD_CLASS, errors.avatarName ? FIELD_ERROR_CLASS : null)}
              {...register('avatarName')}
            />
            {errors.avatarName?.message && (
              <p
                id="intro-name-error"
                role="alert"
                className="text-meta text-danger flex items-center gap-1"
              >
                <CircleAlert size={12} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                {errors.avatarName.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="intro-desc" className="text-caption text-secondary font-medium">
                아바타 설명
              </label>
              <span className="text-meta text-secondary tnum">
                {descLength} / {DESC_MAX}
              </span>
            </div>
            <textarea
              id="intro-desc"
              rows={3}
              maxLength={DESC_MAX}
              placeholder="아바타를 한두 문장으로 소개해 주세요"
              aria-invalid={errors.description ? true : undefined}
              aria-describedby={errors.description ? 'intro-desc-error' : undefined}
              className={cn(TEXTAREA_CLASS, errors.description ? FIELD_ERROR_CLASS : null)}
              {...register('description')}
            />
            {errors.description?.message && (
              <p
                id="intro-desc-error"
                role="alert"
                className="text-meta text-danger flex items-center gap-1"
              >
                <CircleAlert size={12} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                {errors.description.message}
              </p>
            )}
          </div>

          <AvatarColorPicker
            value={selectedColor}
            name={avatarName.trim()}
            registration={register('color')}
          />
        </div>
      </div>

      <div className={WIZARD_ACTIONS}>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            void navigate('/onboarding/welcome');
          }}
        >
          <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
          이전
        </Button>
        <Button type="submit">
          다음
          <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}
