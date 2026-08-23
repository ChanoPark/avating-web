import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, CircleAlert } from 'lucide-react';
import { Button } from '@shared/ui/Button/Button';
import { cn } from '@shared/lib/cn';
import { getOnboardingMethod, setOnboardingProgress } from '@entities/onboarding';
import { useOnboardingCompletion } from '@entities/onboarding/api/useOnboardingCompletion';
import { loadDraft, saveDraft } from '@features/persona-survey/lib/draftStorage';
import { WIZARD_ACTIONS, WIZARD_BODY, WIZARD_HEAD } from '@shared/ui/wizard';

// S-02-02 Step 1 — 표시용 입력 제한. 정본 wf/wf-s1-entry.jsx 의 `count="0 / 20"`·`"0 / 120"`.
// 백엔드 제출 계약(avatarCreateFromSurveyRequestSchema: 이름 50 / 설명 200)의 부분집합이라 항상 유효하다.
const NAME_MAX = 20;
const DESC_MAX = 120;

const introFormSchema = z.object({
  avatarName: z.string().trim().min(1, '아바타 이름을 입력해주세요').max(NAME_MAX),
  // 서버 SurveyAvatarCreateRequest 에서 description 은 필수다. 설명 입력이 있는 화면은 여기뿐이라
  // (SurveyStep 은 draft 값을 그대로 실어 보낸다) 여기서 못 받으면 제출 시점에 사용자가 고칠 방법이 없다.
  description: z.string().trim().min(1, '아바타 설명을 입력해주세요').max(DESC_MAX),
});
type IntroFormValues = z.infer<typeof introFormSchema>;

// forms.css `.av-input` — 흰 서피스 + hairline-input 테두리 · 15px · lh 1.4
// · padding 9px 12px · radius --r-sm(6) · min-height 40. 회색 채움은 disabled 전용이다.
const FIELD_INPUT =
  'bg-surface text-body text-ink placeholder:text-ink-mute min-h-10 w-full rounded-sm border px-3 py-2.25 leading-[1.4] outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-brand focus-visible:shadow-focus disabled:bg-canvas-soft disabled:text-ink-mute disabled:cursor-not-allowed';

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
    },
  });

  // 이미 대표 아바타가 있는 사용자는 확인 화면으로 보낸다.
  // 진행 기록(progress)이 아니라 대표 아바타 보유 여부로 판단한다 — 기록은 아바타 없이도
  // complete 로 올라갈 수 있어서, 그걸 믿으면 만든 적 없는 사용자까지 여기서 튕겨냈다.
  const { hasPrimaryAvatar } = useOnboardingCompletion();
  useEffect(() => {
    if (hasPrimaryAvatar) {
      void navigate('/onboarding/complete', { replace: true });
    }
  }, [hasPrimaryAvatar, navigate]);

  const nameLength = watch('avatarName').length;
  const descLength = watch('description').length;

  const onSubmit = handleSubmit((values) => {
    // 기존 설문 답변·표현 draft 를 보존한 채 이름·설명만 갱신한다.
    const existing = loadDraft();
    saveDraft({
      answers: existing?.answers ?? {},
      avatarName: values.avatarName.trim(),
      description: values.description.trim(),
      ...(existing?.expressions ? { expressions: existing.expressions } : {}),
    });
    // v2.6: 생성 방법 선택 화면이 사라져 Step 1 다음은 곧장 Step 2(설문 · Bot)다.
    // 방법은 S-02-01 환영 카드에서 이미 골라 두었다.
    const method = getOnboardingMethod();
    if (method === null) {
      // 방법을 고른 적이 없다 — URL 직접 진입 등. 둘 중 하나를 임의로 택하면 사용자가
      // 고르지 않은 경로로 밀어넣게 되므로 고르는 자리(환영)로 되돌린다. 입력은 위에서 이미 저장했다.
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
          <h1 className="text-heading-lg text-ink">아바타의 이름과 설명을 알려주세요</h1>
          <p className="text-body-sm text-ink-mute">설문 전에 아바타를 어떻게 부를지 정해요.</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="intro-name" className="text-caption text-ink-secondary font-medium">
                아바타 이름 <span className="text-danger">*</span>
              </label>
              <span className="text-micro text-ink-mute tnum">
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
              className={cn(
                FIELD_INPUT,
                errors.avatarName
                  ? 'border-danger focus:border-danger'
                  : 'border-hairline-input focus:border-primary'
              )}
              {...register('avatarName')}
            />
            {errors.avatarName?.message && (
              <p
                id="intro-name-error"
                role="alert"
                className="text-micro text-danger flex items-center gap-1"
              >
                <CircleAlert size={12} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                {errors.avatarName.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="intro-desc" className="text-caption text-ink-secondary font-medium">
                아바타 설명
              </label>
              <span className="text-micro text-ink-mute tnum">
                {descLength} / {DESC_MAX}
              </span>
            </div>
            <textarea
              id="intro-desc"
              rows={3}
              maxLength={DESC_MAX}
              placeholder="아바타를 한두 문장으로 소개해 주세요"
              aria-invalid={errors.description ? true : undefined}
              aria-describedby={errors.description ? 'intro-desc-error' : 'intro-desc-help'}
              className={cn(
                FIELD_INPUT,
                'resize-none',
                errors.description
                  ? 'border-danger focus:border-danger'
                  : 'border-hairline-input focus:border-primary'
              )}
              {...register('description')}
            />
            {errors.description?.message ? (
              <p
                id="intro-desc-error"
                role="alert"
                className="text-micro text-danger flex items-center gap-1"
              >
                <CircleAlert size={12} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                {errors.description.message}
              </p>
            ) : (
              <p id="intro-desc-help" className="text-micro text-ink-mute">
                상대 아바타가 첫인상으로 참고합니다
              </p>
            )}
          </div>
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
