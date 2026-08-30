import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodError } from 'zod';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getOnboardingProgress, setOnboardingProgress } from '@entities/onboarding';
import { useOnboardingCompletion } from '@entities/onboarding/api/useOnboardingCompletion';
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
import { ExpressionsField } from './ExpressionsField';
import { WIZARD_ACTIONS, WIZARD_BODY, WIZARD_HEAD } from '@shared/ui/wizard';

export function SurveyStep() {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [interestTags, setInterestTags] = useState<string[]>(() => loadDraft()?.interestTags ?? []);
  const [expressions, setExpressions] = useState<string[]>(() => loadDraft()?.expressions ?? []);
  const interestTagsRef = useRef<string[]>(interestTags);
  const expressionsRef = useRef<string[]>(expressions);
  const draftRestoredRef = useRef(false);
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onboardingProgress = getOnboardingProgress();
  const { hasPrimaryAvatar } = useOnboardingCompletion();
  // complete 기록만으론 완료를 보장 못한다 — 대표 아바타가 없으면 여기 머문다 (되돌리면 왕복만 생긴다).
  const guardFailed =
    onboardingProgress !== 'creating' && !(onboardingProgress === 'complete' && !hasPrimaryAvatar);

  const {
    data: questions,
    isLoading,
    isError,
    refetch,
  } = useSurveyQuestions({ enabled: !guardFailed });

  useEffect(() => {
    if (!guardFailed) return;
    if (onboardingProgress === 'welcome') {
      void navigate('/onboarding/welcome', { replace: true });
    } else if (onboardingProgress === 'intro') {
      void navigate('/onboarding/intro', { replace: true });
    } else {
      void navigate('/onboarding/complete', { replace: true });
    }
  }, [guardFailed, onboardingProgress, navigate]);

  const form = useForm<AvatarCreateFromSurveyRequest>({
    resolver: zodResolver(avatarCreateFromSurveyRequestSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    // 이름·설명은 IntroStep(Step 1)에서 draft 로 저장되어 아래 복원 effect 로 채워진다.
    defaultValues: { avatarName: '', description: '', answers: [] },
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
        if (!q.answers.some((a) => a.answerId === answerId)) return null;
        return { questionId, questionType: q.questionType, answerId };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);

    form.reset({
      avatarName: draft.avatarName ?? '',
      description: draft.description ?? '',
      answers: restoredAnswers,
    });

    if (draft.interestTags && draft.interestTags.length > 0) {
      setInterestTags(draft.interestTags);
      interestTagsRef.current = draft.interestTags;
    }

    if (draft.expressions && draft.expressions.length > 0) {
      setExpressions(draft.expressions);
      expressionsRef.current = draft.expressions;
    }
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
          // 관심사·표현은 RHF 폼 밖 로컬 상태라 ref 로 보존한다.
          interestTags: interestTagsRef.current,
          expressions: expressionsRef.current,
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
      <div className={WIZARD_BODY}>
        <p className="text-body-sm text-ink-secondary">질문을 불러오는 중...</p>
      </div>
    );
  }

  if (isError || !questions) {
    return (
      <div className={WIZARD_BODY}>
        <p className="text-body-sm text-danger" role="alert">
          질문을 불러오지 못했습니다. 다시 시도해주세요.
        </p>
        <div>
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
      </div>
    );
  }

  const isExpressionsPage = pageIndex === questions.length;
  const isFirstPage = pageIndex === 0;
  const currentQuestion: SurveyQuestionModel | null = !isExpressionsPage
    ? (questions[pageIndex] ?? null)
    : null;

  const watchedAnswers = form.watch('answers');
  const currentAnswered = isExpressionsPage
    ? true
    : currentQuestion != null &&
      watchedAnswers.some((a) => a.questionId === currentQuestion.id && a.answerId);

  const getCurrentAnswerId = (questionId: string): string | undefined =>
    watchedAnswers.find((a) => a.questionId === questionId)?.answerId;

  const handleAnswer = (question: SurveyQuestionModel, answerId: string) => {
    const current = form.getValues('answers');
    const next = [
      ...current.filter((a) => a.questionId !== question.id),
      { questionId: question.id, questionType: question.questionType, answerId },
    ];
    form.setValue('answers', next, { shouldDirty: true });
  };

  const handleNext = () => {
    setPageIndex((p) => p + 1);
  };

  const handlePrev = () => {
    setPageIndex((p) => p - 1);
  };

  const persistOptionalTraits = (nextTags: string[], nextExpressions: string[]) => {
    setInterestTags(nextTags);
    interestTagsRef.current = nextTags;
    setExpressions(nextExpressions);
    expressionsRef.current = nextExpressions;
    const values = form.getValues();
    const answersMap = values.answers.reduce<Record<string, string>>((acc, ans) => {
      if (ans.questionId && ans.answerId) acc[ans.questionId] = ans.answerId;
      return acc;
    }, {});
    saveDraft({
      answers: answersMap,
      avatarName: values.avatarName,
      description: values.description,
      interestTags: nextTags,
      expressions: nextExpressions,
    });
  };

  // 이름·설명은 이 화면에 입력 필드가 없어 RHF 필드 에러가 안 보인다 — Step 1 로 돌아가라고 알려준다.
  const onInvalid = (errors: FieldErrors<AvatarCreateFromSurveyRequest>) => {
    if (errors.avatarName ?? errors.description) {
      setSubmitError('아바타 이름과 설명이 필요해요. 1단계로 돌아가 입력해주세요.');
    }
  };

  const onSubmit = form.handleSubmit(async (data) => {
    setSubmitError(null);
    try {
      await createAvatar(data);
      if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
      clearDraft();
      setOnboardingProgress('complete');
      void navigate('/onboarding/complete');
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        setSubmitError('입력 데이터를 다시 확인해주세요.');
        return;
      }
      const fallback = '제출 중 오류가 발생했습니다. 다시 시도해주세요.';
      const message = err instanceof Error && err.message.length > 0 ? err.message : fallback;
      setSubmitError(message);
    }
  }, onInvalid);

  const handleSkip = () => {
    persistOptionalTraits([], []);
    void onSubmit();
  };

  // totalPages 는 질문 수에 표현 단계 1페이지를 더한 값이다 — 표현 단계도 정본의 마지막 '선택 문항'이다.
  const totalPages = questions.length + 1;
  const pageNumber = pageIndex + 1;
  const percent = Math.round((pageNumber / totalPages) * 100);
  // 질문 모델에 사람이 읽을 카테고리 필드가 없어(primaryType 은 서버 enum) 표현 단계에만 부제를 붙인다.
  const progressLabel = isExpressionsPage
    ? `${pageNumber} / ${totalPages} · 선택 문항`
    : `${pageNumber} / ${totalPages}`;

  return (
    <form
      onSubmit={(e) => {
        void onSubmit(e);
      }}
      noValidate
      className="flex flex-col"
    >
      <div className={WIZARD_BODY}>
        <p role="status" aria-live="polite" className="sr-only">
          {isExpressionsPage
            ? `관심사 태그와 자주 쓰는 표현 입력 (선택) ${progressLabel}`
            : `질문 ${progressLabel}`}
        </p>

        <div className={WIZARD_HEAD}>
          {isExpressionsPage ? (
            <>
              <span className="text-micro-cap text-ink-mute uppercase">
                A · 설문으로 만들기 — 선택 문항
              </span>
              <h1 className="text-heading-lg text-ink">관심사와 자주 쓰는 말투를 알려주세요</h1>
              <p className="text-body-sm text-ink-mute">
                아바타가 더 나답게 말하고, 결이 맞는 상대를 찾는 데 쓰여요.
              </p>
            </>
          ) : (
            <h1 className="text-heading-lg text-ink">{currentQuestion?.title ?? '질문'}</h1>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-caption text-ink-mute tnum">{progressLabel}</span>
          <span className="text-caption text-primary tnum">{percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="설문 진행률"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="bg-canvas-soft h-1 w-full overflow-hidden rounded-full"
        >
          <div
            className="bg-primary ease-brand h-full rounded-full transition-[width] duration-[var(--dur)]"
            style={{ width: `${percent}%` }}
          />
        </div>

        {isExpressionsPage ? (
          <ExpressionsField
            interestTags={interestTags}
            onInterestTagsChange={(next) => {
              persistOptionalTraits(next, expressionsRef.current);
            }}
            expressions={expressions}
            onExpressionsChange={(next) => {
              persistOptionalTraits(interestTagsRef.current, next);
            }}
          />
        ) : currentQuestion ? (
          <SurveyQuestion
            name={currentQuestion.id}
            question={currentQuestion.title}
            options={currentQuestion.answers}
            value={getCurrentAnswerId(currentQuestion.id)}
            onChange={(answerId) => {
              handleAnswer(currentQuestion, answerId);
            }}
          />
        ) : null}

        {submitError && (
          <p
            role="alert"
            className="text-caption text-danger border-danger rounded-sm border px-3 py-2"
          >
            {submitError}
          </p>
        )}
      </div>

      <div className={WIZARD_ACTIONS}>
        {!isFirstPage && (
          <Button type="button" variant="ghost" onClick={handlePrev}>
            <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
            이전
          </Button>
        )}
        {/* 첫 페이지엔 '이전' 이 없어 좌측 슬롯이 비므로 우측 그룹을 ml-auto 로 밀어 둔다. */}
        {isExpressionsPage ? (
          <div className="ml-auto flex items-center gap-2">
            <Button type="button" variant="ghost" disabled={isSubmitting} onClick={handleSkip}>
              건너뛰기
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '생성 중...' : '아바타 생성'}
              <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            disabled={!currentAnswered}
            onClick={handleNext}
            className="ml-auto"
          >
            다음
            <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </Button>
        )}
      </div>
    </form>
  );
}
