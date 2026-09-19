import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useMissionMutations, useMissions } from '../../queries';
import { MissionCreateDialog } from '../components/MissionCreateDialog';
import { MissionDetailDialog } from '../components/MissionDetailDialog';
import {
  ACTION_LABEL, CYCLE_KEY_HINT, CYCLE_LABEL, CYCLES, GOAL_TYPE_LABEL, REWARD_TYPE_LABEL,
} from '../labels';
import type { Mission, MissionCycleCode, MissionReward } from '../../types';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { useClientPage } from '@/shared/components/ClientPagination';
import { Badge, Button, Card, Dialog, PageHeader, Pagination, Switch } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { formatNumber } from '@/shared/lib/format';

type TabKey = 'ALL' | MissionCycleCode;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ALL', label: '전체' },
  ...CYCLES.map((c) => ({ key: c as TabKey, label: CYCLE_LABEL[c] })),
];

const rewardText = (r: MissionReward) =>
  r.rewardTypeCode === 'INVENTORY'
    ? `${r.rewardCode} ×${r.amount}`
    : `${REWARD_TYPE_LABEL[r.rewardTypeCode]} ${formatNumber(r.amount)}`;

export function MissionListPage() {
  const [tab, setTab] = useState<TabKey>('ALL');
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<Mission | null>(null);
  const [opened, setOpened] = useState<Mission | null>(null);

  const { data, isLoading } = useMissions();
  const { create, update, setActive, remove } = useMissionMutations();

  const missions = useMemo(() => data ?? [], [data]);
  const rows = useMemo(
    () =>
      (tab === 'ALL' ? missions : missions.filter((m) => m.cycleCode === tab))
        // 서버는 정렬을 보장하지 않는다. 주기 → sortOrder → 코드 순으로 고정한다.
        .slice()
        .sort((a, b) =>
          a.cycleCode !== b.cycleCode
            ? CYCLES.indexOf(a.cycleCode) - CYCLES.indexOf(b.cycleCode)
            : a.sortOrder !== b.sortOrder
              ? a.sortOrder - b.sortOrder
              : a.missionCode.localeCompare(b.missionCode),
        ),
    [missions, tab],
  );

  // 미션 목록은 페이징이 없다. 통째로 받아 화면에서 끊는다.
  const page = useClientPage(rows, 15);

  // 저장 후 목록이 다시 오면 열린 모달도 최신 행을 가리키게 한다
  const openedMission = opened ? (missions.find((m) => m.missionId === opened.missionId) ?? null) : null;

  const activeByCycle = (cycle: MissionCycleCode) => missions.filter((m) => m.cycleCode === cycle && m.isActive).length;

  const columns: Column<Mission>[] = [
    { key: 'code', header: '코드', cell: (r) => <span className="font-mono text-xs">{r.missionCode}</span> },
    { key: 'cycle', header: '주기', cell: (r) => <Badge tone={r.cycleCode === 'DAILY' ? 'primary' : 'neutral'}>{CYCLE_LABEL[r.cycleCode]}</Badge> },
    {
      key: 'title',
      header: '제목',
      cell: (r) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate">{r.title}</span>
          {r.description && <span className="truncate text-xs text-muted-foreground">{r.description}</span>}
        </div>
      ),
    },
    {
      key: 'goal',
      header: '목표',
      cell: (r) => (
        <div className="flex min-w-0 flex-col">
          <span>{ACTION_LABEL[r.actionCode]} {formatNumber(r.goalCount)}</span>
          <span className="text-xs text-muted-foreground">{GOAL_TYPE_LABEL[r.goalTypeCode]}</span>
        </div>
      ),
    },
    {
      key: 'rewards',
      header: '리워드',
      cell: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.rewards.map((rw, i) => <Badge key={i}>{rewardText(rw)}</Badge>)}
        </div>
      ),
    },
    {
      key: 'active',
      header: '노출',
      // 진행 중인 사용자가 있어도 막히지 않는다. 이미 적재된 주기는 그대로 두고 다음 주기부터 빠진다.
      cell: (r) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={r.isActive}
            disabled={setActive.isPending}
            onCheckedChange={(next) => setActive.mutate({ missionId: r.missionId, isActive: next })}
          />
        </span>
      ),
    },
    { key: 'sort', header: '정렬', cell: (r) => r.sortOrder },
    {
      key: 'delete',
      header: '',
      className: 'text-right',
      cell: (r) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" className="text-danger hover:bg-danger-soft" onClick={() => { remove.reset(); setRemoving(r); }}>
            삭제
          </Button>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="미션"
        description="주기 초기화 배치가 없습니다. 사용자 미션은 앱이 미션 화면을 열 때 그 주기 몫이 적재되고, 주기가 바뀌면 새 행이 생깁니다."
        actions={
          <Button size="sm" className="ml-auto" onClick={() => { create.reset(); setCreating(true); }}>
            <Plus className="size-4" /> 등록
          </Button>
        }
      />

      {/* 주기마다 노출 규칙이 달라 운영자가 헷갈리기 쉬운 부분을 먼저 보여 준다 */}
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        {CYCLES.map((c) => (
          <Card key={c} className="p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">{CYCLE_LABEL[c]}</span>
              <span className="text-xs text-muted-foreground">활성 {activeByCycle(c)}개</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {c === 'DAILY'
                ? '활성 미션 중 액션이 겹치지 않게 사용자마다 5개를 무작위로 뽑습니다.'
                : '활성 미션 전부가 모든 사용자에게 같이 나갑니다.'}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">키 {CYCLE_KEY_HINT[c]}</p>
          </Card>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => { setTab(t.key); page.setPage(0); }}
            className={cn(
              'rounded-md px-2.5 py-1.5 text-xs sm:px-3 sm:text-sm',
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-surface text-muted-foreground hover:bg-surface-muted',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {setActive.error instanceof Error && (
        <p className="mb-2 rounded-md bg-danger-soft p-3 text-xs text-danger">{setActive.error.message}</p>
      )}

      <Card>
        <DataTable
          columns={columns}
          rows={page.items}
          rowKey={(r) => r.missionId}
          loading={isLoading}
          onRowClick={(r) => { update.reset(); setOpened(r); }}
        />
        {page.total > 0 && <Pagination page={page.page} size={page.size} total={page.total} onPageChange={page.setPage} />}
      </Card>

      <MissionDetailDialog
        mission={openedMission}
        loading={update.isPending}
        error={update.error instanceof Error ? update.error.message : undefined}
        onClose={() => { setOpened(null); update.reset(); }}
        onSubmit={(body) => openedMission && update.mutate({ missionId: openedMission.missionId, ...body }, { onSuccess: () => setOpened(null) })}
      />

      <MissionCreateDialog
        open={creating}
        loading={create.isPending}
        error={create.error instanceof Error ? create.error.message : undefined}
        missions={missions}
        onClose={() => { setCreating(false); create.reset(); }}
        onSubmit={(body) => create.mutate(body, { onSuccess: () => setCreating(false) })}
      />

      {/*
        ConfirmDialog 를 쓰지 않는다 - 삭제는 "사용자가 진행 중이면 거절"이 흔한 결과라
        실패 사유를 모달 안에서 보여 줘야 한다.
      */}
      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="미션을 삭제합니다"
        description={
          removing
            ? `${removing.missionCode} ${removing.title} — 사용자가 이미 진행 중인 미션은 삭제되지 않습니다. 그 경우 노출 스위치를 내리면 다음 주기부터 빠집니다.`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoving(null)} disabled={remove.isPending}>취소</Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              onClick={() => removing && remove.mutate(removing.missionId, { onSuccess: () => setRemoving(null) })}
            >
              삭제
            </Button>
          </>
        }
      >
        {remove.error instanceof Error && (
          <p className="rounded-md bg-danger-soft p-3 text-xs text-danger">{remove.error.message}</p>
        )}
      </Dialog>
    </>
  );
}
