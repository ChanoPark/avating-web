import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodError } from 'zod';
import { getOnboardingProgress, setOnboardingProgress } from '@entities/onboarding';
import {
  avatarCreateFromSurveyRequestSchema,
  type AvatarCreateFromSurveyRequest,
  type SurveyQuestion as SurveyQuestionModel,
} from '@entities/onboarding/model';
import { Button } from '@shared/ui/Button/Button';
import { useSurveyQuestions } from '../api/useSurveyQuestions';
import { useSurveySubmit } from '../api/useSurveySubmit';
import { loadDraft, saveDraft, clearDraft } from '../lib/draftStorage';
import { SurveyQuestion } from './SurveyQuestion';

export function SurveyStep() {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const draftRestoredRef = useRef(false);
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onboardingProgress = getOnboardingProgress();
  const guardFailed = onboardingProgress !== 'welcome';

  const {
    data: questions,
    isLoading,
    isError,
    refetch,
  } = useSurveyQuestions({ enabled: !guardFailed });

  useEffect(() => {
    if (guardFailed) {
      void navigate(`/onboarding/${onboardingProgress}`, { replace: true });
    }
  }, [guardFailed, onboardingProgress, navigate]);

  const form = useForm<AvatarCreateFromSurveyRequest>({
    resolver: zodResolver(avatarCreateFromSurveyRequestSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      avatarName: '',
      description: '',
      answers: [],
    },
  });

  const { mutateAsync: createAvatar, isPending: isSubmitting } = useSurveySubmit();

  useEffect(() => {
    if (!questions || draftRestoredRef.current) return;
    draftRestoredRef.current = true;

    const draft = loadDraft();
    if (!draft) return;

    const restoredAnswers = Object.entries(draft.answers)
      .map(([questionId, answerId]) => {
        const q = questions.find((qq) => qq.id === questionId);
        if (!q) return null;
        // 질문 카탈로그가 갱신되어 stale answerId 가 들어있을 수 있으므로 교차검증.
        if (!q.answers.some((a) => a.answerId === answerId)) return null;
        return { questionId, questionType: q.questionType, answerId };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);

    form.reset({
      avatarName: draft.avatarName ?? '',
      description: draft.description ?? '',
      answers: restoredAnswers,
    });
  }, [questions, form]);

  useEffect(() => {
    const subscription = form.watch((values) => {
      if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
      draftSaveTimerRef.current = setTimeout(() => {
        const answersMap = (values.answers ?? []).reduce<Record<string, string>>((acc, ans) => {
          if (ans.questionId && ans.answerId) acc[ans.questionId] = ans.answerId;
          return acc;
        }, {});
        saveDraft({
          answers: answersMap,
          avatarName: values.avatarName ?? '',
          description: values.description ?? '',
        });
      }, 300);
    });
    return () => {
      subscription.unsubscribe();
      if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
    };
  }, [form]);

  if (guardFailed) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-body text-text-2">질문을 불러오는 중...</p>
      </div>
    );
  }

  if (isError || !questions) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-body text-danger" role="alert">
          질문을 불러오지 못했습니다. 다시 시도해주세요.
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            void refetch();
          }}
        >
          다시 시도
        </Button>
      </div>
    );
  }

  const isAvatarNamePage = pageIndex === questions.length;
  const isFirstPage = pageIndex === 0;
  const currentQuestion: SurveyQuestionModel | null = !isAvatarNamePage
    ? (questions[pageIndex] ?? null)
    : null;

  const watchedAnswers = form.watch('answers');
  const watchedName = form.watch('avatarName');

  const currentAnswered = isAvatarNamePage
    ? watchedName.trim().length > 0
    : currentQuestion != null &&
      watchedAnswers.some((a) => a.questionId === currentQuestion.id && a.answerId);

  const getCurrentAnswerId = (questionId: string): string | undefined =>
    watchedAnswers.find((a) => a.questionId === questionId)?.answerId;

  const handleAnswer = (question: SurveyQuestionModel, answerId: string) => {
    const current = form.getValues('answers');
    const next = [
      ...current.filter((a) => a.questionId !== question.id),
      {
        questionId: question.id,
        questionType: question.questionType,
        answerId,
      },
    ];
    form.setValue('answers', next, { shouldDirty: true });
  };

  const handleNext = () => {
    setPageIndex((p) => p + 1);
  };

  const handlePrev = () => {
    setPageIndex((p) => p - 1);
  };

  const onSubmit = form.handleSubmit(async (data) => {
    setSubmitError(null);
    try {
      await createAvatar(data);
      if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
      clearDraft();
      setOnboardingProgress('connect');
      void navigate('/onboarding/connect');
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        setSubmitError('입력 데이터를 다시 확인해주세요.');
        return;
      }
      const fallback = '제출 중 오류가 발생했습니다. 다시 시도해주세요.';
      const message = err instanceof Error && err.message.length > 0 ? err.message : fallback;
      setSubmitError(message);
    }
  });

  return (
    <form
      onSubmit={(e) => {
        void onSubmit(e);
      }}
      noValidate
      className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-4 py-8"
    >
      {currentQuestion ? (
        <SurveyQuestion
          name={currentQuestion.id}
          question={currentQuestion.title}
          options={currentQuestion.answers}
          value={getCurrentAnswerId(currentQuestion.id)}
          onChange={(answerId) => {
            handleAnswer(currentQuestion, answerId);
          }}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="avatarName" className="text-body text-text">
              아바타 이름
            </label>
            <input
              id="avatarName"
              type="text"
              maxLength={50}
              placeholder="아바타 이름을 입력하세요"
              aria-invalid={form.formState.errors.avatarName ? 'true' : undefined}
              aria-describedby={form.formState.errors.avatarName ? 'avatarName-error' : undefined}
              className={`bg-bg-elev-2 text-text placeholder:text-text-3 focus:border-brand rounded-sm border px-3 py-2.5 text-sm outline-none ${
                form.formState.errors.avatarName ? 'border-danger' : 'border-border'
              }`}
              {...form.register('avatarName')}
            />
            {form.formState.errors.avatarName?.message && (
              <p id="avatarName-error" className="text-body-sm text-danger">
                {form.formState.errors.avatarName.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-body text-text">
              소개 <span className="text-text-3 text-sm">(선택)</span>
            </label>
            <textarea
              id="description"
              placeholder="아바타를 간단히 소개해주세요"
              maxLength={200}
              rows={3}
              aria-invalid={form.formState.errors.description ? 'true' : undefined}
              aria-describedby={form.formState.errors.description ? 'description-error' : undefined}
              className={`bg-bg-elev-2 text-text placeholder:text-text-3 focus:border-brand resize-none rounded-sm border px-3 py-2.5 text-sm outline-none ${
                form.formState.errors.description ? 'border-danger' : 'border-border'
              }`}
              {...form.register('description')}
            />
            {form.formState.errors.description?.message && (
              <p id="description-error" className="text-body-sm text-danger">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>
        </div>
      )}

      {submitError && (
        <p
          role="alert"
          className="text-body-sm text-danger border-danger rounded-sm border px-3 py-2"
        >
          {submitError}
        </p>
      )}

      <div className="flex gap-3">
        {!isFirstPage && (
          <Button type="button" variant="secondary" onClick={handlePrev}>
            이전
          </Button>
        )}
        {isAvatarNamePage ? (
          <Button type="submit" disabled={!currentAnswered || isSubmitting} className="flex-1">
            {isSubmitting ? '생성 중...' : '아바타 생성'}
          </Button>
        ) : (
          <Button type="button" disabled={!currentAnswered} onClick={handleNext} className="flex-1">
            다음
          </Button>
        )}
      </div>
    </form>
  );
}
