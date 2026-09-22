import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  battleApi, masterApi, masterCreateApi, masterDeleteApi, membersApi, missionsApi, mongDetailApi, noticesApi, ordersApi, statsApi, stepsApi,
} from './api';
import type { MasterKind, MissionUpdateBody } from './api';
import type { MongSchedulerTypeCode, MongSleepPatch, MongStateCode, MongStatusPatch } from './types';

export const mongsKeys = {
  all: ['mongs'] as const,
  notices: (params: object) => [...mongsKeys.all, 'notices', params] as const,
  members: (params: object) => [...mongsKeys.all, 'members', params] as const,
  member: (accountId: number) => [...mongsKeys.all, 'member', accountId] as const,
  collections: (accountId: number) => [...mongsKeys.all, 'collections', accountId] as const,
  step: (accountId: number) => [...mongsKeys.all, 'step', accountId] as const,
  orders: (params: object) => [...mongsKeys.all, 'orders', params] as const,
  order: (orderId: number) => [...mongsKeys.all, 'order', orderId] as const,
  mongList: (params: object) => [...mongsKeys.all, 'mong-list', params] as const,
  mong: (mongId: number) => [...mongsKeys.all, 'mong', mongId] as const,
  tasks: (mongId: number) => [...mongsKeys.mong(mongId), 'tasks'] as const,
  inventories: (mongId: number, params: object) => [...mongsKeys.mong(mongId), 'inventories', params] as const,
  evolutionHistories: (accountId: number) => [...mongsKeys.all, 'evolution-histories', accountId] as const,
  queue: () => [...mongsKeys.all, 'battle-queue'] as const,
  matches: (params: object) => [...mongsKeys.all, 'matches', params] as const,
  match: (matchId: number) => [...mongsKeys.all, 'match', matchId] as const,
  battleStats: () => [...mongsKeys.all, 'battle-stats'] as const,
  stats: () => [...mongsKeys.all, 'stats'] as const,
  master: (kind: string) => [...mongsKeys.all, 'master', kind] as const,
  missions: () => [...mongsKeys.all, 'missions'] as const,
  accountMissions: (accountId: number) => [...mongsKeys.all, 'account-missions', accountId] as const,
};

const isId = (v: number) => Number.isFinite(v) && v > 0;

/* ── 공지 사항 ─────────────────────────────────────────────────────────── */
export const useNotices = (params: Parameters<typeof noticesApi.list>[0]) =>
  useQuery({ queryKey: mongsKeys.notices(params), queryFn: () => noticesApi.list(params) });

export function useNoticeMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: mongsKeys.all });
  return {
    create: useMutation({ mutationFn: noticesApi.create, onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ noticeId, ...body }: { noticeId: number; title: string; content: string }) => noticesApi.update(noticeId, body),
      onSuccess: invalidate,
    }),
    hide: useMutation({
      mutationFn: ({ noticeId, isHided }: { noticeId: number; isHided: boolean }) => noticesApi.hide(noticeId, isHided),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: noticesApi.remove, onSuccess: invalidate }),
  };
}

/* ── 멤버 ──────────────────────────────────────────────────────────────── */
export const useMembers = (params: Parameters<typeof membersApi.list>[0]) =>
  useQuery({ queryKey: mongsKeys.members(params), queryFn: () => membersApi.list(params) });

export const useMember = (accountId: number) =>
  useQuery({ queryKey: mongsKeys.member(accountId), queryFn: () => membersApi.get(accountId), enabled: isId(accountId) });

export const useCollections = (accountId: number) =>
  useQuery({
    queryKey: mongsKeys.collections(accountId),
    queryFn: async () => ({
      maps: await membersApi.collectionMaps(accountId),
      mongs: await membersApi.collectionMongs(accountId),
    }),
    enabled: isId(accountId),
  });

export const useStep = (accountId: number) =>
  useQuery({ queryKey: mongsKeys.step(accountId), queryFn: () => stepsApi.get(accountId), enabled: isId(accountId) });

