// 정본은 서버 /v3/api-docs 다 — 여기 없는 코드를 지어내면 안 된다. 서버가 보내지 않는
// 문자열로 분기하면 그 필드의 인라인 에러가 통째로 죽는다.
export const SERVER_ERROR_CODES = {
  AUTH_PASSWORD_MISMATCH: 'AUTH_400_002',
  AUTH_MEMBER_NOT_FOUND: 'AUTH_404_001',
  AUTH_PASSWORD_POLICY: 'AUTH_422_001',
  AUTH_PASSWORD_POLICY_WEAK: 'AUTH_422_002',
  /** 공개키·암호화 구현 문제라 사용자가 고칠 수 없다(비밀번호를 다시 입력해도 소용없다). */
  AUTH_DECRYPT_FAILED: 'AUTH_422_003',
  MEMBER_EMAIL_CONFLICT: 'MEMBER_409_001',
  MEMBER_NICKNAME_CONFLICT: 'MEMBER_409_002',
} as const;
