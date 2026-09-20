/**
 * `<input type="datetime-local">` 값과 서버의 LocalDateTime 문자열 사이 변환.
 *
 * **toISOString() 을 쓰면 안 된다.** 서버는 시간대 없는 LocalDateTime 이고 DB 커넥션이
 * Asia/Seoul 이라, 관리자가 화면에 적은 한국 시각이 그대로 저장되어야 한다.
 * UTC 로 바꿔 보내면 9시간 밀린 시각으로 점검이 잡힌다.
 */

/** '2026-09-21T02:00' → '2026-09-21T02:00:00' */
export const toServerDateTime = (value: string) => (value.length === 16 ? `${value}:00` : value);

/** '2026-09-21T02:00:00' → '2026-09-21T02:00' (input 이 초를 안 받는다) */
export const toInputDateTime = (value?: string | null) => (value ? value.slice(0, 16) : '');

/** 폼 기본값으로 쓸 '지금'. 로컬 시각 그대로여야 하므로 toISOString 을 거치지 않는다 */
export function nowForInput(offsetMinutes = 0) {
  const d = new Date(Date.now() + offsetMinutes * 60_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
