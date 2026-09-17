import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNoticeMutations, useNotices } from '../../queries';
import type { Notice } from '../../types';
import { NoticeFormDialog } from '../components/NoticeFormDialog';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { SearchInput } from '@/shared/components/SearchInput';
import { Badge, Button, Card, PageHeader, Pagination, Switch } from '@/shared/ui';
import { formatDateTime } from '@/shared/lib/format';
import { toSortParam, type SortState } from '@/shared/api/types';

const SIZE = 10;

export function NoticeListPage() {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState | null>(null);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<Notice | null>(null);

  const params = useMemo(
    () => ({ page, size: SIZE, query: query || undefined, sort: toSortParam(sort) }),
    [page, query, sort],
  );
  const { data, isLoading } = useNotices(params);
  const { create, update, hide, remove } = useNoticeMutations();

  const columns: Column<Notice>[] = [
    { key: 'id', header: 'ID', cell: (n) => n.noticeId, className: 'w-16 text-muted-foreground' },
    {
      key: 'title',
      header: '제목',
      cell: (n) => (
        <span className="flex items-center gap-2">
          <span className="font-medium">{n.title}</span>
          {n.isHided && <Badge>숨김</Badge>}
        </span>
      ),
    },
    { key: 'writer', header: '작성자', cell: (n) => n.writerName ?? '-' },
    { key: 'created', header: '등록일', sortKey: 'createdAt', cell: (n) => formatDateTime(n.createdAt), className: 'text-muted-foreground' },
    {
      key: 'hide',
      header: '',
      className: 'text-right',
      cell: (n) => (
        <span className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={!n.isHided}
            disabled={hide.isPending}
            label="노출"
            onCheckedChange={(visible) => hide.mutate({ noticeId: n.noticeId, isHided: !visible })}
          />
          <Button size="sm" variant="ghost" className="text-danger hover:bg-danger-soft" onClick={() => setRemoving(n)}>
            삭제
          </Button>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="공지 사항"
        description="앱 공지 목록. 숨김은 앱에서 보이지 않게만 하고 데이터는 남는다."
        actions={
          <Button size="sm" className="ml-auto" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> 공지 등록
          </Button>
        }
      />

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(0); }} placeholder="제목·내용 검색" className="w-full sm:w-64" />
      </div>

      <Card>
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(n) => n.noticeId}
          loading={isLoading}
          emptyMessage="공지 사항이 없습니다."
          onRowClick={setEditing}
          sort={sort}
          onSortChange={(s) => { setSort(s); setPage(0); }}
        />
        {data && <Pagination page={data.page} size={data.size} total={data.total} onPageChange={setPage} />}
      </Card>

      <NoticeFormDialog
        open={creating}
        onClose={() => setCreating(false)}
        loading={create.isPending}
        onSubmit={(values) => create.mutate(values, { onSuccess: () => setCreating(false) })}
      />
      <NoticeFormDialog
        open={editing !== null}
        notice={editing ?? undefined}
        onClose={() => setEditing(null)}
        loading={update.isPending}
        onSubmit={(values) =>
          editing && update.mutate({ noticeId: editing.noticeId, ...values }, { onSuccess: () => setEditing(null) })
        }
      />
      <ConfirmDialog
        open={removing !== null}
        title="공지 사항을 삭제합니다"
        description={`"${removing?.title ?? ''}" — 되돌릴 수 없습니다. 앱에서 감추기만 하려면 노출 토글을 쓰세요.`}
        confirmLabel="삭제"
        danger
        loading={remove.isPending}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing.noticeId, { onSuccess: () => setRemoving(null) })}
      />
    </>
  );
}
