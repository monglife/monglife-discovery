import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMembers } from '../../queries';
import type { Member } from '../../types';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { SearchInput } from '@/shared/components/SearchInput';
import { Card, PageHeader, Pagination } from '@/shared/ui';
import { formatDateTime, formatNumber } from '@/shared/lib/format';
import { toSortParam, type SortState } from '@/shared/api/types';

const SIZE = 15;

export function MemberListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [accountIdText, setAccountIdText] = useState('');
  const [sort, setSort] = useState<SortState | null>(null);

  // 멤버는 계정 ID 가 PK 다. 숫자가 아니면 필터를 걸지 않는다.
  const accountId = Number(accountIdText);
  const params = useMemo(
    () => ({ page, size: SIZE, accountId: Number.isFinite(accountId) && accountIdText ? accountId : undefined, sort: toSortParam(sort) }),
    [page, accountId, accountIdText, sort],
  );
  const { data, isLoading } = useMembers(params);

  const columns: Column<Member>[] = [
    { key: 'accountId', header: '계정 ID', sortKey: 'accountId', cell: (m) => m.accountId },
    { key: 'starPoint', header: '스타 포인트', sortKey: 'starPoint', cell: (m) => formatNumber(m.starPoint) },
    { key: 'slotCount', header: '슬롯', sortKey: 'slotCount', cell: (m) => m.slotCount },
    { key: 'created', header: '등록일', sortKey: 'createdAt', cell: (m) => formatDateTime(m.createdAt), className: 'text-muted-foreground' },
  ];

  return (
    <>
      <PageHeader title="멤버·포인트" description="게임 플레이어. 계정 ID 로 discovery 계정과 이어진다." />

      <div className="mb-3 flex flex-wrap gap-2">
        <SearchInput value={accountIdText} onChange={(v) => { setAccountIdText(v.replace(/\D/g, '')); setPage(0); }} placeholder="계정 ID" className="w-48" />
      </div>

      <Card>
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(m) => m.accountId}
          loading={isLoading}
          emptyMessage="멤버가 없습니다."
          onRowClick={(m) => navigate(`/mongs/members/${m.accountId}`)}
          sort={sort}
          onSortChange={(s) => { setSort(s); setPage(0); }}
        />
        {data && <Pagination page={data.page} size={data.size} total={data.total} onPageChange={setPage} />}
      </Card>
    </>
  );
}
