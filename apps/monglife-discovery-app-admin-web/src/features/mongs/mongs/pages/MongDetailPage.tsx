import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useEvolutionHistories, useInventories, useMong, useMongMutations, useTasks } from '../../queries';
import { useAccountSummaries } from '../../accounts';
import type { EvolutionHistory, Inventory, MongStateCode, Task } from '../../types';
import { MongStateBadge, MongStatusBadge } from '../components/MongBadges';
import { MongStatusForm } from '../components/MongStatusForm';
import { MongStateForm } from '../components/MongStateForm';
import { MongSleepForm } from '../components/MongSleepForm';
import { MongAssetForm } from '../components/MongAssetForm';
import { TaskDetailDialog } from '../components/TaskDetailDialog';
import { TaskCreateDialog } from '../components/TaskCreateDialog';
import { SCHEDULER_LABEL, TASK_STATE_LABEL, TASK_STATE_TONE } from '../taskLabels';
import { InventoryGrantDialog } from '../components/InventoryGrantDialog';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { useClientPage } from '@/shared/components/ClientPagination';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { StatCard } from '@/shared/components/StatCard';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader, Pagination } from '@/shared/ui';
import { formatDateTime, formatDateTimeSec, formatDuration, formatNumber } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

/** 수면·기상을 서버가 받아 주지 않는 상태 */
const SLEEP_BLOCKED: MongStateCode[] = ['DEAD', 'GRADUATE', 'GRADUATE_READY'];

