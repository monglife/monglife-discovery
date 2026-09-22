import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccounts } from '../queries';
import type { Account } from '../types';
import { PlatformBadge } from '../components/PlatformBadge';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { SearchInput } from '@/shared/components/SearchInput';
import { FilterSelect } from '@/shared/components/FilterSelect';
import { Badge, Card, PageHeader, Pagination } from '@/shared/ui';
import { formatDateTime } from '@/shared/lib/format';
import { toSortParam, type SortState } from '@/shared/api/types';

const SIZE = 15;

export function AccountListPage() {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('');
  const [role, setRole] = useState('NORMAL');
  const [status, setStatus] = useState('ACTIVE');
  const [sort, setSort] = useState<SortState>({ key: 'accountId', dir: 'desc' });
  const navigate = useNavigate();
  const { data, isLoading } = useAccounts({
    page,
    size: SIZE,
    query,
    platform: platform || undefined,
    role: role || undefined,
    status: (status || undefined) as 'ACTIVE' | 'DELETED' | undefined,
    sort: toSortParam(sort),
  });
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(0); };

  const columns: Column<Account>[] = [
    { key: 'id', header: 'ID', sortKey: 'accountId', cell: (a) => a.accountId, className: 'w-16 tabular-nums' },
    { key: 'email', header: '이메일', cell: (a) => a.email },
    { key: 'platform', header: '플랫폼', cell: (a) => <PlatformBadge platform={a.platform} /> },
    { key: 'name', header: '이름', cell: (a) => a.name },
    { key: 'social', header: '소셜 ID', cell: (a) => <span className="text-muted-foreground">{a.socialAccountId ?? '-'}</span> },
    { key: 'role', header: '권한', cell: (a) => <Badge tone={a.role === 'ADMIN' ? 'primary' : 'neutral'}>{a.role}</Badge> },
    { key: 'status', header: '상태', cell: (a) => (a.isDeleted ? <Badge tone="danger">탈퇴</Badge> : <Badge tone="success">정상</Badge>) },
    { key: 'createdAt', header: '가입일', sortKey: 'createdAt', cell: (a) => formatDateTime(a.createdAt), className: 'text-muted-foreground' },
  ];

  return (
    <>
      <PageHeader
        title="계정"
        description="사용자 계정 목록"
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <FilterSelect label="플랫폼" value={platform} onChange={reset(setPlatform)} options={['google', 'apple', 'kakao']} className="w-full sm:w-40" />
            <FilterSelect label="권한" value={role} onChange={reset(setRole)} options={['ADMIN', 'NORMAL']} className="w-full sm:w-32" />
            <FilterSelect label="상태" value={status} onChange={reset(setStatus)} options={[{ value: 'ACTIVE', label: '정상' }, { value: 'DELETED', label: '탈퇴' }]} className="w-full sm:w-32" />
            <SearchInput value={query} onChange={reset(setQuery)} placeholder="이메일 / 이름 / 소셜 ID" className="w-full sm:w-64" />
          </div>
        }
      />
      <Card>
        <DataTable columns={columns} rows={data?.items ?? []} rowKey={(a) => a.accountId} loading={isLoading} sort={sort} onSortChange={reset(setSort)} onRowClick={(a) => navigate(`/accounts/${a.accountId}`)} />
        {data && <Pagination page={data.page} size={data.size} total={data.total} onPageChange={setPage} />}
      </Card>
    </>
  );
}
