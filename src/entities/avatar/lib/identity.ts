// 아바타 identity 색 — 아바타가 소유하는 이름 있는 10색(정본 _ds/tokens/colors.css).
// 서버 Avatar.color 는 `#` 없는 6자리 hex 라 이름이 아니라 hex 를 저장·전송하고, 화면에서는 이름으로 되돌려 토큰 클래스를 쓴다.
// hex 는 토큰의 사본이다 — 어긋나지 않게 identity.test.ts 가 tokens/colors.css 와 대조한다.
export const AVATAR_IDENTITY_COLORS = [
  { name: 'red', label: '빨강', hex: 'C92F33' },
  { name: 'orange', label: '주황', hex: 'DC7100' },
  { name: 'yellow', label: '노랑', hex: 'E7C100' },
  { name: 'green', label: '초록', hex: '33903C' },
  { name: 'blue', label: '파랑', hex: '2466C3' },
  { name: 'navy', label: '남색', hex: '2C3886' },
  { name: 'violet', label: '보라', hex: '9F50B7' },
  { name: 'brown', label: '갈색', hex: '784C26' },
  { name: 'sky', label: '하늘', hex: '67C4F2' },
  { name: 'pink', label: '핑크', hex: 'E887B6' },
] as const;

export type AvatarIdentityName = (typeof AVATAR_IDENTITY_COLORS)[number]['name'];
/** `none` 은 11번째 색이 아니라 색을 고르지 않은(또는 풀 밖 색의) 아바타다. */
export type AvatarIdentity = AvatarIdentityName | 'none';

// 정본 와이어프레임 S-02-02 의 ColorPicker 초기값.
export const DEFAULT_AVATAR_IDENTITY: AvatarIdentityName = 'navy';

// Tailwind 는 템플릿 문자열로 조립한 클래스를 만들지 않으므로 글자 그대로 적는다.
export const AVATAR_IDENTITY_CLASS: Record<AvatarIdentity, string> = {
  red: 'bg-id-red text-id-red-fg',
  orange: 'bg-id-orange text-id-orange-fg',
  yellow: 'bg-id-yellow text-id-yellow-fg',
  green: 'bg-id-green text-id-green-fg',
  blue: 'bg-id-blue text-id-blue-fg',
  navy: 'bg-id-navy text-id-navy-fg',
  violet: 'bg-id-violet text-id-violet-fg',
  brown: 'bg-id-brown text-id-brown-fg',
  sky: 'bg-id-sky text-id-sky-fg',
  pink: 'bg-id-pink text-id-pink-fg',
  none: 'bg-id-none text-id-none-fg',
};

// 서버 기본값(2451A9)은 풀에 없는 색이라 none 으로 떨어진다 — 고른 적 없는 아바타를 회색으로 두는 게 맞다.
export function identityFromHex(hex: string | undefined): AvatarIdentity {
  if (hex === undefined) return 'none';
  const upper = hex.toUpperCase();
  return AVATAR_IDENTITY_COLORS.find((color) => color.hex === upper)?.name ?? 'none';
}

export function identityHex(name: AvatarIdentityName): string {
  const color = AVATAR_IDENTITY_COLORS.find((c) => c.name === name);
  /* v8 ignore next */
  if (color === undefined) throw new Error(`Unknown avatar identity: ${name}`);
  return color.hex;
}
