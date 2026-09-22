import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMembers } from '../../queries';
import { useAccountSummaries } from '../../accounts';
import { AccountCell } from '../../components/AccountCell';
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
  // mongs 는 계정 ID 만 들고 있다. 이메일은 common-api 에서 한 번 더 받아 붙인다.
  const accounts = useAccountSummaries((data?.items ?? []).map((m) => m.accountId));

  const columns: Column<Member>[] = [
    { key: 'account', header: '계정', sortKey: 'accountId', cell: (m) => <AccountCell accountId={m.accountId} account={accounts.get(m.accountId)} /> },
    { key: 'starPoint', header: '스타 포인트', sortKey: 'starPoint', cell: (m) => formatNumber(m.starPoint) },
    { key: 'slotCount', header: '슬롯', sortKey: 'slotCount', cell: (m) => m.slotCount },
    { key: 'created', header: '등록일', sortKey: 'createdAt', cell: (m) => formatDateTime(m.createdAt), className: 'text-muted-foreground' },
  ];

  return (
    <>
      <PageHeader title="멤버·포인트" description="게임 플레이어. 계정 ID 로 discovery 계정과 이어진다." />

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput value={accountIdText} onChange={(v) => { setAccountIdText(v.replace(/\D/g, '')); setPage(0); }} placeholder="계정 ID" className="w-full sm:w-48" />
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
