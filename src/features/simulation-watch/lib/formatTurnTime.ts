const TURN_TIME_FORMAT = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function formatTurnTime(iso: string): string {
  return TURN_TIME_FORMAT.format(new Date(iso));
}
