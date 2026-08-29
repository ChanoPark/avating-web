export const MATCH_REQUEST_COST_GEMS = 30;
export const MATCH_REQUEST_GREETING_MAX = 100;

// 카운터가 빨강으로 바뀐 뒤에도 사용자가 잠깐 더 입력할 수 있도록 maxLength 에 20자 여유를 둔다.
export const MATCH_REQUEST_GREETING_HARD_LIMIT = MATCH_REQUEST_GREETING_MAX + 20;

// formSchema(features)와 sendMatchRequestSchema(entity)가 이 문자열을 함께 import 한다.
export const MATCH_REQUEST_ERROR_REQUESTER_EMPTY = '사용할 아바타를 선택해주세요';
export const MATCH_REQUEST_ERROR_GREETING_MAX = '첫 인사는 100자 이내로 작성해주세요';
