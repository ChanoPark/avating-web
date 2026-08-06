export const SUPPORT_EMAIL_HREF = 'mailto:support@avating.com';
export const STATUS_PAGE_URL = 'https://status.avating.com';

// 백엔드 GET /api/persona/survey/questions 의 questionCount 파라미터.
// 의미: 지표(PersonaStatType)당 N 개씩 무작위로 질문을 반환받는다. 지표는 7종이다.
// 총 문항 수 = 7 × N 이지만 서버 시딩 상태에 따라 달라지므로 **UI 문구에 총 문항 수를 적지 않는다.**
// 추후 운영에서 N을 변경해야 한다면 이 상수만 조정.
export const SURVEY_QUESTION_COUNT_PER_CATEGORY = 1;
