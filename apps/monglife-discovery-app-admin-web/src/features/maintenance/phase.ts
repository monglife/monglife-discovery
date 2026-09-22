import type { Maintenance, MaintenancePhase } from './types';

/**
 * 일정이 지금 어느 구간에 있는지.
 *
 * 서버가 주는 것은 `active` 하나뿐이다. 나머지(예정·종료·꺼짐)는 표에 상태를 보여 주려고
 * 화면에서 만든다. 브라우저 시계라 초 단위로 어긋날 수 있지만, 실제 판정은 서버가 한
 * `active` 와 상단 배너가 맡으므로 표의 구분만 흔들린다.
 */
export function maintenancePhase(m: Maintenance, now = Date.now()): MaintenancePhase {
  if (m.active) return 'active';
  if (!m.enabled) return 'disabled';
  if (new Date(m.startAt).getTime() > now) return 'upcoming';
  return 'past';
}

export const PHASE_LABEL: Record<MaintenancePhase, string> = {
  active: '진행 중',
  upcoming: '예정',
  past: '종료',
  disabled: '꺼짐',
};

export const PHASE_TONE = {
  active: 'danger',
  upcoming: 'warning',
  past: 'neutral',
  disabled: 'neutral',
} as const;
