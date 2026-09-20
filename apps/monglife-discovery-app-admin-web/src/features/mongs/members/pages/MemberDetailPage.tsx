import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useAccountMissions, useCollections, useMember, useMemberMutations, useMongList, useOrders, useStep } from '../../queries';
import { StarPointForm } from '../components/StarPointForm';
import { SlotCountForm } from '../components/SlotCountForm';
import { CollectionPanel } from '../components/CollectionPanel';
import { CollectionGrantDialog } from '../components/CollectionGrantDialog';
import { MissionProgressCard } from '../../missions/components/MissionProgressCard';
import { useAccountSummaries } from '../../accounts';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader } from '@/shared/ui';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { StatCard } from '@/shared/components/StatCard';
import { formatDateTime, formatDateTimeSec, formatNumber } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { CYCLE_LABEL, CYCLES } from '../../missions/labels';
import type { MissionCycleCode, Mong, Order } from '../../types';

export function MemberDetailPage() {
  const accountId = Number(useParams().accountId);
  const navigate = useNavigate();
  const { data: member, isLoading, refetch: refetchMember, isFetching: memberFetching, dataUpdatedAt: memberUpdatedAt } = useMember(accountId);
  const { data: collections } = useCollections(accountId);
  const { data: step } = useStep(accountId);
  const { data: mongs } = useMongList({ page: 0, size: 20, accountId });
  const { data: orders } = useOrders({ page: 0, size: 10, accountId });
  const { data: accountMissions } = useAccountMissions(accountId);
  const mutations = useMemberMutations(accountId);
  const [granting, setGranting] = useState<'MONG' | 'MAP' | null>(null);
  const accounts = useAccountSummaries([accountId]);
  const account = accounts.get(accountId);

  if (!isLoading && !member) return <EmptyState message="멤버를 찾을 수 없습니다." />;

  // 주기별 달성 현황. "달성" = 목표치를 채운 것이라 CLAIMABLE(미수령)도 포함한다.
  const missions = accountMissions ?? [];
  const cycleStat = (cycle: MissionCycleCode) => {
    const rows = missions.filter((m) => m.cycleCode === cycle);
    return {
      total: rows.length,
      done: rows.filter((m) => m.stateCode === 'CLAIMABLE' || m.stateCode === 'CLAIMED').length,
      claimed: rows.filter((m) => m.stateCode === 'CLAIMED').length,
    };
  };

  const mongColumns: Column<Mong>[] = [
    { key: 'id', header: 'ID', cell: (m) => <Link className="text-primary hover:underline" to={`/mongs/mongs/${m.mongId}`}>{m.mongId}</Link> },
    { key: 'name', header: '이름', cell: (m) => m.name },
    { key: 'type', header: '몽', cell: (m) => `${m.mongName} (Lv.${m.level})` },
    { key: 'state', header: '상태', cell: (m) => <Badge tone={m.stateCode === 'DEAD' ? 'danger' : 'neutral'}>{m.stateCode}</Badge> },
    { key: 'payPoint', header: '페이 포인트', cell: (m) => formatNumber(m.payPoint) },
  ];

  const orderColumns: Column<Order>[] = [
    { key: 'id', header: 'ID', cell: (o) => <Link className="text-primary hover:underline" to={`/mongs/orders/${o.orderId}`}>{o.orderId}</Link> },
    { key: 'product', header: '상품', cell: (o) => o.productName ?? o.productId ?? '-' },
    { key: 'price', header: '금액', cell: (o) => formatNumber(o.price) },
    { key: 'created', header: '주문일', cell: (o) => formatDateTime(o.createdAt), className: 'text-muted-foreground' },
  ];

  return (
    <>
      <PageHeader
        title={account?.email ?? `멤버 #${accountId}`}
        description={`${account?.isDeleted ? '탈퇴한 계정 · ' : ''}스타 포인트·슬롯을 바꾸면 앱에 곧바로 반영된다(MQTT).`}
        actions={
          <div className="ml-auto flex gap-2">
            <span className="flex min-w-0 items-end gap-2">
              <span className="truncate text-xs text-muted-foreground">{formatDateTimeSec(memberUpdatedAt)} 기준</span>
              <Button variant="secondary" size="sm" className="shrink-0" disabled={memberFetching} onClick={() => refetchMember()}>
                <RefreshCw className={cn('size-4', memberFetching && 'animate-spin')} /> 새로고침
              </Button>
            </span>
          </div>
        }
      />

      {/* 한 줄 7칸. 뒤 3칸이 이번 주기 미션 달성 현황이다 */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard label="스타 포인트" value={formatNumber(member?.starPoint)} />
        <StatCard label="슬롯" value={member ? `${member.slotCount}개` : '-'} />
        <StatCard label="보유 몽" value={formatNumber(mongs?.total)} />
        <StatCard
          label="오늘 환전 걸음"
          value={step ? `${formatNumber(step.todayExchangedWalkingCount)} / ${formatNumber(step.dailyLimit)}` : '-'}
          hint="일일 상한"
        />
        {CYCLES.map((cycle) => {
          const stat = cycleStat(cycle);
          return (
            <StatCard
              key={cycle}
              label={`${CYCLE_LABEL[cycle]} 달성`}
              value={stat.total === 0 ? '-' : `${stat.done} / ${stat.total}`}
              hint={stat.total === 0 ? '적재 없음' : `수령 ${stat.claimed}건`}
            />
          );
        })}
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader><CardTitle>스타 포인트 가감</CardTitle></CardHeader>
          <CardBody className="flex-1">
            <StarPointForm
              current={member?.starPoint ?? 0}
              loading={mutations.adjustStarPoint.isPending}
              onSubmit={(values) => mutations.adjustStarPoint.mutate(values)}
            />
          </CardBody>
        </Card>

        <Card className="flex flex-col">
          <CardHeader><CardTitle>슬롯 수</CardTitle></CardHeader>
          <CardBody className="flex-1">
            <SlotCountForm
              current={member?.slotCount ?? 1}
              loading={mutations.updateSlotCount.isPending}
              onSubmit={(slotCount) => mutations.updateSlotCount.mutate(slotCount)}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>보유 몽</CardTitle></CardHeader>
          <DataTable
            columns={mongColumns}
            rows={mongs?.items ?? []}
            rowKey={(m) => m.mongId}
            emptyMessage="보유한 몽이 없습니다."
            onRowClick={(m) => navigate(`/mongs/mongs/${m.mongId}`)}
          />
        </Card>

        <Card>
          <CardHeader><CardTitle>최근 주문</CardTitle></CardHeader>
          <DataTable columns={orderColumns} rows={orders?.items ?? []} rowKey={(o) => o.orderId} emptyMessage="주문 내역이 없습니다." />
        </Card>

        <CollectionPanel
          title="컬렉션 몽"
          items={(collections?.mongs ?? []).map((c) => ({ code: c.mongCode, name: c.mongName, owned: c.isIncluded }))}
          onGrantClick={() => setGranting('MONG')}
        />
        <CollectionPanel
          title="컬렉션 맵"
          items={(collections?.maps ?? []).map((c) => ({ code: c.mapCode, name: c.mapName, owned: c.isIncluded }))}
          onGrantClick={() => setGranting('MAP')}
        />
      </div>

      <MissionProgressCard accountId={accountId} />

      <CollectionGrantDialog
        open={granting !== null}
        kind={granting ?? 'MONG'}
        ownedCodes={
          granting === 'MAP'
            ? (collections?.maps ?? []).filter((c) => c.isIncluded).map((c) => c.mapCode)
            : (collections?.mongs ?? []).filter((c) => c.isIncluded).map((c) => c.mongCode)
        }
        loading={mutations.grantMong.isPending || mutations.grantMap.isPending}
        onClose={() => setGranting(null)}
        onSubmit={(code) => {
          const mutation = granting === 'MAP' ? mutations.grantMap : mutations.grantMong;
          mutation.mutate(code, { onSuccess: () => setGranting(null) });
        }}
      />
    </>
  );
}
