import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useMissionMutations, useMissions } from '../../queries';
import { MissionCreateDialog } from '../components/MissionCreateDialog';
import { MissionDetailDialog } from '../components/MissionDetailDialog';
import {
  ACTION_LABEL, CYCLE_LABEL, CYCLES, GOAL_TYPE_LABEL, REWARD_TYPE_LABEL, groupLabel, periodLabel,
} from '../labels';
import type { Mission, MissionCycleCode, MissionReward } from '../../types';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { useClientPage } from '@/shared/components/ClientPagination';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { errorMessage } from '@/shared/lib/error';
import { Badge, Button, Card, PageHeader, Pagination, Select, Switch } from '@/shared/ui';
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
  const [group, setGroup] = useState<'ALL' | number>('ALL');
  const [published, setPublished] = useState<'ALL' | 'Y' | 'N'>('ALL');
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<Mission | null>(null);
  const [opened, setOpened] = useState<Mission | null>(null);

  const { data, isLoading } = useMissions();
  const { create, update, setActive, remove } = useMissionMutations();

  const missions = useMemo(() => data ?? [], [data]);
  /** 목록에 실제로 존재하는 그룹만 고르게 한다. 주간·월간만 로테이션을 쓴다 */
  const groups = useMemo(
    () => [...new Set(missions.filter((m) => m.cycleCode !== 'DAILY').map((m) => m.rotationGroup))].sort((a, b) => a - b),
    [missions],
  );

  const rows = useMemo(
    () =>
      missions
        .filter((m) => (tab === 'ALL' ? true : m.cycleCode === tab))
        // 그룹을 고르면 일간은 뺀다. 일간은 로테이션을 쓰지 않아 전부 그룹 0 인데,
        // 그대로 두면 "그룹 1" 을 골랐을 때 관계없는 일간 20개가 같이 뜬다.
        .filter((m) => (group === 'ALL' ? true : m.cycleCode !== 'DAILY' && m.rotationGroup === group))
        .filter((m) => (published === 'ALL' ? true : m.isPublished === (published === 'Y')))
        // 서버는 정렬을 보장하지 않는다. 주기 → sortOrder → 코드 순으로 고정한다.
        .slice()
        .sort((a, b) =>
          a.cycleCode !== b.cycleCode
            ? CYCLES.indexOf(a.cycleCode) - CYCLES.indexOf(b.cycleCode)
            : a.sortOrder !== b.sortOrder
              ? a.sortOrder - b.sortOrder
              : a.missionCode.localeCompare(b.missionCode),
        ),
    [missions, tab, group, published],
  );

  // 미션 목록은 페이징이 없다. 통째로 받아 화면에서 끊는다.
  const page = useClientPage(rows, 15);

  // 저장 후 목록이 다시 오면 열린 모달도 최신 행을 가리키게 한다
  const openedMission = opened ? (missions.find((m) => m.missionId === opened.missionId) ?? null) : null;


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
      key: 'group',
      header: '그룹',
      // 일간은 로테이션을 쓰지 않는다. 값이 있어도 의미가 없으므로 비워 둔다.
      cell: (r) =>
        r.cycleCode === 'DAILY'
          ? <span className="text-muted-foreground">-</span>
          : <span className={r.rotationGroup === r.currentRotationGroup ? 'font-medium' : 'text-muted-foreground'}>
              {groupLabel(r.rotationGroup)}
            </span>,
    },
    {
      key: 'published',
      header: '게시',
      cell: (r) => (r.isPublished ? <Badge tone="success">게시 중</Badge> : <span className="text-muted-foreground">-</span>),
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
          <Button
            size="sm"
            variant="danger-ghost"
            disabled={r.isPublished}
            title={r.isPublished ? '게시 중에는 삭제할 수 없습니다. 노출을 내리거나 다음 주기를 기다리세요.' : undefined}
            onClick={() => { remove.reset(); setRemoving(r); }}
          >
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
        description="주간은 월요일 00시, 월간은 1일에 주기가 바뀝니다(KST). 주간·월간은 로테이션 그룹이 주기마다 번갈아 나가고, 게시 중인 미션은 수정·삭제가 막힙니다."
        actions={
          <Button size="sm" className="ml-auto" onClick={() => { create.reset(); setCreating(true); }}>
            <Plus className="size-4" /> 등록
          </Button>
        }
      />

      {/* 주기마다 노출 규칙이 다르고, 지금 어느 그룹이 나가는지가 운영에서 가장 먼저 궁금하다 */}
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        {CYCLES.map((c) => {
          const rows = missions.filter((m) => m.cycleCode === c);
          const active = rows.filter((m) => m.isActive);
          const sample = rows[0];
          const current = sample?.currentRotationGroup ?? null;
          const live = active.filter((m) => m.isPublished).length;
          return (
            <Card key={c} className="p-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">{CYCLE_LABEL[c]}</span>
                <span className="text-xs text-muted-foreground">활성 {active.length}개</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {c === 'DAILY'
                  ? '활성 미션 중 액션이 겹치지 않게 사용자마다 5개를 무작위로 뽑습니다. 로테이션을 쓰지 않습니다.'
                  : current === null
                    ? '활성 미션이 없어 이번 주기에 나가는 미션이 없습니다.'
                    : `이번 주기는 ${groupLabel(current)} 차례입니다. 그 그룹 전부가 모든 사용자에게 같이 나갑니다.`}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                게시 중 {live}개
                {sample && <span className="ml-1.5 font-mono">{periodLabel(sample.periodStart, sample.periodEnd)}</span>}
              </p>
            </Card>
          );
        })}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => { setTab(t.key); page.setPage(0); }}
              className={cn(
                'rounded-md border px-2.5 py-1.5 text-xs sm:px-3 sm:text-sm',
                tab === t.key ? 'border-primary-hover bg-primary text-primary-foreground' : 'border-border bg-surface text-muted-foreground hover:bg-surface-muted',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select
            className="h-8 w-auto text-xs sm:text-sm"
            value={group === 'ALL' ? 'ALL' : String(group)}
            onChange={(e) => { setGroup(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)); page.setPage(0); }}
          >
            <option value="ALL">그룹 전체</option>
            {groups.map((g) => <option key={g} value={g}>{groupLabel(g)}</option>)}
          </Select>

          <Select
            className="h-8 w-auto text-xs sm:text-sm"
            value={published}
            onChange={(e) => { setPublished(e.target.value as 'ALL' | 'Y' | 'N'); page.setPage(0); }}
          >
            <option value="ALL">게시 전체</option>
            <option value="Y">게시 중</option>
            <option value="N">미게시</option>
          </Select>

          {(group !== 'ALL' || published !== 'ALL' || tab !== 'ALL') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setTab('ALL'); setGroup('ALL'); setPublished('ALL'); page.setPage(0); }}
            >
              초기화
            </Button>
          )}

          <span className="text-xs text-muted-foreground">{rows.length}건</span>
        </div>
      </div>

      <ErrorBanner message={errorMessage(setActive.error)} className="mb-2" />

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

      {/* 삭제는 "사용자가 진행 중이면 거절"이 흔한 결과라 실패 사유를 모달 안에서 보여 준다. */}
      <ConfirmDialog
        open={removing !== null}
        title="미션을 삭제합니다"
        description={
          removing
            ? `${removing.missionCode} ${removing.title} — 사용자가 이미 진행 중인 미션은 삭제되지 않습니다. 그 경우 노출 스위치를 내리면 다음 주기부터 빠집니다.`
            : undefined
        }
        confirmLabel="삭제"
        danger
        loading={remove.isPending}
        error={errorMessage(remove.error)}
        onClose={() => {
          setRemoving(null);
          remove.reset();
        }}
        onConfirm={() => removing && remove.mutate(removing.missionId, { onSuccess: () => setRemoving(null) })}
      />
    </>
  );
}
