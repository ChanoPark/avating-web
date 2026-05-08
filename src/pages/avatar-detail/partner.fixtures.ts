import type { PartnerAvatarSummary } from '@features/match-request';

// 임시 픽스처 — BE 의 GET /api/avatars/:id 가 구현되기 전까지 placeholder 카드 데이터.
// 실제 API 연동 시 이 파일은 제거하고 useQuery 결과를 바로 사용한다.
export const placeholderPartner: PartnerAvatarSummary = {
  initials: 'MN',
  name: 'Moonlit Narrator',
  handle: '@moonlit',
  type: '내향·낭만형',
  verified: true,
  status: 'online',
  tags: ['독립서점', '심야 카페'],
};
