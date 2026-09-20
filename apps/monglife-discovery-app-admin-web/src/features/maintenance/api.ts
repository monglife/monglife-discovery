import { api } from '@/shared/api/client';
import type { Maintenance, SaveMaintenance } from './types';

export const maintenanceApi = {
  list: () => api.get<Maintenance[]>('/admin/maintenances'),
  /** 지금 점검 중인 일정. 점검이 아니면 null */
  current: () => api.get<Maintenance | null>('/admin/maintenances/current'),
  create: (body: SaveMaintenance) => api.post<Maintenance>('/admin/maintenances', body),
  update: (maintenanceId: number, body: SaveMaintenance) => api.put<Maintenance>(`/admin/maintenances/${maintenanceId}`, body),
  setEnabled: (maintenanceId: number, enabled: boolean) => api.patch<Maintenance>(`/admin/maintenances/${maintenanceId}`, { enabled }),
  remove: (maintenanceId: number) => api.delete<void>(`/admin/maintenances/${maintenanceId}`),
};
