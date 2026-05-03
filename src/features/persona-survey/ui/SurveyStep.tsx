import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { setOnboardingProgress } from '@entities/onboarding';
import { useSurveyQuestions } from '../api/useSurveyQuestions';
import { useSurveySubmit } from '../api/useSurveySubmit';
import { loadDraft, saveDraft, clearDraft } from '../lib/draftStorage';
import { SurveyQuestion } from './SurveyQuestion';
import { Button } from '@shared/ui/Button/Button';

export function SurveyStep() {
  const navigate = useNavigate();
  const { data: questions, isLoading, isError } = useSurveyQuestions();
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [avatarName, setAvatarName] = useState('');
  const [description, setDescription] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { mutateAsync: createAvatar, isPending: isSubmitting } = useSurveySubmit();

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setAnswers(draft.answers);
      if (draft.avatarName) setAvatarName(draft.avatarName);
      if (draft.description) setDescription(draft.description);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-body text-text-2">질문을 불러오는 중...</p>
      </div>
    );
  }

  if (isError || !questions) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-body text-danger">질문을 불러오지 못했습니다. 다시 시도해주세요.</p>
      </div>
    );
  }

  const isAvatarNamePage = pageIndex === questions.length;
  const isFirstPage = pageIndex === 0;
  const currentQuestion = !isAvatarNamePage ? questions[pageIndex] : null;
  const currentAnswered = isAvatarNamePage
    ? avatarName.trim().length > 0
    : currentQuestion != null && Boolean(answers[currentQuestion.id]);

  const persistDraft = (currentAnswers: Record<string, string>, name: string, desc: string) => {
    saveDraft({ answers: currentAnswers, avatarName: name, description: desc });
  };

  const handleNext = () => {
    persistDraft(answers, avatarName, description);
    setPageIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    persistDraft(answers, avatarName, description);
    setPageIndex((prev) => prev - 1);
  };

  const handleAnswer = (questionId: string, answerId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerId }));
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    try {
      await createAvatar({
        avatarName: avatarName.trim(),
        description: description.trim(),
        answers: questions.map((q) => ({
          questionId: q.id,
          questionType: q.questionType,
          answerId: answers[q.id] ?? '',
        })),
      });
      clearDraft();
      setOnboardingProgress('connect');
      void navigate('/onboarding/connect');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '올바르지 않습니다. 다시 시도해주세요.';
      setSubmitError(message);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-4 py-8">
      {currentQuestion ? (
        <SurveyQuestion
          name={currentQuestion.id}
          question={currentQuestion.title}
          options={currentQuestion.answers}
          value={answers[currentQuestion.id]}
          onChange={(answerId) => {
            handleAnswer(currentQuestion.id, answerId);
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
              value={avatarName}
              onChange={(e) => {
                setAvatarName(e.target.value);
              }}
              placeholder="아바타 이름을 입력하세요"
              maxLength={50}
              className="border-border bg-bg-elev-2 text-text placeholder:text-text-3 focus:border-brand rounded-sm border px-3 py-2.5 text-sm outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-body text-text">
              소개 <span className="text-text-3 text-sm">(선택)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              placeholder="아바타를 간단히 소개해주세요"
              maxLength={200}
              rows={3}
              className="border-border bg-bg-elev-2 text-text placeholder:text-text-3 focus:border-brand resize-none rounded-sm border px-3 py-2.5 text-sm outline-none"
            />
          </div>
        </div>
      )}

      {submitError && (
        <p
          className="text-body-sm text-danger border-danger rounded-sm border px-3 py-2"
          aria-invalid="true"
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
          <Button
            type="button"
            disabled={!currentAnswered || isSubmitting}
            onClick={() => void handleSubmit()}
            className="flex-1"
          >
            {isSubmitting ? '생성 중...' : '아바타 생성'}
          </Button>
        ) : (
          <Button type="button" disabled={!currentAnswered} onClick={handleNext} className="flex-1">
            다음
          </Button>
        )}
      </div>
    </div>
  );
}
