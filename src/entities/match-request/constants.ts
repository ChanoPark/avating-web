export const MATCH_REQUEST_COST_GEMS = 30;
export const MATCH_REQUEST_GREETING_MAX = 100;

// 카운터가 빨강으로 전환된 뒤 사용자가 시각적으로 추가 입력이 막혀 있음을 인지할 때까지의
// 여유 입력 폭. textarea maxLength 의 하드 캡으로 사용된다.
export const MATCH_REQUEST_GREETING_HARD_LIMIT = MATCH_REQUEST_GREETING_MAX + 20;

// 검증 메시지 — formSchema(features) 와 sendMatchRequestSchema(entity) 가 동일 문자열을 import.
export const MATCH_REQUEST_ERROR_REQUESTER_EMPTY = '사용할 아바타를 선택해주세요';
export const MATCH_REQUEST_ERROR_GREETING_MAX = '첫 인사는 100자 이내로 작성해주세요';
