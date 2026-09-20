/** domains/monglife-discovery-domain-device MaintenanceEntity */
export interface Maintenance {
  maintenanceId: number;
  /** 앱이 점검 화면에 그대로 띄우는 안내 문구 */
  message: string;
  /** 'YYYY-MM-DDTHH:mm:ss' — 서버 시간대(Asia/Seoul)의 벽시계다. UTC 가 아니다 */
  startAt: string;
  /** null 이면 종료 미정 */
  endAt: string | null;
  enabled: boolean;
  /** 조회 시점에 점검 중이었는지. 서버 시계로 계산된 값이다 */
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 등록·수정이 같은 모양이라 하나로 쓴다 */
export interface SaveMaintenance {
  message: string;
  startAt: string;
  endAt: string | null;
  enabled: boolean;
}

/** 지금 일정이 어느 구간에 있는지. 서버가 주는 것은 active 뿐이라 나머지는 화면에서 만든다 */
export type MaintenancePhase = 'active' | 'upcoming' | 'past' | 'disabled';
