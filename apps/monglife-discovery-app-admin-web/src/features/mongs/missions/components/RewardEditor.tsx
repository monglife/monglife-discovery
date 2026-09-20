import { Plus, X } from 'lucide-react';
import { useMaster } from '../../queries';
import { REWARD_TYPE_LABEL, REWARD_TYPES } from '../labels';
import type { MissionRewardTypeCode } from '../../types';
import type { RewardDraft } from '../reward';
import { emptyReward } from '../reward';
import { Button, Field, Input, Select } from '@/shared/ui';

interface Props {
  rewards: RewardDraft[];
  disabled?: boolean;
  onChange: (next: RewardDraft[]) => void;
}

/**
 * 리워드 편집기. 등록·수정 모달이 같이 쓴다.
 *
 * <p>아이템 코드는 직접 입력받지 않고 이미 등록된 음식·간식에서 고르게 한다. 오타가 나면
 * 사용자가 수령할 때가 되어서야 지급에 실패하는데, 그때는 이미 수령 처리된 뒤다.
 */
export function RewardEditor({ rewards, disabled, onChange }: Props) {
  const foods = useMaster('foods');
  const snacks = useMaster('snacks');

  const itemOptions = (type: 'FOOD' | 'SNACK') =>
    type === 'FOOD'
      ? (foods.data ?? []).map((f) => ({ code: f.code, name: f.name }))
      : (snacks.data ?? []).map((s) => ({ code: s.code, name: s.name }));

  const set = (i: number, patch: Partial<RewardDraft>) =>
    onChange(rewards.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">리워드</span>
        {!disabled && (
          <Button size="sm" variant="ghost" onClick={() => onChange([...rewards, emptyReward()])}>
            <Plus className="size-4" /> 추가
          </Button>
        )}
      </div>

      {rewards.map((r, i) => (
        <div key={i} className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Field label="종류">
            <Select
              value={r.rewardTypeCode}
              disabled={disabled}
              onChange={(e) => set(i, { rewardTypeCode: e.target.value as MissionRewardTypeCode, rewardCode: '' })}
            >
              {REWARD_TYPES.map((t) => <option key={t} value={t}>{REWARD_TYPE_LABEL[t]}</option>)}
            </Select>
          </Field>

          <Field label={r.rewardTypeCode === 'INVENTORY' ? '수량' : '지급량'}>
            <Input type="number" min={1} value={r.amount} disabled={disabled} onChange={(e) => set(i, { amount: e.target.value })} />
          </Field>

          <Button
            size="sm"
            variant="danger-ghost"
            disabled={disabled || rewards.length === 1}
            onClick={() => onChange(rewards.filter((_, idx) => idx !== i))}
          >
            <X className="size-4" />
          </Button>

          {r.rewardTypeCode === 'INVENTORY' && (
            <div className="grid gap-2 sm:col-span-3 sm:grid-cols-2">
              <Field label="아이템 종류" hint="맵은 계정 도감이라 리워드로 쓸 수 없습니다">
                <Select
                  value={r.inventoryTypeCode}
                  disabled={disabled}
                  onChange={(e) => set(i, { inventoryTypeCode: e.target.value as 'FOOD' | 'SNACK', rewardCode: '' })}
                >
                  <option value="FOOD">음식</option>
                  <option value="SNACK">간식</option>
                </Select>
              </Field>
              <Field label="아이템">
                <Select value={r.rewardCode} disabled={disabled} onChange={(e) => set(i, { rewardCode: e.target.value })}>
                  <option value="">선택하세요</option>
                  {itemOptions(r.inventoryTypeCode).map((o) => (
                    <option key={o.code} value={o.code}>{o.name} ({o.code})</option>
                  ))}
                </Select>
              </Field>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
