// 아바타 이미지가 없어 이름 첫 글자를 identity 색 타일에 올린다.
// Array.from 은 코드 포인트 단위라 이모지 같은 서로게이트 쌍을 반으로 자르지 않는다.
export function avatarInitial(name: string): string {
  return Array.from(name)[0] ?? '';
}
