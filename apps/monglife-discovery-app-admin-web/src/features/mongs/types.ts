/**
 * monglife-mongs 관리 API 의 응답 타입.
 * character(MONGS-CHARACTER) 와 user(MONGS-USER) 두 서비스가 섞여 있어 한 파일에 모았다.
 */

/* ── user: 공지 사항 ───────────────────────────────────────────────────── */
export interface Notice {
  noticeId: number;
  title: string;
  content: string;
  writerAccountId: number | null;
  writerName: string | null;
  isHided: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ── user: 멤버 ────────────────────────────────────────────────────────── */
export interface Member {
  accountId: number;
  slotCount: number;
  starPoint: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CollectionMap {
  mapCode: string;
  mapName: string;
  isIncluded: boolean;
}

export interface CollectionMong {
  mongCode: string;
  mongName: string;
  isIncluded: boolean;
}

export interface Step {
  accountId: number;
  todayExchangedWalkingCount: number;
  dailyLimit: number;
}

/* ── user: 주문 ────────────────────────────────────────────────────────── */
export interface Order {
  orderId: number;
  accountId: number;
  productId: string | null;
  productName: string | null;
  price: number | null;
  socialOrderId: string;
  createdAt: string;
}

export interface OrderDetail {
  order: Order;
  starPoint: number | null;
  /** 구글 플레이 조회 결과. 조회에 실패하면 null */
  inAppOrder: {
    purchaseType: string | null;
    orderType: string | null;
    isPayed: boolean;
    isConsumed: boolean;
    purchasedAt: string | null;
  } | null;
}

/* ── user: 통계·마스터 ─────────────────────────────────────────────────── */
export interface MemberStats {
  totalMembers: number;
  todayJoined: number;
  totalStarPoint: number;
  totalOrders: number;
  todayOrders: number;
  todayOrderAmount: number;
}

export interface MapType {
  mapTypeId: number;
  mapCode: string;
  mapName: string;
  words: string | null;
}

export interface ExchangeStarPointProduct {
  productId: string;
  productName: string;
  starPoint: number;
}

/* ── character: 몽 ─────────────────────────────────────────────────────── */
export type MongStateCode = 'NORMAL' | 'EVOLUTION_READY' | 'GRADUATE_READY' | 'GRADUATE' | 'DEAD';
export type MongStatusCode = 'NORMAL' | 'HUNGRY' | 'SOMNOLENCE' | 'SICK';

export interface Mong {
  mongId: number;
  accountId: number;
  name: string;
  mongCode: string;
  mongName: string;
  stateCode: MongStateCode;
  statusCode: MongStatusCode;
  level: number;
  maxStatus: number;
  sleepAt: string | null;
  wakeupAt: string | null;
  isSleep: boolean;
  payPoint: number;
  weight: number;
  strength: number;
  satiety: number;
  healthy: number;
  fatigue: number;
  exp: number;
  evolutionReward: number;
  evolutionPenalty: number;
  strokeCount: number;
  trainingCount: number;
  poopCount: number;
  randomDrawTicketCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MongSleepPatch {
  isSleep: boolean;
  reason?: string;
}

/** null 인 항목은 서버가 건드리지 않는다 */
export interface MongStatusPatch {
  weight?: number | null;
  strength?: number | null;
  satiety?: number | null;
  healthy?: number | null;
  fatigue?: number | null;
  exp?: number | null;
  payPoint?: number | null;
  poopCount?: number | null;
  randomDrawTicketCount?: number | null;
  reason?: string;
}

/** mongs_task. 몽마다 도는 스케줄 */
export interface Task {
  taskId: number;
  mongId: number;
  accountId: number;
  schedulerTypeCode: string;
  stateCode: 'PROCESSING' | 'PAUSE' | 'APP_STOP_PROCESSING' | 'APP_STOP_PAUSE';
  typeCode: string;
  expirationSeconds: number | null;
  restExpirationSeconds: number | null;
  expiredAt: string | null;
  fixTime: string | null;
  /** 메모리에 실제로 올라가 도는 중인지 */
  isScheduled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  inventoryId: number;
  mongId: number;
  inventoryCode: string;
  inventoryName: string;
  inventoryTypeCode: 'FOOD' | 'SNACK' | 'MAP';
}

export interface EvolutionHistory {
  mongEvolutionHistoryId: number;
  accountId: number;
  mongCode: string;
  evolutionScore: number;
}

export interface MongStats {
  totalMongs: number;
  todayCreated: number;
  countByState: Record<string, number>;
  countByStatus: Record<string, number>;
  /** 메모리에 올라가 도는 스케줄 수 */
  scheduledTasks: number;
}

/* ── character: 마스터 ─────────────────────────────────────────────────── */
export interface MongType {
  mongTypeId: number;
  mongCode: string;
  mongName: string;
  level: number;
  evolutionScore: number;
  maxStatus: number;
  groupType: string | null;
}

/** 음식·간식 공용 */
export interface FeedItem {
  id: number;
  code: string;
  name: string;
  price: number;
  weight: number;
  strength: number;
  satiety: number;
  healthy: number;
  fatigue: number;
  delaySeconds: number;
}

export interface TrainingType {
  trainingTypeId: number;
  trainingCode: string;
  trainingName: string;
  payPoint: number;
  score: number;
  timeout: number;
  exp: number;
  strength: number;
  weight: number;
  satiety: number;
  fatigue: number;
}

export interface RandomDraw {
  randomDrawId: number;
  randomDrawCode: string;
  randomDrawName: string;
  inventoryTypeCode: 'FOOD' | 'SNACK' | 'MAP';
}

/* ── character: 배틀 ───────────────────────────────────────────────────── */
export type MatchStateCode = 'ENTERING' | 'PROCESS' | 'END';

export interface QueuePlayer {
  mongId: number;
  deviceId: string;
  accountId: number;
  createdAt: string | null;
}

export interface MatchSummary {
  matchId: number;
  round: number;
  maxRound: number;
  stateCode: MatchStateCode;
  playerCount: number;
  botCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MatchDetail {
  matchId: number;
  round: number;
  maxRound: number;
  stateCode: MatchStateCode;
  players: {
    playerId: string;
    deviceId: string | null;
    accountId: number | null;
    mongId: number | null;
    mongCode: string | null;
    mongName: string | null;
    name: string | null;
    attack: number;
    heal: number;
    defence: number;
    isBot: boolean;
    hp: number;
    isEnter: boolean;
    enteredAt: string | null;
    exitedAt: string | null;
  }[];
  picks: {
    pickId: number | null;
    playerId: string | null;
    targetPlayerId: string | null;
    round: number;
    pickCode: string | null;
    pickValue: number | null;
  }[];
}

export interface BattleStats {
  queueSize: number;
  totalMatches: number;
  todayMatches: number;
  todayBotMatches: number;
  processingMatches: number;
}
