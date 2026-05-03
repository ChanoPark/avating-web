export const SUPPORT_EMAIL_HREF = 'mailto:support@avating.com';
export const STATUS_PAGE_URL = 'https://status.avating.com';

// 백엔드 GET /api/persona/survey/questions 의 questionCount 파라미터.
// 의미: primaryType 카테고리당 N 개씩 무작위로 질문을 반환받는다.
// 현재 설문은 카테고리 2개(AFFECTION_EXPRESSION, EMPATHY) × 1 = 2 질문.
// 추후 운영에서 N을 변경해야 한다면 이 상수만 조정.
export const SURVEY_QUESTION_COUNT_PER_CATEGORY = 1;
