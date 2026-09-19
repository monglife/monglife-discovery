import { mongsApi } from '@/shared/api/client';
import type { Page, PageParams } from '@/shared/api/types';
import type {
  BattleStats, CollectionMap, CollectionMong, EvolutionHistory, ExchangeStarPointProduct, FeedItem,
  Inventory, MapType, MatchDetail, MatchSummary, Member, MemberStats, Mong, MongStateCode, MongStats,
  MongSleepPatch, MongStatusCode, MongStatusPatch, MongType, Notice, Order, OrderDetail, QueuePlayer, RandomDraw,
  Step, Task, TrainingType,
} from './types';

/**
 * 게이트웨이의 라우트 접두. mongs 두 서비스의 context-path 와 같다.
 * (/api/character/** → MONGS-CHARACTER, /api/user/** → MONGS-USER)
 */
const CHARACTER = '/character/admin';
const USER = '/user/admin';

/** 공지 사항 (user) */
export const noticesApi = {
  list: (params: PageParams & { sort?: string }) => mongsApi.getPage<Notice>(`${USER}/notices`, params),
  get: (noticeId: number) => mongsApi.get<Notice>(`${USER}/notices/${noticeId}`),
  create: (body: { title: string; content: string }) => mongsApi.post<Notice>(`${USER}/notices`, body),
  update: (noticeId: number, body: { title: string; content: string }) => mongsApi.put<Notice>(`${USER}/notices/${noticeId}`, body),
  hide: (noticeId: number, isHided: boolean) => mongsApi.patch<Notice>(`${USER}/notices/${noticeId}/hide`, { isHided }),
  remove: (noticeId: number) => mongsApi.delete<Notice>(`${USER}/notices/${noticeId}`),
};

/** 멤버·포인트 (user) */
export const membersApi = {
  list: (params: PageParams & { accountId?: number; sort?: string }) => mongsApi.getPage<Member>(`${USER}/members`, params),
  get: (accountId: number) => mongsApi.get<Member>(`${USER}/members/${accountId}`),
  adjustStarPoint: (accountId: number, body: { delta: number; reason?: string }) =>
    mongsApi.patch<Member>(`${USER}/members/${accountId}/star-point`, body),
  updateSlotCount: (accountId: number, slotCount: number) =>
    mongsApi.patch<Member>(`${USER}/members/${accountId}/slot-count`, { slotCount }),
  collectionMaps: (accountId: number) => mongsApi.get<CollectionMap[]>(`${USER}/members/${accountId}/collections/maps`),
  collectionMongs: (accountId: number) => mongsApi.get<CollectionMong[]>(`${USER}/members/${accountId}/collections/mongs`),
  grantCollectionMap: (accountId: number, code: string) => mongsApi.post<CollectionMap[]>(`${USER}/members/${accountId}/collections/maps`, { code }),
  grantCollectionMong: (accountId: number, code: string) => mongsApi.post<CollectionMong[]>(`${USER}/members/${accountId}/collections/mongs`, { code }),
};

/** 걸음 수 환전 상한 (user). 조회만 쓴다 — 초기화는 화면에서 뺐다 */
export const stepsApi = {
  get: (accountId: number) => mongsApi.get<Step>(`${USER}/steps/${accountId}`),
};

/** 주문 (user) */
export const ordersApi = {
  list: (params: PageParams & { accountId?: number; productId?: string; sort?: string }) =>
    mongsApi.getPage<Order>(`${USER}/orders`, params),
  get: (orderId: number) => mongsApi.get<OrderDetail>(`${USER}/orders/${orderId}`),
  reconsume: (orderId: number) => mongsApi.post<{ orderId: number; accountId: number; socialOrderId: string }>(`${USER}/orders/${orderId}/reconsume`),
};

/** 몽 (character) */
export const mongDetailApi = {
  list: (params: PageParams & { accountId?: number; stateCode?: MongStateCode | ''; statusCode?: MongStatusCode | ''; sort?: string }) =>
    mongsApi.getPage<Mong>(`${CHARACTER}/mongs`, params),
  get: (mongId: number) => mongsApi.get<Mong>(`${CHARACTER}/mongs/${mongId}`),
  updateStatus: (mongId: number, body: MongStatusPatch) => mongsApi.patch<Mong>(`${CHARACTER}/mongs/${mongId}/status`, body),
  updateState: (mongId: number, body: { stateCode: MongStateCode; reason?: string }) =>
    mongsApi.patch<Mong>(`${CHARACTER}/mongs/${mongId}/state`, body),
  updateSleep: (mongId: number, body: MongSleepPatch) => mongsApi.patch<Mong>(`${CHARACTER}/mongs/${mongId}/sleep`, body),
  remove: (mongId: number) => mongsApi.delete<Mong>(`${CHARACTER}/mongs/${mongId}`),
  tasks: (mongId: number) => mongsApi.get<Task[]>(`${CHARACTER}/mongs/${mongId}/tasks`),
  pauseTask: (taskId: number) => mongsApi.post<Task>(`${CHARACTER}/mongs/tasks/${taskId}/pause`),
  resumeTask: (taskId: number) => mongsApi.post<Task>(`${CHARACTER}/mongs/tasks/${taskId}/resume`),
  inventories: (mongId: number, params: PageParams): Promise<Page<Inventory>> =>
    mongsApi.getPage<Inventory>(`${CHARACTER}/mongs/${mongId}/inventories`, params),
  grantInventory: (mongId: number, body: { inventoryCode: string; inventoryTypeCode: 'FOOD' | 'SNACK' }) =>
    mongsApi.post<Inventory>(`${CHARACTER}/mongs/${mongId}/inventories`, body),
  evolutionHistories: (accountId: number) => mongsApi.get<EvolutionHistory[]>(`${CHARACTER}/accounts/${accountId}/evolution-histories`),
};

