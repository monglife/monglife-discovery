import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMongList } from '../../queries';
import { useAccountSummaries } from '../../accounts';
import { AccountCell } from '../../components/AccountCell';
import type { Mong, MongStateCode, MongStatusCode } from '../../types';
import { MongStateBadge, MongStatusBadge } from '../components/MongBadges';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { FilterSelect } from '@/shared/components/FilterSelect';
import { SearchInput } from '@/shared/components/SearchInput';
import { Card, PageHeader, Pagination } from '@/shared/ui';
import { formatDateTime, formatNumber } from '@/shared/lib/format';
import { toSortParam, type SortState } from '@/shared/api/types';

const SIZE = 10;
const STATE_CODES: MongStateCode[] = ['NORMAL', 'EVOLUTION_READY', 'GRADUATE_READY', 'GRADUATE', 'DEAD'];
const STATUS_CODES: MongStatusCode[] = ['NORMAL', 'HUNGRY', 'SOMNOLENCE', 'SICK'];

export function MongListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [accountIdText, setAccountIdText] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [statusCode, setStatusCode] = useState('');
  const [sort, setSort] = useState<SortState | null>(null);

  const accountId = Number(accountIdText);
  const params = useMemo(
    () => ({
      page,
      size: SIZE,
      query: query || undefined,
      accountId: accountIdText && Number.isFinite(accountId) ? accountId : undefined,
      stateCode: stateCode as MongStateCode | '',
      statusCode: statusCode as MongStatusCode | '',
      sort: toSortParam(sort),
    }),
    [page, query, accountIdText, accountId, stateCode, statusCode, sort],
  );
  const { data, isLoading } = useMongList(params);
  const accounts = useAccountSummaries((data?.items ?? []).map((m) => m.accountId));

  const reset = () => setPage(0);

  const columns: Column<Mong>[] = [
    { key: 'id', header: 'ID', sortKey: 'mongId', cell: (m) => m.mongId, className: 'w-16 text-muted-foreground' },
    { key: 'name', header: '이름', cell: (m) => <span className="font-medium">{m.name}</span> },
    { key: 'type', header: '몽', cell: (m) => `${m.mongName} (Lv.${m.level})` },
    { key: 'account', header: '계정', sortKey: 'accountId', cell: (m) => <AccountCell accountId={m.accountId} account={accounts.get(m.accountId)} /> },
    { key: 'state', header: '상태', cell: (m) => <MongStateBadge code={m.stateCode} /> },
    { key: 'status', header: '지수', cell: (m) => <MongStatusBadge code={m.statusCode} /> },
    { key: 'exp', header: '경험치', sortKey: 'exp', cell: (m) => `${formatNumber(Math.round(m.exp))} / ${formatNumber(m.maxStatus)}` },
    { key: 'payPoint', header: '페이 포인트', sortKey: 'payPoint', cell: (m) => formatNumber(m.payPoint) },
    { key: 'created', header: '생성일', sortKey: 'createdAt', cell: (m) => formatDateTime(m.createdAt), className: 'text-muted-foreground' },
  ];

  return (
    <>
      <PageHeader title="몽" description="캐릭터 목록. 행을 누르면 지수·상태·스케줄을 볼 수 있다." />

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput value={query} onChange={(v) => { setQuery(v); reset(); }} placeholder="몽 이름 검색" className="w-full sm:w-56" />
        <SearchInput value={accountIdText} onChange={(v) => { setAccountIdText(v.replace(/\D/g, '')); reset(); }} placeholder="계정 ID" className="w-full sm:w-40" />
        <div className="flex gap-2">
          <FilterSelect label="상태" value={stateCode} onChange={(v) => { setStateCode(v); reset(); }} options={STATE_CODES} className="min-w-0 flex-1 sm:w-44 sm:flex-none" />
          <FilterSelect label="지수" value={statusCode} onChange={(v) => { setStatusCode(v); reset(); }} options={STATUS_CODES} className="min-w-0 flex-1 sm:w-36 sm:flex-none" />
        </div>
      </div>

      <Card>
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(m) => m.mongId}
          loading={isLoading}
          emptyMessage="몽이 없습니다."
          onRowClick={(m) => navigate(`/mongs/mongs/${m.mongId}`)}
          sort={sort}
          onSortChange={(s) => { setSort(s); reset(); }}
        />
        {data && <Pagination page={data.page} size={data.size} total={data.total} onPageChange={setPage} />}
      </Card>
    </>
  );
}
