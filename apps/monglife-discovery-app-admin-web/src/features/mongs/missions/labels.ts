import type {
  MissionActionCode, MissionCycleCode, MissionGoalTypeCode, MissionRewardTypeCode, MissionStateCode,
} from '../types';

export const CYCLE_LABEL: Record<MissionCycleCode, string> = {
  DAILY: '일간',
  WEEKLY: '주간',
  MONTHLY: '월간',
};

/** 주기 키 형식. 주기가 바뀌면 새 행이 생기고 옛 행은 남는다(초기화 배치 없음) */
export const CYCLE_KEY_HINT: Record<MissionCycleCode, string> = {
  DAILY: '20260917',
  WEEKLY: '2026-W38',
  MONTHLY: '202609',
};

export const ACTION_LABEL: Record<MissionActionCode, string> = {
  FEED_FOOD: '밥 주기',
  FEED_SNACK: '간식 주기',
  STROKE: '쓰다듬기',
  POOP_CLEAN: '배변 치우기',
  TRAINING_END: '훈련 완료',
  TRAINING_SCORE: '훈련 점수',
  RANDOM_DRAW: '랜덤 뽑기',
  BUY_RANDOM_DRAW_TICKET: '뽑기권 구매',
  USE_INVENTORY: '아이템 사용',
  SLEEP: '재우기',
  WAKEUP: '깨우기',
  EVOLUTION: '진화',
  GRADUATE: '졸업',
  CREATE_MONG: '몽 생성',
  PAY_POINT_SPEND: '페이 포인트 소비',
  PAY_POINT_EARN: '페이 포인트 획득',
  EXP_EARN: '경험치 획득',
  CARE_DAY: '접속·돌봄 일수',
};

export const GOAL_TYPE_LABEL: Record<MissionGoalTypeCode, string> = {
  COUNT: '횟수',
  DISTINCT: '서로 다른 대상 수',
  ACCUMULATE: '누적 수치',
};

export const GOAL_TYPE_HINT: Record<MissionGoalTypeCode, string> = {
  COUNT: '행동을 몇 번 했는지 센다. 예) 밥 5번',
  DISTINCT: '중복을 빼고 센다. 예) 서로 다른 음식 5종',
  ACCUMULATE: '반환값의 수치를 더한다. 예) 경험치 500 획득',
};

export const REWARD_TYPE_LABEL: Record<MissionRewardTypeCode, string> = {
  EXP: '경험치',
  PAY_POINT: '페이 포인트',
  STAR_POINT: '스타 포인트',
  INVENTORY: '아이템',
};

export const STATE_LABEL: Record<MissionStateCode, string> = {
  IN_PROGRESS: '진행 중',
  CLAIMABLE: '수령 가능',
  CLAIMED: '수령 완료',
};

export const STATE_TONE: Record<MissionStateCode, 'neutral' | 'primary' | 'success'> = {
  IN_PROGRESS: 'neutral',
  CLAIMABLE: 'primary',
  CLAIMED: 'success',
};

export const CYCLES: MissionCycleCode[] = ['DAILY', 'WEEKLY', 'MONTHLY'];
export const ACTIONS = Object.keys(ACTION_LABEL) as MissionActionCode[];
export const GOAL_TYPES: MissionGoalTypeCode[] = ['COUNT', 'DISTINCT', 'ACCUMULATE'];
export const REWARD_TYPES: MissionRewardTypeCode[] = ['EXP', 'PAY_POINT', 'STAR_POINT', 'INVENTORY'];
