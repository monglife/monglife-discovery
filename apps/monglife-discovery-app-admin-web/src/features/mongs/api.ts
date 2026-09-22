import { mongsApi } from '@/shared/api/client';
import type { Page, PageParams } from '@/shared/api/types';
import type {
  BattleStats, CollectionMap, CollectionMong, EvolutionHistory, ExchangeStarPointProduct, FeedItem,
  Inventory, MapType, MatchDetail, MatchSummary, Member, MemberStats, Mong, MongStateCode, MongStats,
  MongSleepPatch, MongStatusCode, MongStatusPatch, MongType, Notice, Order, OrderDetail, QueuePlayer, RandomDraw,
  MongSchedulerTypeCode, Step, Task, TrainingType,
  AccountMission, Mission, MissionActionCode, MissionCycleCode, MissionGoalTypeCode, MissionRewardTypeCode,
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
  adjustStarPoint: (accountId: number, body: { delta: number }) =>
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
  updateState: (mongId: number, body: { stateCode: MongStateCode }) =>
    mongsApi.patch<Mong>(`${CHARACTER}/mongs/${mongId}/state`, body),
  updateSleep: (mongId: number, body: MongSleepPatch) => mongsApi.patch<Mong>(`${CHARACTER}/mongs/${mongId}/sleep`, body),
  remove: (mongId: number) => mongsApi.delete<Mong>(`${CHARACTER}/mongs/${mongId}`),
  tasks: (mongId: number) => mongsApi.get<Task[]>(`${CHARACTER}/mongs/${mongId}/tasks`),
  pauseTask: (taskId: number) => mongsApi.post<Task>(`${CHARACTER}/mongs/tasks/${taskId}/pause`),
  resumeTask: (taskId: number) => mongsApi.post<Task>(`${CHARACTER}/mongs/tasks/${taskId}/resume`),
  /** 일시중지와 달리 행까지 지운다. 다시 걸려면 등록해야 한다 */
  deleteTask: (taskId: number) => mongsApi.delete<Task>(`${CHARACTER}/mongs/tasks/${taskId}`),
  /** 수면·기상 시각은 몽에 저장된 값을 쓰므로 보내지 않는다 */
  createTask: (mongId: number, schedulerTypeCode: MongSchedulerTypeCode) =>
    mongsApi.post<Task>(`${CHARACTER}/mongs/${mongId}/tasks`, { schedulerTypeCode }),
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

/**
 * 미션 마스터 (character).
 *
 * 제목·설명·목표치·정렬·노출·리워드는 수정할 수 있다. 코드·주기·액션·목표 타입은 고정이다 -
 * 바꾸면 이미 적재된 사용자 미션의 진행도가 다른 의미의 숫자가 된다.
 */
/** 수정에서는 코드·주기·액션·목표 타입을 받지 않는다 - 서버가 정체성으로 고정한다 */
export type MissionUpdateBody = Pick<MissionCreateBody, 'title' | 'description' | 'goalCount' | 'isActive' | 'sortOrder' | 'rotationGroup' | 'rewards'>;

export interface MissionCreateBody {
  missionCode: string;
  cycleCode: MissionCycleCode;
  actionCode: MissionActionCode;
  goalTypeCode: MissionGoalTypeCode;
  title: string;
  description?: string;
  goalCount: number;
  isActive?: boolean;
  sortOrder?: number;
  /** 로테이션 그룹. 주간·월간만 의미가 있다. 비우면 0 */
  rotationGroup?: number;
  rewards: {
    rewardTypeCode: MissionRewardTypeCode;
    /** INVENTORY 일 때만 채운다 */
    rewardCode?: string;
    inventoryTypeCode?: 'FOOD' | 'SNACK';
    amount: number;
  }[];
}

export const missionsApi = {
  /** 비활성 미션도 포함한 전체 목록. 페이징이 없다 */
  list: () => mongsApi.get<Mission[]>(`${CHARACTER}/missions`),
  get: (missionId: number) => mongsApi.get<Mission>(`${CHARACTER}/missions/${missionId}`),
  create: (body: MissionCreateBody) => mongsApi.post<Mission>(`${CHARACTER}/missions`, body),
  /** 리워드는 통째 교체다. 진행 중인 사용자에게도 즉시 반영된다 */
  update: (missionId: number, body: MissionUpdateBody) => mongsApi.put<Mission>(`${CHARACTER}/missions/${missionId}`, body),
  /** 노출 여부만 바꾼다. 진행 중인 사용자가 있어도 막히지 않는다 - 다음 주기부터 빠질 뿐 */
  setActive: (missionId: number, isActive: boolean) =>
    mongsApi.patch<Mission>(`${CHARACTER}/missions/${missionId}/active`, { isActive }),
  /** 사용자가 진행 중이면 400-102-004 로 거절된다 */
  remove: (missionId: number) => mongsApi.delete<{ missionId: number }>(`${CHARACTER}/missions/${missionId}`),
  /** 그 계정의 이번 주기(일간·주간·월간) 진행 현황 */
  accountMissions: (accountId: number) => mongsApi.get<AccountMission[]>(`${CHARACTER}/missions/accounts/${accountId}`),
};
