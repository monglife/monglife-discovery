import type { MissionReward, MissionRewardTypeCode } from '../types';

/** 편집 중의 리워드 한 줄. 숫자도 문자열로 들고 있다가 전송 직전에 좁힌다 */
export interface RewardDraft {
  rewardTypeCode: MissionRewardTypeCode;
  /** INVENTORY 전용. MAP 은 계정 도감이라 서버가 거부한다 */
  inventoryTypeCode: 'FOOD' | 'SNACK';
  rewardCode: string;
  amount: string;
}

export const emptyReward = (): RewardDraft => ({
  rewardTypeCode: 'PAY_POINT',
  inventoryTypeCode: 'FOOD',
  rewardCode: '',
  amount: '',
});

/** 서버에서 받은 리워드를 편집 폼으로 */
export const toDraft = (r: MissionReward): RewardDraft => ({
  rewardTypeCode: r.rewardTypeCode,
  inventoryTypeCode: r.inventoryTypeCode === 'SNACK' ? 'SNACK' : 'FOOD',
  rewardCode: r.rewardCode ?? '',
  amount: String(r.amount),
});

export const rewardFilled = (r: RewardDraft) =>
  Number(r.amount) > 0 && (r.rewardTypeCode !== 'INVENTORY' || r.rewardCode !== '');

/** 전송용. 아이템이 아닐 때 코드를 같이 보내면 서버 검증에서 튕긴다 */
export const toRewardBody = (rewards: RewardDraft[]) =>
  rewards.map((r) => ({
    rewardTypeCode: r.rewardTypeCode,
    amount: Number(r.amount),
    ...(r.rewardTypeCode === 'INVENTORY' && { rewardCode: r.rewardCode, inventoryTypeCode: r.inventoryTypeCode }),
  }));
