import { api } from '@/shared/api/client';
import type { Maintenance, SaveMaintenance } from './types';

export const maintenanceApi = {
  list: () => api.get<Maintenance[]>('/admin/maintenances'),
  /** 지금 진행 중인 일정 전부. 앱을 가리지 않는다 — 웨어만 내린 점검도 들어온다 */
  current: () => api.get<Maintenance[]>('/admin/maintenances/current'),
  create: (body: SaveMaintenance) => api.post<Maintenance>('/admin/maintenances', body),
  update: (maintenanceId: number, body: SaveMaintenance) => api.put<Maintenance>(`/admin/maintenances/${maintenanceId}`, body),
  setEnabled: (maintenanceId: number, enabled: boolean) => api.patch<Maintenance>(`/admin/maintenances/${maintenanceId}`, { enabled }),
  remove: (maintenanceId: number) => api.delete<void>(`/admin/maintenances/${maintenanceId}`),
};
