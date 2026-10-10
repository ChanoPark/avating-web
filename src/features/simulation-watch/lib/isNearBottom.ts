const NEAR_BOTTOM_PX = 48;

type ScrollMetrics = Pick<HTMLElement, 'scrollTop' | 'clientHeight' | 'scrollHeight'>;

export function isNearBottom({ scrollTop, clientHeight, scrollHeight }: ScrollMetrics): boolean {
  return scrollHeight - (scrollTop + clientHeight) <= NEAR_BOTTOM_PX;
}
