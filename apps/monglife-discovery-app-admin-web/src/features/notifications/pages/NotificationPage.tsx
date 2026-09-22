import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, X } from 'lucide-react';
import { useNotifiableDevices, useSendNotification } from '../queries';
import type { NotifiableDevice, SendResult } from '../types';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { SearchInput } from '@/shared/components/SearchInput';
import { FilterSelect } from '@/shared/components/FilterSelect';
import { useFilterOptions } from '@/features/meta/queries';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Dialog, Field, Input, PageHeader, Pagination, Textarea } from '@/shared/ui';

const SIZE = 15;

/** 전송 대상 표기: 이메일 (이름) */
const accountLabel = (t: { accountId: number; email?: string; name?: string }) =>
  `${t.email ?? `#${t.accountId}`}${t.name ? ` (${t.name})` : ''}`;

const schema = z.object({
  title: z.string().min(1, '제목을 입력하세요.').max(100),
  body: z.string().min(1, '내용을 입력하세요.').max(500),
});
type FormValues = z.infer<typeof schema>;

export function NotificationPage() {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [selected, setSelected] = useState<Map<string, NotifiableDevice>>(new Map());
  const [confirm, setConfirm] = useState<FormValues | null>(null);
  const [results, setResults] = useState<SendResult[] | null>(null);
  const { data, isLoading } = useNotifiableDevices({ page, size: SIZE, query, deviceName: deviceName || undefined });
  const options = useFilterOptions();
  const send = useSendNotification();

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { title: '', body: '' } });

  /** 선택된 기기를 계정별로 묶는다 — 실제 전송 단위 */
  const targets = useMemo(() => {
    const byAccount = new Map<number, { accountId: number; email?: string; name?: string; devices: NotifiableDevice[] }>();
    for (const d of selected.values()) {
      const t = byAccount.get(d.accountId) ?? { accountId: d.accountId, email: d.accountEmail ?? undefined, name: d.accountName ?? undefined, devices: [] };
      t.devices.push(d);
      byAccount.set(d.accountId, t);
    }
    return Array.from(byAccount.values());
  }, [selected]);

  const toggle = (d: NotifiableDevice) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(d.deviceId)) next.delete(d.deviceId);
      else next.set(d.deviceId, d);
      return next;
    });
  const pageItems = data?.items ?? [];
  const allOnPage = pageItems.length > 0 && pageItems.every((d) => selected.has(d.deviceId));
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (allOnPage) pageItems.forEach((d) => next.delete(d.deviceId));
      else pageItems.forEach((d) => next.set(d.deviceId, d));
      return next;
    });
  const removeAccount = (accountId: number) =>
    setSelected((prev) => {
      const next = new Map(prev);
      for (const [k, v] of next) if (v.accountId === accountId) next.delete(k);
      return next;
    });

  const columns: Column<NotifiableDevice>[] = [
    {
      key: 'sel',
      header: <input type="checkbox" className="accent-primary" checked={allOnPage} onChange={toggleAll} aria-label="전체 선택" />,
      className: 'w-8',
      mobileAlign: 'start',
      cell: (d) => <input type="checkbox" className="accent-primary" checked={selected.has(d.deviceId)} onChange={() => toggle(d)} onClick={(e) => e.stopPropagation()} />,
    },
    { key: 'email', header: '이메일', cell: (d) => d.accountEmail ?? `#${d.accountId}` },
    { key: 'name', header: '이름', cell: (d) => d.accountName ?? '-' },
    { key: 'device', header: '기기', cell: (d) => <span title={d.deviceId}>{d.deviceName}</span> },
  ];

  const onSubmit = form.handleSubmit((values) => {
    setResults(null);
    setConfirm(values);
  });

  const doSend = () => {
    if (!confirm) return;
    send.mutate(
      { accountIds: targets.map((t) => t.accountId), title: confirm.title, body: confirm.body },
      {
        onSuccess: (res) => {
          setResults(res);
          setConfirm(null);
          if (res.every((r) => r.ok)) {
            form.reset({ title: '', body: '' });
            setSelected(new Map());
          }
        },
      },
    );
  };

  return (
    <>
      <PageHeader title="푸시 알림 전송" description="FCM 토큰이 등록된 기기를 골라 계정 단위로 알림을 보냅니다 (Kafka → FCM)" />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="flex flex-col lg:col-span-3">
          <CardHeader className="flex-col items-stretch sm:flex-row sm:items-center">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>알림 가능 기기 {selected.size > 0 && <Badge tone="primary" className="ml-1">{selected.size} 선택</Badge>}</CardTitle>
              {/* 모바일 카드 목록엔 표 헤더가 없어서 전체 선택을 여기 둔다 */}
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground sm:hidden">
                <input type="checkbox" className="accent-primary" checked={allOnPage} onChange={toggleAll} /> 전체 선택
              </label>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <FilterSelect label="기기" value={deviceName} onChange={(v) => { setDeviceName(v); setPage(0); }} options={options.data?.deviceNames ?? []} className="w-full sm:w-40" />
              <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(0); }} placeholder="이메일 / 이름" className="w-full sm:w-64" />
            </div>
          </CardHeader>
          <DataTable columns={columns} rows={pageItems} rowKey={(d) => d.deviceId} loading={isLoading} onRowClick={toggle} emptyMessage="FCM 토큰이 등록된 기기가 없습니다." />
          {data && <Pagination page={data.page} size={data.size} total={data.total} onPageChange={setPage} />}
        </Card>

        <Card className="flex flex-col lg:col-span-2">
          <CardHeader><CardTitle>전송</CardTitle></CardHeader>
          <CardBody className="flex flex-1 flex-col">
            <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">대상 계정 {targets.length > 0 && `(${targets.length})`}</span>
                {targets.length === 0 ? (
                  <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">목록에서 기기를 선택하세요</p>
                ) : (
                  <ul className="max-h-48 divide-y overflow-y-auto rounded-md border">
                    {targets.map((t) => (
                      <li key={t.accountId} className="flex items-center gap-2 px-3 py-2 text-sm">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{accountLabel(t)}</span>
                          <span className="block truncate text-xs text-muted-foreground">{t.devices.map((d) => d.deviceName).join(', ')}</span>
                        </span>
                        <button type="button" onClick={() => removeAccount(t.accountId)} className="rounded p-1 text-muted-foreground hover:bg-surface-muted" aria-label="제거">
                          <X className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Field label="제목" error={form.formState.errors.title?.message}>
                <Input {...form.register('title')} />
              </Field>
              <Field label="내용" error={form.formState.errors.body?.message} className="flex flex-1 flex-col">
                <Textarea className="flex-1" {...form.register('body')} />
              </Field>
              {results && (
                <p className={results.every((r) => r.ok) ? 'text-xs text-success' : 'text-xs text-danger'}>
                  {results.filter((r) => r.ok).length}/{results.length} 계정 전송 완료
                  {results.some((r) => !r.ok) && ` — 실패: ${results.filter((r) => !r.ok).map((r) => `#${r.accountId}`).join(', ')}`}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={targets.length === 0}>
                <Send className="size-4" /> 전송
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>

      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="알림을 전송할까요?"
        description={`${targets.length}개 계정에 전송됩니다`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)} disabled={send.isPending}>취소</Button>
            <Button onClick={doSend} loading={send.isPending}><Send className="size-4" /> 전송</Button>
          </>
        }
      >
        {confirm && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">대상 계정</p>
              <ul className="max-h-40 divide-y overflow-y-auto rounded-md border">
                {targets.map((t) => (
                  <li key={t.accountId} className="flex items-center justify-between gap-3 px-3 py-1.5">
                    <span className="truncate">{accountLabel(t)}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{t.devices.length}대</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border bg-surface-muted p-3">
              <p className="font-semibold">{confirm.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{confirm.body}</p>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
