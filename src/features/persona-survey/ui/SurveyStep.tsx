import { useEffect, useState } from 'react';
import { useForm, type Path, type PathValue } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { surveyResponseSchema } from '@entities/onboarding/model';
import type { SurveyResponse } from '@entities/onboarding/model';
import { setOnboardingProgress } from '@entities/onboarding';
import { useSurveySubmit } from '../api/useSurveySubmit';
import { useSurveyDraft } from '../api/useSurveyDraft';
import { loadDraft, saveDraft, clearDraft } from '../lib/draftStorage';
import { SurveyQuestion } from './SurveyQuestion';
import { Button } from '@shared/ui/Button/Button';

const PAGES = {
  questions: [
    '모임에서 당신은 주로 어떤 편인가요?',
    '호감 있는 상대에게 먼저 다가가는 편인가요?',
    '첫 데이트 장소로 선호하는 곳은?',
    '대화 스타일은 어떤 편인가요?',
    '갈등 상황에서 주로 어떻게 반응하나요?',
    '연애에서 가장 중요하게 생각하는 것은?',
  ],
  options: {
    q1: [
      { value: 'solo', label: '혼자 조용히 있는 편' },
      { value: 'few', label: '소수 친한 사람과' },
      { value: 'crowd', label: '여러 사람과 어울리는 편' },
      { value: 'mood', label: '그때그때 다름' },
    ],
    q2: [
      { value: 'wait', label: '상대가 먼저 다가올 때까지 기다림' },
      { value: 'signal', label: '신호를 보내고 반응 확인' },
      { value: 'active', label: '적극적으로 먼저 다가감' },
      { value: 'situation', label: '상황에 따라 다름' },
    ],
    q3: [
      { value: 'cafe', label: '카페·디저트' },
      { value: 'culture', label: '전시·영화·공연' },
      { value: 'outdoor', label: '공원·야외' },
      { value: 'food', label: '맛집·식사' },
    ],
    q4: [
      { value: 'brief', label: '짧고 핵심만' },
      { value: 'detailed', label: '상세하게 설명' },
      { value: 'match', label: '상대 스타일에 맞춤' },
      { value: 'offline', label: '직접 만나서' },
    ],
    q5: [
      { value: 'calm', label: '차분하게 대화로 해결' },
      { value: 'talk', label: '즉시 이야기하는 편' },
      { value: 'wait_conflict', label: '잠시 냉각 후 대화' },
      { value: 'avoid', label: '가능하면 갈등 자체를 피함' },
    ],
    q6: [
      { value: 'conversation', label: '대화와 소통' },
      { value: 'hobby', label: '공통 관심사' },
      { value: 'stability', label: '안정감과 신뢰' },
      { value: 'excitement', label: '설렘과 재미' },
    ],
  },
};

const PAGE_FIELD_SETS: (keyof SurveyResponse)[][] = [
  ['q1', 'q2'],
  ['q3', 'q4'],
  ['q5', 'q6'],
];

const QUESTION_INDEX: Record<keyof SurveyResponse, number> = {
  q1: 0,
  q2: 1,
  q3: 2,
  q4: 3,
  q5: 4,
  q6: 5,
};

// 진입 가드 부재는 의도적 — 사용자가 답변을 다시 수정하거나 draft 를 이어서
// 작성하기 위해 어떤 진행률에서도 재진입할 수 있어야 한다.
export function SurveyStep() {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { mutateAsync: submitSurvey, isPending: isSubmitting } = useSurveySubmit();
  const { mutateAsync: saveDraftApi } = useSurveyDraft();

  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SurveyResponse>({
    resolver: zodResolver(surveyResponseSchema),
    mode: 'onSubmit',
  });

  const allValues = watch();
  const currentFields = PAGE_FIELD_SETS[pageIndex] ?? [];
  const allCurrentAnswered = currentFields.every((f) => Boolean(allValues[f]));

  useEffect(() => {
    const draft = loadDraft();
    if (draft && Object.keys(draft).length > 0) {
      reset(draft as SurveyResponse);
    }
  }, [reset]);

  const persistDraft = (values: Partial<SurveyResponse>) => {
    saveDraft(values);
    saveDraftApi(values).catch(() => undefined);
  };

  const handleNext = () => {
    persistDraft(allValues);
    setPageIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    persistDraft(allValues);
    setPageIndex((prev) => prev - 1);
  };

  const onSubmit = async (data: SurveyResponse) => {
    setSubmitError(null);
    try {
      await submitSurvey(data);
      clearDraft();
      setOnboardingProgress('connect');
      void navigate('/onboarding/connect');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '올바르지 않습니다. 다시 시도해주세요.';
      setSubmitError(message);
    }
  };

  const isLastPage = pageIndex === PAGE_FIELD_SETS.length - 1;
  const isFirstPage = pageIndex === 0;

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-4">
        {currentFields.map((field) => {
          const qIdx = QUESTION_INDEX[field];
          const fieldOptions = PAGES.options[field];
          const fieldError = errors[field]?.message;
          return (
            <SurveyQuestion
              key={field}
              name={field}
              question={PAGES.questions[qIdx] ?? ''}
              options={fieldOptions}
              value={allValues[field]}
              onChange={(val) => {
                setValue(field, val as PathValue<SurveyResponse, Path<SurveyResponse>>);
              }}
              {...(fieldError !== undefined ? { error: fieldError } : {})}
            />
          );
        })}
      </div>

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
        {isLastPage ? (
          <Button
            type="button"
            disabled={!allCurrentAnswered || isSubmitting}
            onClick={() => {
              void handleSubmit(onSubmit)();
            }}
            className="flex-1"
          >
            {isSubmitting ? '제출 중...' : '완료'}
          </Button>
        ) : (
          <Button
            type="button"
            disabled={!allCurrentAnswered}
            onClick={handleNext}
            className="flex-1"
          >
            다음
          </Button>
        )}
      </div>
    </div>
  );
}