export function useMemberMutations(accountId: number) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: mongsKeys.all });
  return {
    adjustStarPoint: useMutation({
      mutationFn: (body: { delta: number }) => membersApi.adjustStarPoint(accountId, body),
      onSuccess: invalidate,
    }),
    updateSlotCount: useMutation({ mutationFn: (slotCount: number) => membersApi.updateSlotCount(accountId, slotCount), onSuccess: invalidate }),
    grantMap: useMutation({ mutationFn: (code: string) => membersApi.grantCollectionMap(accountId, code), onSuccess: invalidate }),
    grantMong: useMutation({ mutationFn: (code: string) => membersApi.grantCollectionMong(accountId, code), onSuccess: invalidate }),
  };
}

/* ── 주문 ──────────────────────────────────────────────────────────────── */
export const useOrders = (params: Parameters<typeof ordersApi.list>[0]) =>
  useQuery({ queryKey: mongsKeys.orders(params), queryFn: () => ordersApi.list(params) });

export const useOrder = (orderId: number) =>
  useQuery({ queryKey: mongsKeys.order(orderId), queryFn: () => ordersApi.get(orderId), enabled: isId(orderId) });

export function useReconsumeOrder() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ordersApi.reconsume, onSuccess: () => qc.invalidateQueries({ queryKey: mongsKeys.all }) });
}

/* ── 몽 ────────────────────────────────────────────────────────────────── */
export const useMongList = (params: Parameters<typeof mongDetailApi.list>[0]) =>
  useQuery({ queryKey: mongsKeys.mongList(params), queryFn: () => mongDetailApi.list(params) });

export const useMong = (mongId: number) =>
  useQuery({ queryKey: mongsKeys.mong(mongId), queryFn: () => mongDetailApi.get(mongId), enabled: isId(mongId) });

export const useTasks = (mongId: number) =>
  useQuery({ queryKey: mongsKeys.tasks(mongId), queryFn: () => mongDetailApi.tasks(mongId), enabled: isId(mongId) });

export const useInventories = (mongId: number, params: { page?: number; size?: number }) =>
  useQuery({
    queryKey: mongsKeys.inventories(mongId, params),
    queryFn: () => mongDetailApi.inventories(mongId, params),
    enabled: isId(mongId),
  });

export const useEvolutionHistories = (accountId: number) =>
  useQuery({
    queryKey: mongsKeys.evolutionHistories(accountId),
    queryFn: () => mongDetailApi.evolutionHistories(accountId),
    enabled: isId(accountId),
  });

export function useMongMutations(mongId: number) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: mongsKeys.all });
  return {
    updateStatus: useMutation({ mutationFn: (body: MongStatusPatch) => mongDetailApi.updateStatus(mongId, body), onSuccess: invalidate }),
    updateState: useMutation({
      mutationFn: (body: { stateCode: MongStateCode }) => mongDetailApi.updateState(mongId, body),
      onSuccess: invalidate,
    }),
    updateSleep: useMutation({ mutationFn: (body: MongSleepPatch) => mongDetailApi.updateSleep(mongId, body), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: () => mongDetailApi.remove(mongId), onSuccess: invalidate }),
    pauseTask: useMutation({ mutationFn: mongDetailApi.pauseTask, onSuccess: invalidate }),
    resumeTask: useMutation({ mutationFn: mongDetailApi.resumeTask, onSuccess: invalidate }),
    deleteTask: useMutation({ mutationFn: mongDetailApi.deleteTask, onSuccess: invalidate }),
    createTask: useMutation({
      mutationFn: (schedulerTypeCode: MongSchedulerTypeCode) => mongDetailApi.createTask(mongId, schedulerTypeCode),
      onSuccess: invalidate,
    }),
    grantInventory: useMutation({
      mutationFn: (body: { inventoryCode: string; inventoryTypeCode: 'FOOD' | 'SNACK' }) => mongDetailApi.grantInventory(mongId, body),
      onSuccess: invalidate,
    }),
  };
}

