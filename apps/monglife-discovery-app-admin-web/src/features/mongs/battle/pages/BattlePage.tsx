import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useBattleMutations, useBattleStats, useMatches, useQueuePlayers, useRefreshBattle } from '../../queries';
import type { MatchSummary, QueuePlayer } from '../../types';
import { MatchDetailDialog } from '../components/MatchDetailDialog';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { useClientPage } from '@/shared/components/ClientPagination';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { FilterSelect } from '@/shared/components/FilterSelect';
import { StatCard } from '@/shared/components/StatCard';
import { Badge, Button, Card, CardHeader, CardTitle, PageHeader, Pagination } from '@/shared/ui';
import { formatDateTime, formatDateTimeSec, formatNumber } from '@/shared/lib/format';

const SIZE = 10;
const STATE_CODES = ['ENTERING', 'PROCESS', 'END'];

export function BattlePage() {
  const [page, setPage] = useState(0);
  const [stateCode, setStateCode] = useState('');
  const [detailId, setDetailId] = useState<number | null>(null);
  const [dequeue, setDequeue] = useState<QueuePlayer | null>(null);
  const [terminating, setTerminating] = useState<MatchSummary | null>(null);

  const { data: queue, isLoading: queueLoading, dataUpdatedAt, isFetching } = useQueuePlayers();
  const refresh = useRefreshBattle();
  const params = useMemo(() => ({ page, size: SIZE, stateCode: stateCode || undefined }), [page, stateCode]);
  const { data: matches, isLoading } = useMatches(params);
  const { data: stats } = useBattleStats();
  const { removeFromQueue, terminate } = useBattleMutations();
  // 대기열은 목록이 통째로 온다. 화면에서 끊는다.
  const queuePage = useClientPage(queue, SIZE);

  const queueColumns: Column<QueuePlayer>[] = [
    { key: 'mong', header: '몽 ID', cell: (q) => q.mongId },
    { key: 'account', header: '계정', cell: (q) => q.accountId },
    { key: 'device', header: '기기', cell: (q) => <span className="font-mono text-xs break-all">{q.deviceId}</span> },
    { key: 'created', header: '등록', cell: (q) => formatDateTime(q.createdAt), className: 'text-muted-foreground' },
    {
      key: 'action',
      header: '',
      className: 'text-right',
      cell: (q) => (
        <Button size="sm" variant="secondary" onClick={() => setDequeue(q)}>강제 이탈</Button>
      ),
    },
  ];

  const matchColumns: Column<MatchSummary>[] = [
    { key: 'id', header: 'ID', cell: (m) => m.matchId, className: 'w-16 text-muted-foreground' },
    {
      key: 'state',
      header: '상태',
      cell: (m) => <Badge tone={m.stateCode === 'END' ? 'neutral' : m.stateCode === 'PROCESS' ? 'success' : 'primary'}>{m.stateCode}</Badge>,
    },
    { key: 'round', header: '라운드', cell: (m) => `${m.round} / ${m.maxRound}` },
    { key: 'players', header: '플레이어', cell: (m) => `${m.playerCount}명${m.botCount > 0 ? ` (봇 ${m.botCount})` : ''}` },
    { key: 'created', header: '시작', cell: (m) => formatDateTime(m.createdAt), className: 'text-muted-foreground' },
    {
      key: 'action',
      header: '',
      className: 'text-right',
      cell: (m) =>
        m.stateCode !== 'END' ? (
          <span onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="secondary" onClick={() => setTerminating(m)}>강제 종료</Button>
          </span>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="배틀"
        description="대기열은 30초마다 스스로 다시 읽는다. 지금 바로 보려면 새로고침."
        actions={
          <div className="ml-auto flex min-w-0 items-center justify-end gap-2">
            <span className="truncate text-xs text-muted-foreground">{formatDateTimeSec(dataUpdatedAt)} 기준</span>
            <Button variant="secondary" size="sm" className="shrink-0" loading={isFetching} onClick={refresh}>
              <RefreshCw className="size-4" />
              <span className="hidden sm:inline">새로고침</span>
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="대기열" value={formatNumber(stats?.queueSize)} />
        <StatCard label="진행 중 매치" value={formatNumber(stats?.processingMatches)} />
        <StatCard label="오늘 매치" value={formatNumber(stats?.todayMatches)} hint={`봇 포함 ${formatNumber(stats?.todayBotMatches)}건`} />
        <StatCard label="전체 매치" value={formatNumber(stats?.totalMatches)} />
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>매치 대기열</CardTitle>
          <span className="text-xs text-muted-foreground">Redis</span>
        </CardHeader>
        <DataTable
          columns={queueColumns}
          rows={queuePage.items}
          rowKey={(q) => `${q.mongId}:${q.deviceId}`}
          loading={queueLoading}
          emptyMessage="대기 중인 플레이어가 없습니다."
        />
        {queuePage.total > 0 && (
          <Pagination page={queuePage.page} size={queuePage.size} total={queuePage.total} onPageChange={queuePage.setPage} />
        )}
      </Card>

      <Card>
        <CardHeader className="flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <CardTitle>매치</CardTitle>
          <FilterSelect label="상태" value={stateCode} onChange={(v) => { setStateCode(v); setPage(0); }} options={STATE_CODES} className="w-full sm:w-40" />
        </CardHeader>
        <DataTable
          columns={matchColumns}
          rows={matches?.items ?? []}
          rowKey={(m) => m.matchId}
          loading={isLoading}
          emptyMessage="매치가 없습니다."
          onRowClick={(m) => setDetailId(m.matchId)}
        />
        {matches && <Pagination page={matches.page} size={matches.size} total={matches.total} onPageChange={setPage} />}
      </Card>

      <MatchDetailDialog matchId={detailId} onClose={() => setDetailId(null)} />

      <ConfirmDialog
        open={dequeue !== null}
        title="대기열에서 강제로 빼냅니다"
        description="배팅했던 페이 포인트는 되돌려 줍니다."
        confirmLabel="강제 이탈"
        loading={removeFromQueue.isPending}
        onClose={() => setDequeue(null)}
        onConfirm={() => dequeue && removeFromQueue.mutate(dequeue.mongId, { onSuccess: () => setDequeue(null) })}
      />

      <ConfirmDialog
        open={terminating !== null}
        title="매치를 강제 종료합니다"
        description="보상·정산 없이 END 로 마감하고 앱에 종료를 알립니다. 멈춰 있는 매치에만 쓰세요."
        confirmLabel="강제 종료"
        danger
        loading={terminate.isPending}
        onClose={() => setTerminating(null)}
        onConfirm={() => terminating && terminate.mutate(terminating.matchId, { onSuccess: () => setTerminating(null) })}
      />
    </>
  );
}
