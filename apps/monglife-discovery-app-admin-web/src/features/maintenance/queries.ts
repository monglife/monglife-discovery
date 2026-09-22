import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from './api';
import type { SaveMaintenance } from './types';

export const maintenanceKeys = {
  all: ['maintenances'] as const,
  current: ['maintenances', 'current'] as const,
};

export const useMaintenances = () =>
  useQuery({ queryKey: maintenanceKeys.all, queryFn: maintenanceApi.list });

/**
 * 지금 점검 중인지를 서버 시계로 확인한다.
 *
 * 목록만으로도 계산할 수 있지만 그건 브라우저 시계다. 앱이 실제로 무엇을 받는지는
 * 서버가 판정한 이 값이 답이라, 배너는 이쪽을 쓴다.
 */
export const useCurrentMaintenance = () =>
  useQuery({
    queryKey: maintenanceKeys.current,
    queryFn: maintenanceApi.current,
    // 예약해 둔 일정이 시각이 되면 저절로 켜지므로 가만히 두어도 바뀐다
    refetchInterval: 60_000,
  });

/** 목록과 현재 상태는 늘 같이 무효화한다. 하나만 갱신하면 배너와 표가 어긋난다 */
function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: maintenanceKeys.all });
    void qc.invalidateQueries({ queryKey: maintenanceKeys.current });
  };
}

export function useCreateMaintenance() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: SaveMaintenance) => maintenanceApi.create(body),
    onSuccess: invalidate,
  });
}

export function useUpdateMaintenance() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ maintenanceId, body }: { maintenanceId: number; body: SaveMaintenance }) =>
      maintenanceApi.update(maintenanceId, body),
    onSuccess: invalidate,
  });
}

export function useSetMaintenanceEnabled() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ maintenanceId, enabled }: { maintenanceId: number; enabled: boolean }) =>
      maintenanceApi.setEnabled(maintenanceId, enabled),
    onSuccess: invalidate,
  });
}

export function useRemoveMaintenance() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (maintenanceId: number) => maintenanceApi.remove(maintenanceId),
    onSuccess: invalidate,
  });
}
