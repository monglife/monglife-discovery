import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useEvolutionHistories, useInventories, useMong, useMongMutations, useTasks } from '../../queries';
import { useAccountSummaries } from '../../accounts';
import type { EvolutionHistory, Inventory, MongStateCode, Task } from '../../types';
import { MongStateBadge, MongStatusBadge } from '../components/MongBadges';
import { MongStatusForm } from '../components/MongStatusForm';
import { MongStateForm } from '../components/MongStateForm';
import { MongSleepForm } from '../components/MongSleepForm';
import { InventoryGrantDialog } from '../components/InventoryGrantDialog';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { useClientPage } from '@/shared/components/ClientPagination';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { StatCard } from '@/shared/components/StatCard';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader, Pagination } from '@/shared/ui';
import { formatDateTime, formatDuration, formatNumber } from '@/shared/lib/format';

/** 수면·기상을 서버가 받아 주지 않는 상태 */
const SLEEP_BLOCKED: MongStateCode[] = ['DEAD', 'GRADUATE', 'GRADUATE_READY'];

export function MongDetailPage() {
  const mongId = Number(useParams().mongId);
  const navigate = useNavigate();
  const { data: mong, isLoading } = useMong(mongId);
  const { data: tasks } = useTasks(mongId);
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
  const [pendingState, setPendingState] = useState<{ stateCode: MongStateCode; reason?: string } | null>(null);

  if (!isLoading && !mong) return <EmptyState message="몽을 찾을 수 없습니다." />;

  const taskColumns: Column<Task>[] = [
    { key: 'type', header: '스케줄', cell: (t) => <span className="font-mono text-xs">{t.schedulerTypeCode}</span> },
    {
      key: 'state',
      header: '상태',
      cell: (t) => (
        <span className="flex items-center gap-1.5">
          <Badge tone={t.stateCode === 'PROCESSING' ? 'success' : 'neutral'}>{t.stateCode}</Badge>
          {!t.isScheduled && t.stateCode === 'PROCESSING' && <Badge tone="danger">미등록</Badge>}
        </span>
      ),
    },
    { key: 'expired', header: '만료', cell: (t) => formatDateTime(t.expiredAt) },
    { key: 'rest', header: '남은 시간', cell: (t) => formatDuration(t.restExpirationSeconds) },
    {
      key: 'action',
      header: '',
      className: 'text-right',
      cell: (t) =>
        t.stateCode === 'PROCESSING' ? (
          <Button size="sm" variant="secondary" loading={mutations.pauseTask.isPending} onClick={() => mutations.pauseTask.mutate(t.taskId)}>
            일시 중지
          </Button>
        ) : (
          <Button size="sm" variant="secondary" loading={mutations.resumeTask.isPending} onClick={() => mutations.resumeTask.mutate(t.taskId)}>
            재시작
          </Button>
        ),
    },
  ];

  const inventoryColumns: Column<Inventory>[] = [
    { key: 'code', header: '코드', cell: (i) => <span className="font-mono text-xs">{i.inventoryCode}</span> },
    { key: 'name', header: '이름', cell: (i) => i.inventoryName },
    { key: 'type', header: '종류', cell: (i) => <Badge>{i.inventoryTypeCode}</Badge> },
  ];

  const historyColumns: Column<EvolutionHistory>[] = [
    { key: 'code', header: '몽 코드', cell: (h) => <span className="font-mono text-xs">{h.mongCode}</span> },
    { key: 'score', header: '진화 점수', cell: (h) => formatNumber(Math.round(h.evolutionScore)) },
  ];

  return (
    <>
      <PageHeader
        title={mong ? `${mong.name} #${mong.mongId}` : `몽 #${mongId}`}
        description={mong ? `${mong.mongName} · Lv.${mong.level} · ${account?.email ?? `#${mong.accountId}`}` : undefined}
        actions={
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => history.back()}>
              <ArrowLeft className="size-4" /> 뒤로
            </Button>
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
            <span className="text-xs text-muted-foreground">mongs_task</span>
          </CardHeader>
          <DataTable columns={taskColumns} rows={taskPage.items} rowKey={(t) => t.taskId} emptyMessage="등록된 스케줄이 없습니다." />
          {taskPage.total > 0 && (
            <Pagination page={taskPage.page} size={taskPage.size} total={taskPage.total} onPageChange={taskPage.setPage} />
          )}
        </Card>

        {/* 2행 — 지수 수정 | 상태·수면 변경 */}
        <div className="grid items-stretch gap-4 lg:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader><CardTitle>지수 수정</CardTitle></CardHeader>
            <CardBody className="flex-1">
              {mong && (
                <MongStatusForm
                  mong={mong}
                  loading={mutations.updateStatus.isPending}
                  onSubmit={(body) => mutations.updateStatus.mutate(body)}
                />
              )}
            </CardBody>
          </Card>

          <Card className="flex flex-col">
            <CardHeader><CardTitle>상태 변경</CardTitle></CardHeader>
            <CardBody className="flex-1 space-y-4">
              {mong && <MongStateForm current={mong.stateCode} onSubmit={setPendingState} />}
              <div className="border-t pt-4">
                {mong && (
                  <MongSleepForm
                    isSleep={mong.isSleep}
                    disabled={SLEEP_BLOCKED.includes(mong.stateCode) || mong.level === 0}
                    loading={mutations.updateSleep.isPending}
                    onSubmit={(values) => mutations.updateSleep.mutate(values)}
                  />
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 3행 — 인벤토리 | 진화 이력 */}
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
            <CardHeader>
              <CardTitle>진화 이력</CardTitle>
              {mong && (
                <Link className="text-xs text-primary hover:underline" to={`/mongs/members/${mong.accountId}`}>
                  멤버 보기
                </Link>
              )}
            </CardHeader>
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
