const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const LONG_AGO_FROM = 8 * DAY;

export function formatRequestedAt(requestedAt: string, now: number = Date.now()): string {
  const elapsed = now - Date.parse(requestedAt);
  if (Number.isNaN(elapsed)) return '';
  if (elapsed < MINUTE) return '방금';
  if (elapsed >= LONG_AGO_FROM) return '오래 전';

  const days = Math.floor(elapsed / DAY);
  const hours = Math.floor((elapsed % DAY) / HOUR);
  const minutes = Math.floor((elapsed % HOUR) / MINUTE);
  const parts = [
    days > 0 ? `${days}일` : '',
    hours > 0 ? `${hours}시간` : '',
    minutes > 0 ? `${minutes}분` : '',
  ].filter((part) => part !== '');
  return `${parts.join(' ')} 전`;
}
