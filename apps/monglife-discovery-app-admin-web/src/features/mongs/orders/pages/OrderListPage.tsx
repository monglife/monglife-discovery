import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../queries';
import type { Order } from '../../types';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { SearchInput } from '@/shared/components/SearchInput';
import { Card, PageHeader, Pagination } from '@/shared/ui';
import { formatDateTime, formatNumber } from '@/shared/lib/format';
import { toSortParam, type SortState } from '@/shared/api/types';

const SIZE = 15;

export function OrderListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [accountIdText, setAccountIdText] = useState('');
  const [productId, setProductId] = useState('');
  const [sort, setSort] = useState<SortState | null>(null);

  const accountId = Number(accountIdText);
  const params = useMemo(
    () => ({
      page,
      size: SIZE,
      accountId: accountIdText && Number.isFinite(accountId) ? accountId : undefined,
      productId: productId || undefined,
      sort: toSortParam(sort),
    }),
    [page, accountIdText, accountId, productId, sort],
  );
  const { data, isLoading } = useOrders(params);

  const columns: Column<Order>[] = [
    { key: 'id', header: 'ID', sortKey: 'orderId', cell: (o) => o.orderId, className: 'w-16 text-muted-foreground' },
    { key: 'account', header: '계정', cell: (o) => o.accountId },
    { key: 'product', header: '상품', cell: (o) => o.productName ?? o.productId ?? '-' },
    { key: 'price', header: '금액', sortKey: 'price', cell: (o) => formatNumber(o.price) },
    { key: 'social', header: '인앱 주문 ID', cell: (o) => <span className="font-mono text-xs break-all">{o.socialOrderId}</span> },
    { key: 'created', header: '주문일', sortKey: 'createdAt', cell: (o) => formatDateTime(o.createdAt), className: 'text-muted-foreground' },
  ];

  return (
    <>
      <PageHeader title="주문" description="구글 인앱 결제 내역. 소비되지 않은 주문은 상세에서 재처리한다." />

      <div className="mb-3 flex flex-wrap gap-2">
        <SearchInput value={accountIdText} onChange={(v) => { setAccountIdText(v.replace(/\D/g, '')); setPage(0); }} placeholder="계정 ID" className="w-40" />
        <SearchInput value={productId} onChange={(v) => { setProductId(v); setPage(0); }} placeholder="상품 ID (예: PRDT000)" className="w-56" />
      </div>

      <Card>
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(o) => o.orderId}
          loading={isLoading}
          emptyMessage="주문이 없습니다."
          onRowClick={(o) => navigate(`/mongs/orders/${o.orderId}`)}
          sort={sort}
          onSortChange={(s) => { setSort(s); setPage(0); }}
        />
        {data && <Pagination page={data.page} size={data.size} total={data.total} onPageChange={setPage} />}
      </Card>
    </>
  );
}