export function MongDetailPage() {
  const mongId = Number(useParams().mongId);
  const navigate = useNavigate();
  const { data: mong, isLoading, refetch: refetchMong, isFetching: mongFetching, dataUpdatedAt: mongUpdatedAt } = useMong(mongId);
  const { data: tasks, refetch: refetchTasks, isFetching: tasksFetching, dataUpdatedAt: tasksUpdatedAt } = useTasks(mongId);
  const [invPage, setInvPage] = useState(0);
  const { data: inventories } = useInventories(mongId, { page: invPage, size: 10 });
  const { data: histories } = useEvolutionHistories(mong?.accountId ?? 0);
  const mutations = useMongMutations(mongId);
  // 스케줄은 목록이 통째로 온다. 몽 하나에 최대 대여섯 개라 클라이언트에서 끊는다.
  const taskPage = useClientPage(tasks, 3);
  const accounts = useAccountSummaries([mong?.accountId]);
  const account = accounts.get(mong?.accountId);
  const [removing, setRemoving] = useState(false);
  const [granting, setGranting] = useState(false);
  const [pendingState, setPendingState] = useState<{ stateCode: MongStateCode } | null>(null);
  const [openedTask, setOpenedTask] = useState<Task | null>(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const [removingTask, setRemovingTask] = useState<Task | null>(null);

  // 목록이 갱신되면 열린 모달도 최신 행을 가리키게 한다 (일시중지·재시작 직후)
  const openedTaskRow = openedTask ? ((tasks ?? []).find((t) => t.taskId === openedTask.taskId) ?? null) : null;

  if (!isLoading && !mong) return <EmptyState message="몽을 찾을 수 없습니다." />;

  const taskColumns: Column<Task>[] = [
    {
      key: 'type',
      header: '스케줄',
      cell: (t) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate">{SCHEDULER_LABEL[t.schedulerTypeCode] ?? t.schedulerTypeCode}</span>
          <span className="font-mono text-xs text-muted-foreground">{t.schedulerTypeCode}</span>
        </div>
      ),
    },
    {
      key: 'state',
      header: '상태',
      cell: (t) => (
        <span className="flex items-center gap-1.5">
          <Badge tone={TASK_STATE_TONE[t.stateCode] ?? 'neutral'}>{TASK_STATE_LABEL[t.stateCode] ?? t.stateCode}</Badge>
          {/* DB 는 도는 중인데 메모리에 타이머가 없다 = 재기동 전까지 안 깨어난다 */}
          {!t.isScheduled && t.stateCode === 'PROCESSING' && <Badge tone="danger">잠자는 중</Badge>}
        </span>
      ),
    },
    { key: 'expired', header: '다음 실행', cell: (t) => formatDateTime(t.expiredAt) },
    { key: 'rest', header: '남은 시간', cell: (t) => formatDuration(t.restExpirationSeconds) },
    {
      key: 'action',
      header: '',
      className: 'text-right',
      cell: (t) => (
        <span className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {t.stateCode === 'PROCESSING' ? (
            <Button size="sm" variant="secondary" loading={mutations.pauseTask.isPending} onClick={() => mutations.pauseTask.mutate(t.taskId)}>
              일시중지
            </Button>
          ) : (
            <Button size="sm" variant="secondary" loading={mutations.resumeTask.isPending} onClick={() => mutations.resumeTask.mutate(t.taskId)}>
              재시작
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-danger hover:bg-danger-soft" onClick={() => setRemovingTask(t)}>
            삭제
          </Button>
        </span>
      ),
    },
  ];

  const inventoryColumns: Column<Inventory>[] = [
    { key: 'code', header: '코드', cell: (i) => <span className="font-mono text-xs">{i.inventoryCode}</span> },
    { key: 'name', header: '이름', cell: (i) => i.inventoryName },
    { key: 'type', header: '종류', cell: (i) => <Badge>{i.inventoryTypeCode}</Badge> },
  ];

  const historyColumns: Column<EvolutionHistory>[] = [
    {
      key: 'mong',
      header: '몽',
      cell: (h) => (
        <div className="flex min-w-0 flex-col">
          {/* 마스터에서 지워진 코드면 이름이 없다. 이력은 남아 있으므로 코드로만 보여 준다 */}
          <span className="truncate">{h.mongName ?? <span className="text-muted-foreground">이름 없음</span>}</span>
          <span className="font-mono text-xs text-muted-foreground">{h.mongCode}</span>
        </div>
      ),
    },
    { key: 'score', header: '진화 점수', cell: (h) => formatNumber(Math.round(h.evolutionScore)) },
  ];

  return (
    <>
      <PageHeader
        title={mong ? `${mong.name} #${mong.mongId}` : `몽 #${mongId}`}
        description={mong ? `${mong.mongName} · Lv.${mong.level} · ${account?.email ?? `#${mong.accountId}`}` : undefined}
        actions={
          <div className="ml-auto flex gap-2">
            <span className="flex min-w-0 items-end gap-2">
              <span className="truncate text-xs text-muted-foreground">{formatDateTimeSec(mongUpdatedAt)} 기준</span>
              <Button variant="secondary" size="sm" className="shrink-0" disabled={mongFetching} onClick={() => refetchMong()}>
                <RefreshCw className={cn('size-4', mongFetching && 'animate-spin')} /> 새로고침
              </Button>
            </span>
            <Button variant="danger" size="sm" onClick={() => setRemoving(true)}>
              <Trash2 className="size-4" /> 삭제
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="상태" value={mong ? <MongStateBadge code={mong.stateCode} /> : '-'} hint={mong?.isSleep ? '수면 중' : '기상'} />
        <StatCard label="지수 코드" value={mong ? <MongStatusBadge code={mong.statusCode} /> : '-'} />
        <StatCard label="페이 포인트" value={formatNumber(mong?.payPoint)} />
        <StatCard
          label="경험치"
          value={mong ? `${formatNumber(Math.round(mong.exp))} / ${formatNumber(mong.maxStatus)}` : '-'}
          hint={mong ? `쓰다듬기 ${mong.strokeCount} · 훈련 ${mong.trainingCount}` : undefined}
        />
      </div>

      <div className="space-y-4">
        {/* 1행 — 스케줄 */}
        <Card>
          <CardHeader>
            <CardTitle>스케줄</CardTitle>
            <span className="flex min-w-0 items-end gap-2">
              <span className="truncate text-xs text-muted-foreground">{formatDateTimeSec(tasksUpdatedAt)} 기준</span>
              <Button size="sm" variant="secondary" className="shrink-0" disabled={tasksFetching} onClick={() => refetchTasks()}>
                <RefreshCw className={cn('size-4', tasksFetching && 'animate-spin')} /> 새로고침
              </Button>
              <Button size="sm" variant="secondary" onClick={() => { mutations.createTask.reset(); setCreatingTask(true); }}>
                <Plus className="size-4" /> 등록
              </Button>
            </span>
          </CardHeader>
          <DataTable
            columns={taskColumns}
            rows={taskPage.items}
            rowKey={(t) => t.taskId}
            emptyMessage="등록된 스케줄이 없습니다."
            onRowClick={(t) => setOpenedTask(t)}
          />
          {taskPage.total > 0 && (
            <Pagination page={taskPage.page} size={taskPage.size} total={taskPage.total} onPageChange={taskPage.setPage} />
          )}
        </Card>

        {/* 2행 — 지수 수정 (막대로 끌어 고친다) */}
        <Card>
          <CardHeader>
            <CardTitle>지수 수정</CardTitle>
            <span className="text-xs text-muted-foreground">막대를 끌어 고칩니다. 최대 {formatNumber(mong?.maxStatus)}</span>
          </CardHeader>
          <CardBody>
            {mong && (
              <MongStatusForm
                mong={mong}
                loading={mutations.updateStatus.isPending}
                onSubmit={(body) => mutations.updateStatus.mutate(body)}
              />
            )}
          </CardBody>
        </Card>

        {/* 3행 — 재화 | 상태 | 수면. 성격이 달라 카드를 나눴다 */}
        <div className="grid items-stretch gap-4 lg:grid-cols-3">
          <Card className="flex flex-col">
            <CardHeader><CardTitle>재화</CardTitle></CardHeader>
            <CardBody className="flex-1">
              {mong && (
                <MongAssetForm
                  mong={mong}
                  loading={mutations.updateStatus.isPending}
                  onSubmit={(body) => mutations.updateStatus.mutate(body)}
                />
              )}
            </CardBody>
          </Card>

          <Card className="flex flex-col">
            <CardHeader><CardTitle>상태 변경</CardTitle></CardHeader>
            <CardBody className="flex-1">
              {mong && (
                <MongStateForm
                  current={mong.stateCode}
                  loading={mutations.updateState.isPending}
                  onSubmit={setPendingState}
                />
              )}
            </CardBody>
          </Card>

          <Card className="flex flex-col">
            <CardHeader><CardTitle>수면 상태</CardTitle></CardHeader>
            <CardBody className="flex-1">
              {mong && (
                <MongSleepForm
                  isSleep={mong.isSleep}
                  disabled={SLEEP_BLOCKED.includes(mong.stateCode) || mong.level === 0}
                  loading={mutations.updateSleep.isPending}
                  onSubmit={(values) => mutations.updateSleep.mutate(values)}
                />
              )}
            </CardBody>
          </Card>
        </div>

        {/* 4행 — 인벤토리 | 진화 이력 */}
        <div className="grid items-stretch gap-4 lg:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>인벤토리</CardTitle>
              <Button size="sm" variant="secondary" onClick={() => setGranting(true)}>
                <Plus className="size-4" /> 지급
              </Button>
            </CardHeader>
            <div className="flex-1">
              <DataTable columns={inventoryColumns} rows={inventories?.items ?? []} rowKey={(i) => i.inventoryId} emptyMessage="인벤토리가 비어 있습니다." />
            </div>
            {inventories && <Pagination page={inventories.page} size={inventories.size} total={inventories.total} onPageChange={setInvPage} />}
          </Card>

          <Card className="flex flex-col">
            <CardHeader><CardTitle>진화 이력</CardTitle></CardHeader>
            <div className="flex-1">
              <DataTable
                columns={historyColumns}
                rows={histories ?? []}
                rowKey={(h) => h.mongEvolutionHistoryId}
                emptyMessage="진화 이력이 없습니다."
              />
            </div>
          </Card>
        </div>
      </div>

      <TaskDetailDialog
        task={openedTaskRow}
        pausing={mutations.pauseTask.isPending}
        resuming={mutations.resumeTask.isPending}
        onClose={() => setOpenedTask(null)}
        onPause={() => openedTaskRow && mutations.pauseTask.mutate(openedTaskRow.taskId)}
        onResume={() => openedTaskRow && mutations.resumeTask.mutate(openedTaskRow.taskId)}
        onDelete={() => { setRemovingTask(openedTaskRow); setOpenedTask(null); }}
      />

      <TaskCreateDialog
        open={creatingTask}
        existing={tasks ?? []}
        loading={mutations.createTask.isPending}
        error={mutations.createTask.error instanceof Error ? mutations.createTask.error.message : undefined}
        onClose={() => { setCreatingTask(false); mutations.createTask.reset(); }}
        onSubmit={(code) => mutations.createTask.mutate(code, { onSuccess: () => setCreatingTask(false) })}
      />

      <ConfirmDialog
        open={removingTask !== null}
        title="스케줄을 삭제합니다"
        description={
          removingTask
            ? `${SCHEDULER_LABEL[removingTask.schedulerTypeCode] ?? removingTask.schedulerTypeCode} — 일시중지와 달리 행까지 지웁니다. 다시 돌리려면 등록해야 합니다.`
            : undefined
        }
        confirmLabel="삭제"
        danger
        loading={mutations.deleteTask.isPending}
        onClose={() => setRemovingTask(null)}
        onConfirm={() => removingTask && mutations.deleteTask.mutate(removingTask.taskId, { onSuccess: () => setRemovingTask(null) })}
      />

      <InventoryGrantDialog
        open={granting}
        loading={mutations.grantInventory.isPending}
        onClose={() => setGranting(false)}
        onSubmit={(body) => mutations.grantInventory.mutate(body, { onSuccess: () => setGranting(false) })}
      />

      <ConfirmDialog
        open={pendingState !== null}
        title="몽 상태를 강제로 바꿉니다"
        description={
          pendingState
            ? `${mong?.stateCode} → ${pendingState.stateCode}. 종료 상태(DEAD/GRADUATE)로 바꾸면 스케줄이 전부 지워지고, 되살리면 다시 걸립니다.`
            : undefined
        }
        confirmLabel="변경"
        danger
        loading={mutations.updateState.isPending}
        onClose={() => setPendingState(null)}
        onConfirm={() => pendingState && mutations.updateState.mutate(pendingState, { onSuccess: () => setPendingState(null) })}
      />

      <ConfirmDialog
        open={removing}
        title="몽을 삭제합니다"
        description="스케줄까지 함께 지워지며 되돌릴 수 없습니다."
        confirmLabel="삭제"
        danger
        loading={mutations.remove.isPending}
        onClose={() => setRemoving(false)}
        onConfirm={() => mutations.remove.mutate(undefined, { onSuccess: () => navigate('/mongs/mongs') })}
      />
    </>
  );
}
