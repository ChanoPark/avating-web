import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@shared/ui/Button/Button';
import { cn } from '@shared/lib/cn';
import { getOnboardingProgress, setOnboardingProgress } from '@entities/onboarding';
import { loadDraft, saveDraft } from '@features/persona-survey/lib/draftStorage';

// 와이어프레임 v2 Step 1 — 표시용 입력 제한(이름 16자 / 설명 80자).
// 백엔드 제출 계약(avatarCreateFromSurveyRequestSchema: 이름 50 / 설명 200)의 부분집합이라 항상 유효하다.
const NAME_MAX = 16;
const DESC_MAX = 80;

const introFormSchema = z.object({
  avatarName: z.string().trim().min(1, '아바타 이름을 입력해주세요').max(NAME_MAX),
  description: z.string().max(DESC_MAX),
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
    },
  });

  // 이미 온보딩을 완료한 사용자는 확인 화면으로 보낸다.
  useEffect(() => {
    if (getOnboardingProgress() === 'complete') {
      void navigate('/onboarding/complete', { replace: true });
    }
  }, [navigate]);

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
    setOnboardingProgress('method');
    void navigate('/onboarding/method');
  });

  return (
    <form
      onSubmit={(e) => {
        void onSubmit(e);
      }}
      noValidate
      className="mx-auto flex w-full max-w-[480px] flex-col gap-6 py-6"
    >
      <header className="flex flex-col gap-1">
        <span className="text-mono-micro text-text-3 font-mono tracking-wider uppercase">
          STEP 1 / 4 · 아바타 기본 정보
        </span>
        <h1 className="font-ui text-title text-text">아바타의 이름과 설명을 알려주세요</h1>
        <p className="text-body-sm text-text-3">설문 전에 아바타를 어떻게 부를지 정해요</p>
      </header>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="intro-name" className="text-body text-text">
              아바타 이름
            </label>
            <span className="text-mono-micro text-text-4 font-mono">
              {nameLength}/{NAME_MAX}
            </span>
          </div>
          <input
            id="intro-name"
            type="text"
            maxLength={NAME_MAX}
            placeholder="예: hyunwoo"
            aria-invalid={errors.avatarName ? 'true' : undefined}
            aria-describedby={errors.avatarName ? 'intro-name-error' : undefined}
            className={cn(
              'bg-bg-elev-2 text-text placeholder:text-text-3 focus:border-brand rounded-sm border px-3 py-2.5 text-sm outline-none',
              errors.avatarName ? 'border-danger' : 'border-border-hi'
            )}
            {...register('avatarName')}
          />
          {errors.avatarName?.message && (
            <p id="intro-name-error" role="alert" className="text-mono-meta text-danger font-mono">
              {errors.avatarName.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="intro-desc" className="text-body text-text">
              아바타 설명
            </label>
            <span className="text-mono-micro text-text-4 font-mono">
              {descLength}/{DESC_MAX}
            </span>
          </div>
          <textarea
            id="intro-desc"
            rows={3}
            maxLength={DESC_MAX}
            placeholder="예: 혼자 있는 시간을 좋아하는 분석가. 차분히 듣고 깊게 답합니다."
            className="bg-bg-elev-2 text-text placeholder:text-text-3 focus:border-brand border-border-hi resize-none rounded-sm border px-3 py-2.5 text-sm outline-none"
            {...register('description')}
          />
        </div>

        <div
          role="note"
          className="border-border bg-bg-elev-2 flex items-start gap-2 rounded-sm border p-3"
        >
          <span className="text-brand text-mono-meta mt-px font-mono" aria-hidden="true">
            i
          </span>
          <p className="text-body-sm text-text-2">
            이름과 설명은 나중에 프로필에서 수정할 수 있습니다
          </p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            void navigate('/onboarding/welcome');
          }}
        >
          ← 이전
        </Button>
        <Button type="submit">다음 →</Button>
      </div>
    </form>
  );
}
