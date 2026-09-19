import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAccountMissions } from '../../queries';
import { CYCLE_LABEL, CYCLES, STATE_LABEL, STATE_TONE } from '../labels';
import type { AccountMission, MissionCycleCode } from '../../types';
import { Badge, Button, Card, CardHeader, CardTitle } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { formatDateTime, formatDateTimeSec, formatNumber } from '@/shared/lib/format';

const columns: Column<AccountMission>[] = [
  {
    key: 'mission',
    header: '미션',
    cell: (r) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate">{r.title}</span>
        <span className="font-mono text-xs text-muted-foreground">{r.missionCode}</span>
      </div>
    ),
  },
  {
    key: 'progress',
    header: '진행도',
    cell: (r) => (
      <div className="flex min-w-0 items-center gap-2">
        {/* 막대는 보조다. 숫자를 먼저 읽게 둔다 */}
        <span className={`tabular-nums ${r.progressCount >= r.goalCount ? 'text-success' : ''}`}>
          {formatNumber(r.progressCount)} / {formatNumber(r.goalCount)}
        </span>
        <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-surface-muted">
          <span
            className={`block h-full rounded-full ${r.progressCount >= r.goalCount ? 'bg-success' : 'bg-primary'}`}
            style={{ width: `${Math.min(100, Math.round((r.progressCount / Math.max(1, r.goalCount)) * 100))}%` }}
          />
        </span>
      </div>
    ),
  },
  {
    key: 'detail',
    header: '센 대상',
    // DISTINCT 목표에서만 찬다. 중복 제거에 쓴 실제 코드라 "왜 안 올라가지" 문의에 바로 답이 된다.
    cell: (r) =>
      r.detailCodes.length === 0
        ? <span className="text-muted-foreground">-</span>
        : <span className="font-mono text-xs">{r.detailCodes.join(', ')}</span>,
  },
  { key: 'state', header: '상태', cell: (r) => <Badge tone={STATE_TONE[r.stateCode]}>{STATE_LABEL[r.stateCode]}</Badge> },
  {
    key: 'claimedAt',
    header: '수령 시각',
    className: 'text-muted-foreground',
    cell: (r) => (r.claimedAt ? formatDateTime(r.claimedAt) : '-'),
  },
];

/**
 * 계정의 이번 주기 미션 달성 현황. 일간·주간·월간을 탭으로 끊는다.
 * 탭 라벨에 달성/전체를 같이 찍어 탭을 옮기지 않고도 세 주기를 견줄 수 있게 한다.
 *
 * 서버가 오늘 기준 주기만 돌려준다 - 지난 주기 행은 DB 에 남아 있지만 여기서는 보이지 않는다.
 */
export function MissionProgressCard({ accountId }: { accountId: number }) {
  const [tab, setTab] = useState<MissionCycleCode>('DAILY');
  const { data, isLoading, isError, error, refetch, isFetching, dataUpdatedAt } = useAccountMissions(accountId);
  const rows = data ?? [];

  const byCycle = (cycle: MissionCycleCode) => rows.filter((r) => r.cycleCode === cycle);
  const tabRows = byCycle(tab);
  // 주기 키는 그 묶음 안에서 모두 같다. 어느 날짜/주차의 현황인지 밝혀 둔다.
  const cycleKey = tabRows[0]?.cycleKey;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>미션 달성 현황</CardTitle>
        <span className="flex min-w-0 items-end gap-2">
          {cycleKey && <span className="font-mono text-xs text-muted-foreground">{cycleKey}</span>}
          <span className="truncate text-xs text-muted-foreground">{formatDateTimeSec(dataUpdatedAt)} 기준</span>
          <Button size="sm" variant="secondary" className="shrink-0" disabled={isFetching} onClick={() => refetch()}>
            <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} /> 새로고침
          </Button>
        </span>
      </CardHeader>

      {isError ? (
        <p className="p-4 text-sm text-danger">{error instanceof Error ? error.message : '조회에 실패했습니다.'}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 px-5 pt-3">
            {CYCLES.map((cycle) => {
              const cycleRows = byCycle(cycle);
              const done = cycleRows.filter((r) => r.stateCode === 'CLAIMABLE' || r.stateCode === 'CLAIMED').length;
              return (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setTab(cycle)}
                  className={cn(
                    'rounded-md border px-2.5 py-1.5 text-xs sm:px-3 sm:text-sm',
                    tab === cycle ? 'border-primary-hover bg-primary text-primary-foreground' : 'border-border bg-surface-muted text-muted-foreground hover:bg-surface',
                  )}
                >
                  {CYCLE_LABEL[cycle]}
                  <span className={cn('ml-1.5 tabular-nums', tab === cycle ? 'opacity-80' : 'text-muted-foreground')}>
                    {done}/{cycleRows.length}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3">
            <DataTable
              columns={columns}
              rows={tabRows}
              rowKey={(r) => r.accountMissionId}
              loading={isLoading}
              emptyMessage={`${CYCLE_LABEL[tab]} 미션이 적재되지 않았습니다.`}
            />
          </div>
        </>
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <p className="px-5 py-3 text-xs text-muted-foreground">
          세 주기 모두 비어 있으면 이 계정이 아직 앱에서 미션 화면을 열지 않은 것입니다 — 사용자 미션은 조회 시점에 적재됩니다.
        </p>
      )}
    </Card>
  );
}