/* ── 배틀 ──────────────────────────────────────────────────────────────── */
/** 대기열은 초 단위로 바뀐다. 로그인 현황 화면과 같은 주기로 다시 읽는다 */
export const useQueuePlayers = () =>
  useQuery({ queryKey: mongsKeys.queue(), queryFn: battleApi.queue, refetchInterval: 30_000 });

/** 배틀 화면의 세 조회를 한 번에 다시 읽는다 */
export function useRefreshBattle() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: mongsKeys.all });
}

export const useMatches = (params: Parameters<typeof battleApi.matches>[0]) =>
  useQuery({ queryKey: mongsKeys.matches(params), queryFn: () => battleApi.matches(params) });

export const useMatch = (matchId: number) =>
  useQuery({ queryKey: mongsKeys.match(matchId), queryFn: () => battleApi.match(matchId), enabled: isId(matchId) });

export const useBattleStats = () => useQuery({ queryKey: mongsKeys.battleStats(), queryFn: battleApi.stats });

export function useBattleMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: mongsKeys.all });
  return {
    // onSuccess 가 아니라 onSettled 다. 배틀은 서버가 뒤에서도 상태를 바꾼다 - 입장 기한
    // 스위퍼가 5초마다 돌며 ENTERING 을 CANCELED 로 마감한다. 실패는 대개 "그 사이 상태가
    // 바뀌었다"(409)이므로, 실패했을 때야말로 목록을 다시 읽어야 낡은 행이 사라진다.
    removeFromQueue: useMutation({ mutationFn: battleApi.removeFromQueue, onSettled: invalidate }),
    terminate: useMutation({ mutationFn: battleApi.terminate, onSettled: invalidate }),
  };
}

/* ── 통계·마스터 ───────────────────────────────────────────────────────── */
export const useGameStats = () =>
  useQuery({
    queryKey: mongsKeys.stats(),
    queryFn: async () => ({ mong: await statsApi.mong(), member: await statsApi.member() }),
  });

/** 탭마다 반환 타입이 달라 호출 쪽에서 좁혀 쓴다 */
export const useMaster = <K extends keyof typeof masterApi>(kind: K) =>
  useQuery<Awaited<ReturnType<(typeof masterApi)[K]>>>({
    queryKey: mongsKeys.master(kind),
    queryFn: () => masterApi[kind]() as Promise<Awaited<ReturnType<(typeof masterApi)[K]>>>,
  });

/** 마스터 데이터 등록 */
export function useCreateMaster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: masterCreateApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: mongsKeys.all }),
  });
}

/** 마스터 데이터 삭제 */
export function useDeleteMaster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, id }: { kind: MasterKind; id: string | number }) => masterDeleteApi.remove(kind, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: mongsKeys.all }),
  });
}

/* ── 미션 ──────────────────────────────────────────────────────────────── */
export const useMissions = () => useQuery({ queryKey: mongsKeys.missions(), queryFn: missionsApi.list });

/** 계정 진행 현황. 계정 ID 를 넣기 전에는 부르지 않는다 */
export const useAccountMissions = (accountId: number) =>
  useQuery({
    queryKey: mongsKeys.accountMissions(accountId),
    queryFn: () => missionsApi.accountMissions(accountId),
    enabled: isId(accountId),
  });

export function useMissionMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: mongsKeys.all });
  return {
    create: useMutation({ mutationFn: missionsApi.create, onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ missionId, ...body }: { missionId: number } & MissionUpdateBody) => missionsApi.update(missionId, body),
      onSuccess: invalidate,
    }),
    setActive: useMutation({
      mutationFn: ({ missionId, isActive }: { missionId: number; isActive: boolean }) => missionsApi.setActive(missionId, isActive),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: missionsApi.remove, onSuccess: invalidate }),
  };
}
