import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCollections, useMember, useMemberMutations, useMongList, useOrders, useStep } from '../../queries';
import { StarPointForm } from '../components/StarPointForm';
import { SlotCountForm } from '../components/SlotCountForm';
import { CollectionPanel } from '../components/CollectionPanel';
import { CollectionGrantDialog } from '../components/CollectionGrantDialog';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader } from '@/shared/ui';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { StatCard } from '@/shared/components/StatCard';
import { formatDateTime, formatNumber } from '@/shared/lib/format';
import type { Mong, Order } from '../../types';

export function MemberDetailPage() {
  const accountId = Number(useParams().accountId);
  const { data: member, isLoading } = useMember(accountId);
  const { data: collections } = useCollections(accountId);
  const { data: step } = useStep(accountId);
  const { data: mongs } = useMongList({ page: 0, size: 20, accountId });
  const { data: orders } = useOrders({ page: 0, size: 10, accountId });
  const mutations = useMemberMutations(accountId);
  const [granting, setGranting] = useState<'MONG' | 'MAP' | null>(null);

  if (!isLoading && !member) return <EmptyState message="멤버를 찾을 수 없습니다." />;

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
        title={`멤버 #${accountId}`}
        description="스타 포인트·슬롯을 바꾸면 앱에 곧바로 반영된다(MQTT)."
        actions={
          <Button variant="secondary" className="ml-auto" onClick={() => history.back()}>
            <ArrowLeft className="size-4" /> 뒤로
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="스타 포인트" value={formatNumber(member?.starPoint)} />
        <StatCard label="슬롯" value={member ? `${member.slotCount}개` : '-'} />
        <StatCard label="보유 몽" value={formatNumber(mongs?.total)} />
        <StatCard
          label="오늘 환전 걸음"
          value={step ? `${formatNumber(step.todayExchangedWalkingCount)} / ${formatNumber(step.dailyLimit)}` : '-'}
          hint="일일 상한"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>스타 포인트 가감</CardTitle></CardHeader>
          <CardBody>
            <StarPointForm
              current={member?.starPoint ?? 0}
              loading={mutations.adjustStarPoint.isPending}
              onSubmit={(values) => mutations.adjustStarPoint.mutate(values)}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>슬롯 수</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <SlotCountForm
              current={member?.slotCount ?? 1}
              loading={mutations.updateSlotCount.isPending}
              onSubmit={(slotCount) => mutations.updateSlotCount.mutate(slotCount)}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>보유 몽</CardTitle></CardHeader>
          <DataTable columns={mongColumns} rows={mongs?.items ?? []} rowKey={(m) => m.mongId} emptyMessage="보유한 몽이 없습니다." />
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