/** 배틀 (character) */
export const battleApi = {
  queue: () => mongsApi.get<QueuePlayer[]>(`${CHARACTER}/battle/queue`),
  removeFromQueue: (mongId: number) => mongsApi.delete<{ mongId: number }>(`${CHARACTER}/battle/queue/${mongId}`),
  matches: (params: PageParams & { stateCode?: string; accountId?: number; sort?: string }) =>
    mongsApi.getPage<MatchSummary>(`${CHARACTER}/battle/matches`, params),
  match: (matchId: number) => mongsApi.get<MatchDetail>(`${CHARACTER}/battle/matches/${matchId}`),
  terminate: (matchId: number) => mongsApi.post<MatchDetail>(`${CHARACTER}/battle/matches/${matchId}/terminate`),
  stats: () => mongsApi.get<BattleStats>(`${CHARACTER}/battle/stats`),
};

/** 통계 */
export const statsApi = {
  mong: () => mongsApi.get<MongStats>(`${CHARACTER}/stats`),
  member: () => mongsApi.get<MemberStats>(`${USER}/stats`),
};

/** 마스터 데이터 (읽기 전용) */
export const masterApi = {
  mongTypes: () => mongsApi.get<MongType[]>(`${CHARACTER}/master/mong-types`),
  foods: () => mongsApi.get<FeedItem[]>(`${CHARACTER}/master/foods`),
  snacks: () => mongsApi.get<FeedItem[]>(`${CHARACTER}/master/snacks`),
  trainingTypes: () => mongsApi.get<TrainingType[]>(`${CHARACTER}/master/training-types`),
  randomDraws: () => mongsApi.get<RandomDraw[]>(`${CHARACTER}/master/random-draws`),
  mapTypes: () => mongsApi.get<MapType[]>(`${USER}/master/map-types`),
  exchangeProducts: () => mongsApi.get<ExchangeStarPointProduct[]>(`${USER}/master/exchange-star-point-products`),
};

/** 마스터 데이터 등록. 종류(kind)에 따라 쓰는 필드가 다르다 */
export type CharacterMasterKind = 'MONG_TYPE' | 'FOOD' | 'SNACK' | 'TRAINING_TYPE' | 'RANDOM_DRAW';
export type UserMasterKind = 'MAP_TYPE' | 'EXCHANGE_STAR_POINT_PRODUCT';
export type MasterKind = CharacterMasterKind | UserMasterKind;

export interface MasterCreateBody {
  kind: MasterKind;
  code: string;
  name?: string;
  /* 몽 타입 */
  level?: number;
  evolutionScore?: number;
  maxStatus?: number;
  groupType?: string;
  /* 음식·간식 */
  price?: number;
  weight?: number;
  strength?: number;
  satiety?: number;
  healthy?: number;
  fatigue?: number;
  delaySeconds?: number;
  /* 훈련 */
  payPoint?: number;
  score?: number;
  timeout?: number;
  exp?: number;
  /* 랜덤 뽑기 */
  inventoryTypeCode?: 'FOOD' | 'SNACK' | 'MAP';
  /* 맵 */
  words?: string;
  /* 환전 상품 */
  starPoint?: number;
}

const USER_KINDS: MasterKind[] = ['MAP_TYPE', 'EXCHANGE_STAR_POINT_PRODUCT'];

export const masterCreateApi = {
  /** 종류에 따라 character / user 중 맞는 서비스로 보낸다 */
  create: (body: MasterCreateBody) =>
    mongsApi.post<{ kind: string; code: string }>(USER_KINDS.includes(body.kind) ? `${USER}/master` : `${CHARACTER}/master`, body),
};

/** 종류별 삭제 식별자. 맵·환전 상품은 user 서비스로 간다 */
export const masterDeleteApi = {
  remove: (kind: MasterKind, id: string | number) =>
    mongsApi.delete<{ kind: string; id: string }>(
      `${USER_KINDS.includes(kind) ? USER : CHARACTER}/master/${kind}/${id}`,
    ),
};
