/**
 * 서버 에러 코드 상수.
 *
 * 형식은 `{DOMAIN}_{HTTP상태}_{순번}` 이고 정본은 실행 중인 서버의 `/v3/api-docs` 다
 * (스냅샷: `.claude/notes/qa-scripts/apidocs.json`).
 * 여기 없는 코드를 FE 가 지어내면 안 된다 — `EMAIL_CONFLICT` 처럼 서버가 한 번도 보낸 적 없는
 * 문자열을 분기 조건으로 쓰다가 필드 인라인 에러가 통째로 죽은 적이 있다(실서버 QA S4).
 */
export const SERVER_ERROR_CODES = {
  /** 로그인 비밀번호 불일치 */
  AUTH_PASSWORD_MISMATCH: 'AUTH_400_002',
  /** 로그인 대상 회원 없음 */
  AUTH_MEMBER_NOT_FOUND: 'AUTH_404_001',
  /** 비밀번호 정책 위반 — 사용자가 고칠 수 있다 */
  AUTH_PASSWORD_POLICY: 'AUTH_422_001',
  /** 비밀번호 정책 위반(강도) — 사용자가 고칠 수 있다 */
  AUTH_PASSWORD_POLICY_WEAK: 'AUTH_422_002',
  /** RSA 복호화 실패 — 공개키·암호화 구현 문제라 사용자가 고칠 수 없다 */
  AUTH_DECRYPT_FAILED: 'AUTH_422_003',
  /** 이메일 중복 */
  MEMBER_EMAIL_CONFLICT: 'MEMBER_409_001',
  /** 닉네임 중복 */
  MEMBER_NICKNAME_CONFLICT: 'MEMBER_409_002',
} as const;
