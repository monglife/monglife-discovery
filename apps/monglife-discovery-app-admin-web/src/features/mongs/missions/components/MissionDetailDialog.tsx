import { useEffect, useState, type ReactNode } from 'react';
import { Pencil } from 'lucide-react';
import type { MissionUpdateBody } from '../../api';
import type { Mission } from '../../types';
import { ACTION_LABEL, CYCLE_LABEL, GOAL_TYPE_HINT, GOAL_TYPE_LABEL, REWARD_TYPE_LABEL, groupLabel, periodLabel } from '../labels';
import { RewardEditor } from './RewardEditor';
import { rewardFilled, toDraft, toRewardBody, type RewardDraft } from '../reward';
import { Badge, Button, Dialog, Field, Input, Switch } from '@/shared/ui';
import { formatNumber } from '@/shared/lib/format';

/** 고정 항목 한 줄 */
function Fixed({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm">{children}</p>
    </div>
  );
}

interface Props {
  mission: Mission | null;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (body: MissionUpdateBody) => void;
}

/**
 * 미션 상세 + 수정.
 *
 * <p>보기로 열고 수정 버튼을 눌러야 입력이 열린다. 목록에서 행을 잘못 눌러 값이 바뀌는 일을 막는다.
 */
export function MissionDetailDialog({ mission, loading, error, onClose, onSubmit }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalCount, setGoalCount] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState('');
  const [rotationGroup, setRotationGroup] = useState('0');
  const [rewards, setRewards] = useState<RewardDraft[]>([]);

  /**
   * 다른 미션을 열 때만 서버 값으로 초기화한다.
   *
   * <p>의존성을 mission 객체로 두면 안 된다 - 목록 쿼리가 창 포커스 등으로 조용히 리페치되면
   * 새 객체 참조가 와서 편집 중이던 입력이 통째로 날아간다. missionId 로 고정한다.
   */
  const missionId = mission?.missionId;
  useEffect(() => {
    if (!mission) return;
    setEditing(false);
    setTitle(mission.title);
    setDescription(mission.description ?? '');
    setGoalCount(String(mission.goalCount));
    setIsActive(mission.isActive);
    setSortOrder(String(mission.sortOrder));
    setRotationGroup(String(mission.rotationGroup));
    setRewards(mission.rewards.map(toDraft));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId]);

  if (!mission) return null;

  const filled = title.trim() !== '' && Number(goalCount) > 0 && rewards.length > 0 && rewards.every(rewardFilled);

  const submit = () =>
    onSubmit({
      title: title.trim(),
      ...(description.trim() !== '' && { description: description.trim() }),
      goalCount: Number(goalCount),
      isActive,
      ...(sortOrder.trim() !== '' && { sortOrder: Number(sortOrder) }),
      rotationGroup: Number(rotationGroup) || 0,
      rewards: toRewardBody(rewards),
    });

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={`${mission.missionCode} ${mission.title}`}
      description={
        editing
          ? '코드·주기·액션·목표 타입은 바꿀 수 없습니다. 나머지는 진행 중인 사용자에게도 즉시 반영됩니다.'
          : undefined
      }
      footer={
        editing ? (
          <>
            <Button variant="secondary" onClick={() => setEditing(false)} disabled={loading}>취소</Button>
            <Button loading={loading} disabled={!filled} onClick={submit}>저장</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>닫기</Button>
            <Button
              disabled={mission.isPublished}
              title={mission.isPublished ? '게시 중에는 수정할 수 없습니다.' : undefined}
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-4" /> 수정
            </Button>
          </>
        )
      }
    >
      <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
        {/* 정체성 네 값. 바꾸면 이미 적재된 사용자 미션의 진행도가 다른 의미가 되어 서버가 받지 않는다 */}
        <div className="grid gap-3 rounded-md bg-surface-muted p-3 sm:grid-cols-4">
          <Fixed label="코드"><span className="font-mono text-xs">{mission.missionCode}</span></Fixed>
          <Fixed label="주기"><Badge tone={mission.cycleCode === 'DAILY' ? 'primary' : 'neutral'}>{CYCLE_LABEL[mission.cycleCode]}</Badge></Fixed>
          <Fixed label="액션">{ACTION_LABEL[mission.actionCode]}</Fixed>
          <Fixed label="목표 타입">{GOAL_TYPE_LABEL[mission.goalTypeCode]}</Fixed>
        </div>
        {mission.isPublished && (
          <p className="rounded-md bg-warning/15 p-3 text-xs text-warning">
            <b>게시 중</b>입니다 ({periodLabel(mission.periodStart, mission.periodEnd)}) — 지금 사용자 화면에 떠 있고 진행도가 쌓이는 중이라
            수정·삭제가 막힙니다. 풀려면 아래 <b>노출</b>을 내리거나 다음 주기를 기다리세요.
            {mission.cycleCode !== 'DAILY' && ` 이번 주기는 ${groupLabel(mission.rotationGroup)} 차례입니다.`}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          위 네 값은 고정입니다. 바꿔야 하면 새 미션을 등록하고 이 미션의 노출을 내리세요 —
          액션이나 목표 타입을 갈아 끼우면 이미 쌓인 진행도가 다른 의미의 숫자가 됩니다.
        </p>

        {editing ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="제목">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field label="설명" hint="선택">
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </Field>
              <Field
                label="목표치"
                hint={`${GOAL_TYPE_HINT[mission.goalTypeCode]} · 내리면 그 자리에서 달성 처리되는 사용자가 생깁니다`}
              >
                <Input type="number" min={1} value={goalCount} onChange={(e) => setGoalCount(e.target.value)} />
              </Field>
              <Field label="정렬 순서" hint="작을수록 위">
                <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
              </Field>
              {mission.cycleCode !== 'DAILY' && (
                <Field
                  label="로테이션 그룹"
                  hint="같은 그룹끼리 한 주기에 함께 나갑니다. 0부터. 일간은 쓰지 않습니다"
                >
                  <Input type="number" min={0} value={rotationGroup} onChange={(e) => setRotationGroup(e.target.value)} />
                </Field>
              )}
            </div>

            <Switch checked={isActive} onCheckedChange={setIsActive} label="활성 (사용자에게 노출)" />
            <RewardEditor rewards={rewards} onChange={setRewards} />
          </>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-4">
              <Fixed label="목표치">{formatNumber(mission.goalCount)}</Fixed>
              <Fixed label="정렬 순서">{mission.sortOrder}</Fixed>
              <Fixed label="노출">{mission.isActive ? <Badge tone="success">노출</Badge> : <Badge>숨김</Badge>}</Fixed>
              <Fixed label="설명">{mission.description ?? '-'}</Fixed>
              <Fixed label="로테이션 그룹">
                {mission.cycleCode === 'DAILY' ? '미사용' : groupLabel(mission.rotationGroup)}
              </Fixed>
              <Fixed label="이번 주기">
                <span className="font-mono text-xs">{periodLabel(mission.periodStart, mission.periodEnd)}</span>
              </Fixed>
            </div>

            <div className="rounded-md border border-border p-3">
              <p className="mb-2 text-sm font-medium">리워드</p>
              <div className="flex flex-wrap gap-1.5">
                {mission.rewards.map((r, i) => (
                  <Badge key={i}>
                    {r.rewardTypeCode === 'INVENTORY'
                      ? `${r.rewardCode} ×${r.amount}`
                      : `${REWARD_TYPE_LABEL[r.rewardTypeCode]} ${formatNumber(r.amount)}`}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {error && <p className="rounded-md bg-danger-soft p-3 text-xs text-danger">{error}</p>}
      </div>
    </Dialog>
  );
}
