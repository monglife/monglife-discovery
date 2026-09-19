import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useOrder, useReconsumeOrder } from '../../queries';
import { useAccountSummaries } from '../../accounts';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { CopyButton } from '@/shared/components/CopyButton';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader } from '@/shared/ui';
import { formatDateTime, formatNumber } from '@/shared/lib/format';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2 last:border-b-0">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 text-right text-sm break-all">{children}</span>
    </div>
  );
}

export function OrderDetailPage() {
  const orderId = Number(useParams().orderId);
  const { data, isLoading } = useOrder(orderId);
  const reconsume = useReconsumeOrder();
  const accounts = useAccountSummaries([data?.order.accountId]);
  const [confirming, setConfirming] = useState(false);

  if (!isLoading && !data) return <EmptyState message="주문을 찾을 수 없습니다." />;

  const order = data?.order;
  const inApp = data?.inAppOrder;
  const canReconsume = inApp?.isPayed === true && inApp?.isConsumed === false;

  return (
    <>
      <PageHeader
        title={`주문 #${orderId}`}
        description="구글 플레이 조회는 외부 호출이라 실패할 수 있다. 실패해도 주문 자체는 표시된다."
        actions={
          <div className="ml-auto flex gap-2">
            <Button size="sm" disabled={!canReconsume} onClick={() => setConfirming(true)}>
              <RefreshCw className="size-4" /> 재소비
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>주문</CardTitle></CardHeader>
          <CardBody className="py-0">
            <Row label="계정">
              {order ? (
              <Link className="text-primary hover:underline" to={`/mongs/members/${order.accountId}`}>
                {accounts.get(order.accountId)?.email ?? `#${order.accountId}`}
              </Link>
            ) : '-'}
            </Row>
            <Row label="상품">{order?.productName ?? order?.productId ?? '-'}</Row>
            <Row label="금액">{formatNumber(order?.price)}</Row>
            <Row label="지급 스타 포인트">{formatNumber(data?.starPoint)}</Row>
            <Row label="인앱 주문 ID">
              <span className="inline-flex items-center gap-1 font-mono text-xs">
                {order?.socialOrderId}
                {order && <CopyButton value={order.socialOrderId} />}
              </span>
            </Row>
            <Row label="주문일">{formatDateTime(order?.createdAt)}</Row>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>구글 플레이</CardTitle>
            {!inApp && <Badge tone="warning">조회 실패</Badge>}
          </CardHeader>
          <CardBody className="py-0">
            {inApp ? (
              <>
                <Row label="결제 상태">
                  <Badge tone={inApp.isPayed ? 'success' : 'danger'}>{inApp.purchaseType ?? '-'}</Badge>
                </Row>
                <Row label="소비 여부">
                  <Badge tone={inApp.isConsumed ? 'success' : 'warning'}>{inApp.isConsumed ? '소비됨' : '미소비'}</Badge>
                </Row>
                <Row label="구매 시각">{formatDateTime(inApp.purchasedAt)}</Row>
              </>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                구글 플레이에서 주문 정보를 가져오지 못했습니다. 잠시 후 다시 시도하세요.
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={confirming}
        title="주문을 재소비합니다"
        description="결제·미소비를 확인한 뒤 스타 포인트를 지급하고 소비 처리합니다. 이미 지급된 주문이면 실패합니다."
        confirmLabel="재소비"
        loading={reconsume.isPending}
        onClose={() => setConfirming(false)}
        onConfirm={() => reconsume.mutate(orderId, { onSuccess: () => setConfirming(false) })}
      />
    </>
  );
}
