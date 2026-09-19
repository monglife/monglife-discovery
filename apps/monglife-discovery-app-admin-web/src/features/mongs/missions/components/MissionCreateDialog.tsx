import { useEffect, useMemo, useState } from 'react';
import type { MissionCreateBody } from '../../api';
import type { Mission, MissionActionCode, MissionCycleCode, MissionGoalTypeCode } from '../../types';
import { ACTION_LABEL, ACTIONS, CYCLE_LABEL, CYCLES, GOAL_TYPE_HINT, GOAL_TYPE_LABEL, GOAL_TYPES } from '../labels';
import { RewardEditor } from './RewardEditor';
import { emptyReward, rewardFilled, toRewardBody, type RewardDraft } from '../reward';
import { Button, Dialog, Field, Input, Select, Switch } from '@/shared/ui';

interface Props {
  open: boolean;
  loading?: boolean;
  error?: string;
  /** 이미 등록된 미션. 서버가 400 으로 막기 전에 같은 규칙을 화면에서 먼저 알려 준다 */
  missions: Mission[];
  onClose: () => void;
  onSubmit: (body: MissionCreateBody) => void;
}

export function MissionCreateDialog({ open, loading, error, missions, onClose, onSubmit }: Props) {
  const [missionCode, setMissionCode] = useState('');
  const [cycleCode, setCycleCode] = useState<MissionCycleCode>('DAILY');
  const [actionCode, setActionCode] = useState<MissionActionCode>('FEED_FOOD');
  const [goalTypeCode, setGoalTypeCode] = useState<MissionGoalTypeCode>('COUNT');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalCount, setGoalCount] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState('');
  const [rewards, setRewards] = useState<RewardDraft[]>([emptyReward()]);

  useEffect(() => {
    if (!open) return;
    setMissionCode(''); setCycleCode('DAILY'); setActionCode('FEED_FOOD'); setGoalTypeCode('COUNT');
    setTitle(''); setDescription(''); setGoalCount(''); setIsActive(true); setSortOrder('');
    setRewards([emptyReward()]);
  }, [open]);

  /**
   * (액션, 목표 타입) 쌍은 한 주기에만 둘 수 있다. 다른 주기에 이미 있으면 서버가
   * DUPLICATED_MISSION_GOAL(400-102-003) 로 막으므로 등록 버튼을 누르기 전에 알려 준다.
   * 같은 주기 안에서 난이도를 늘리는 것은 정상 경로라 막지 않는다.
   */
  const goalConflict = useMemo(
    () => missions.find((m) => m.actionCode === actionCode && m.goalTypeCode === goalTypeCode && m.cycleCode !== cycleCode),
    [missions, actionCode, goalTypeCode, cycleCode],
  );
  const codeConflict = useMemo(
    () => missions.some((m) => m.missionCode === missionCode.trim()),
    [missions, missionCode],
  );

  const filled =
    missionCode.trim() !== '' && !codeConflict && title.trim() !== '' &&
    Number(goalCount) > 0 && rewards.length > 0 && rewards.every(rewardFilled) && !goalConflict;

  const submit = () =>
    onSubmit({
      missionCode: missionCode.trim(),
      cycleCode,
      actionCode,
      goalTypeCode,
      title: title.trim(),
      ...(description.trim() !== '' && { description: description.trim() }),
      goalCount: Number(goalCount),
      isActive,
      ...(sortOrder.trim() !== '' && { sortOrder: Number(sortOrder) }),
      rewards: toRewardBody(rewards),
    });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="미션 등록"
      description="코드·주기·액션·목표 타입은 등록 뒤에 바꿀 수 없습니다. 나머지는 상세에서 수정할 수 있습니다."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>취소</Button>
          <Button loading={loading} disabled={!filled} onClick={submit}>등록</Button>
        </>
      }
    >
      <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="미션 코드"
            hint="예: MSN001"
            error={codeConflict ? '이미 등록된 코드입니다.' : undefined}
          >
            <Input value={missionCode} onChange={(e) => setMissionCode(e.target.value)} />
          </Field>

          <Field label="주기">
            <Select value={cycleCode} onChange={(e) => setCycleCode(e.target.value as MissionCycleCode)}>
              {CYCLES.map((c) => <option key={c} value={c}>{CYCLE_LABEL[c]}</option>)}
            </Select>
          </Field>

          <Field label="액션">
            <Select value={actionCode} onChange={(e) => setActionCode(e.target.value as MissionActionCode)}>
              {ACTIONS.map((a) => <option key={a} value={a}>{ACTION_LABEL[a]} ({a})</option>)}
            </Select>
          </Field>

          <Field label="목표 타입" hint={GOAL_TYPE_HINT[goalTypeCode]}>
            <Select value={goalTypeCode} onChange={(e) => setGoalTypeCode(e.target.value as MissionGoalTypeCode)}>
              {GOAL_TYPES.map((g) => <option key={g} value={g}>{GOAL_TYPE_LABEL[g]}</option>)}
            </Select>
          </Field>
        </div>

        {goalConflict && (
          <p className="rounded-md bg-warning/15 p-3 text-xs text-warning">
            {ACTION_LABEL[actionCode]}·{GOAL_TYPE_LABEL[goalTypeCode]} 는 이미{' '}
            <b>{CYCLE_LABEL[goalConflict.cycleCode]}</b> 에 있습니다 ({goalConflict.missionCode} {goalConflict.title}).
            같은 쌍은 한 주기에만 둘 수 있습니다 — 주기를 {CYCLE_LABEL[goalConflict.cycleCode]} 로 바꾸거나 목표 타입을 다르게 잡으세요.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="제목">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="설명" hint="선택">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="목표치" hint={goalTypeCode === 'ACCUMULATE' ? '누적 수치' : '개수'}>
            <Input type="number" min={1} value={goalCount} onChange={(e) => setGoalCount(e.target.value)} />
          </Field>
          <Field label="정렬 순서" hint="선택. 작을수록 위">
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </Field>
        </div>

        <Switch checked={isActive} onCheckedChange={setIsActive} label="활성 (사용자에게 노출)" />

        <RewardEditor rewards={rewards} onChange={setRewards} />

        {error && <p className="rounded-md bg-danger-soft p-3 text-xs text-danger">{error}</p>}
      </div>
    </Dialog>
  );
}
