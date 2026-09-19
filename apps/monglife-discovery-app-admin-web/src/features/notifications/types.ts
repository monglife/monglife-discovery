import type { Device } from '@/features/devices/types';

/** 기존 NotificationRequestDto (POST /admin/notification/mongs) */
export interface NotificationRequest {
  accountId: number;
  title: string;
  body: string;
}

/** AdminDeviceResponseDto — 알림 가능 기기는 계정이 항상 연결돼 있다 */
export interface NotifiableDevice extends Device {
  accountId: number;
}

export interface SendResult {
  accountId: number;
  ok: boolean;
  error?: string;
}
