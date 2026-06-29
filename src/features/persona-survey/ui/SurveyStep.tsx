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
import { Tag } from '@shared/ui/Tag/Tag';
import { useSurveyQuestions } from '../api/useSurveyQuestions';
import { useSurveySubmit } from '../api/useSurveySubmit';
import { loadDraft, saveDraft, clearDraft } from '../lib/draftStorage';
import { SurveyQuestion } from './SurveyQuestion';
import { ExpressionsField } from './ExpressionsField';

export function SurveyStep() {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [expressions, setExpressions] = useState<string[]>(() => loadDraft()?.expressions ?? []);
  const expressionsRef = useRef<string[]>(expressions);
  const draftRestoredRef = useRef(false);
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onboardingProgress = getOnboardingProgress();
  const guardFailed = onboardingProgress !== 'creating';

  const {
    data: questions,
    isLoading,
    isError,
    refetch,
  } = useSurveyQuestions({ enabled: !guardFailed });

  // 와이어프레임 v2 단계 순서: welcome → intro → method → (creating)survey/connect → complete.
  useEffect(() => {
    if (!guardFailed) return;
    if (onboardingProgress === 'welcome') {
      void navigate('/onboarding/welcome', { replace: true });
    } else if (onboardingProgress === 'intro') {
      void navigate('/onboarding/intro', { replace: true });
    } else if (onboardingProgress === 'method') {
      void navigate('/onboarding/method', { replace: true });
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
          // 표현은 RHF 폼 밖 로컬 상태라 ref 로 보존한다.
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

  // 페이지: [질문 0..N-1, 자주 쓰는 표현(선택)]. 표현 단계가 마지막 = 제출 단계.
  // 진행 카운터는 질문만 센다(n/6). 표현 단계는 별도 화면으로 카운터 없이 '선택' 태그만 표시 (프로토타입 정본).
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

  const persistExpressions = (next: string[]) => {
    setExpressions(next);
    expressionsRef.current = next;
    const values = form.getValues();
    const answersMap = values.answers.reduce<Record<string, string>>((acc, ans) => {
      if (ans.questionId && ans.answerId) acc[ans.questionId] = ans.answerId;
      return acc;
    }, {});
    saveDraft({
      answers: answersMap,
      avatarName: values.avatarName,
      description: values.description,
      expressions: next,
    });
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
  });

  const handleSkip = () => {
    // 표현 단계 건너뛰기 — 표현을 비우고 제출한다.
    persistExpressions([]);
    void onSubmit();
  };

  const questionCount = questions.length;
  const percent = isExpressionsPage ? 100 : Math.round(((pageIndex + 1) / questionCount) * 100);
  const headerSubtitle = isExpressionsPage
    ? '자주 쓰는 표현'
    : `${pageIndex + 1} / ${questionCount} · ${currentQuestion?.title ?? '질문'}`;

  return (
    <form
      onSubmit={(e) => {
        void onSubmit(e);
      }}
      noValidate
      className="mx-auto flex w-full max-w-[480px] flex-col gap-5 py-6"
    >
      <p role="status" aria-live="polite" className="sr-only">
        {isExpressionsPage
          ? '자주 쓰는 표현 입력 (선택)'
          : `질문 ${pageIndex + 1} / ${questions.length}`}
      </p>

      <header className="flex flex-col gap-2">
        <span className="text-mono-micro text-text-3 font-mono tracking-wider uppercase">
          STEP 3 / 4 · 성향 설문
        </span>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-ui text-subheading text-text">{headerSubtitle}</span>
            {isExpressionsPage && <Tag>선택</Tag>}
          </div>
          <span className="text-mono-meta text-brand font-mono">{percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="설문 진행률"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="bg-bg-elev-3 h-1 w-full overflow-hidden rounded-sm"
        >
          <div
            className="bg-brand h-full rounded-sm transition-[width] duration-[var(--duration-base)] ease-[var(--ease)]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </header>

      {isExpressionsPage ? (
        <div className="flex flex-col gap-3">
          <p className="text-body-sm text-text-2">
            아바타가 더 나답게 말할 수 있도록, 평소 자주 쓰는 말투·표현·이모지를 알려주세요.
          </p>
          <p className="text-mono-micro text-text-3 font-mono">예) 그치 그치, ~인 듯, 🥲✨</p>
          <ExpressionsField value={expressions} onChange={persistExpressions} />
        </div>
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
        {isExpressionsPage ? (
          <>
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={handleSkip}>
              건너뛰기
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? '생성 중...' : '아바타 생성'}
            </Button>
          </>
        ) : (
          <Button type="button" disabled={!currentAnswered} onClick={handleNext} className="flex-1">
            다음
          </Button>
        )}
      </div>
    </form>
  );
}
