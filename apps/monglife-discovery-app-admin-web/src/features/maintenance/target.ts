import type { Maintenance } from './types';

/** 대상 앱이 비어 있으면 전역이라 모든 앱이 막힌다. 표에서 이게 안 보이면 범위를 착각한다 */
export const ALL_APPS_LABEL = '전체 (모든 앱)';

export const targetAppLabel = (m: Pick<Maintenance, 'appPackageName'>) => m.appPackageName ?? ALL_APPS_LABEL;
