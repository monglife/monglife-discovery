const dateTime = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const date = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

export function formatDateTime(value?: string | number | null) {
  if (!value) return '-';
  return dateTime.format(new Date(value));
}

export function formatDate(value?: string | number | null) {
  if (!value) return '-';
  return date.format(new Date(value));
}

export function formatNumber(value?: number | null) {
  if (value === undefined || value === null) return '-';
  return value.toLocaleString('ko-KR');
}

/** 초 단위 TTL → "1일 2시간" */
export function formatDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return '-';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return [d && `${d}일`, h && `${h}시간`, !d && m && `${m}분`].filter(Boolean).join(' ') || '1분 미만';
}

export function maskToken(token: string, visible = 8) {
  if (token.length <= visible * 2) return token;
  return `${token.slice(0, visible)}…${token.slice(-visible)}`;
}

/** "14:03:27" — 마지막 갱신 시각처럼 같은 날 안에서만 쓰는 표기 */
export function formatTime(value?: string | number | null) {
  if (!value) return '-';
  return new Date(value).toLocaleTimeString('en-GB', { hour12: false });
}
