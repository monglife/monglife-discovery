import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  useCreateMaintenance,
  useCurrentMaintenance,
  useMaintenances,
  useRemoveMaintenance,
  useSetMaintenanceEnabled,
  useUpdateMaintenance,
} from '../queries';
import { MaintenanceDetailDialog } from '../components/MaintenanceDetailDialog';
import { MaintenanceFormDialog } from '../components/MaintenanceFormDialog';
import { PHASE_LABEL, PHASE_TONE, maintenancePhase } from '../phase';
import { targetAppLabel } from '../target';
import type { Maintenance, MaintenancePhase, SaveMaintenance } from '../types';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { FilterSelect } from '@/shared/components/FilterSelect';
import { Badge, Button, Card, CardHeader, CardTitle, PageHeader, Switch } from '@/shared/ui';
import { formatDateTime } from '@/shared/lib/format';
import { errorMessage } from '@/shared/lib/error';

const PHASES: MaintenancePhase[] = ['active', 'upcoming', 'past', 'disabled'];

export function MaintenanceListPage() {
  const { data, isLoading } = useMaintenances();
  const { data: currentList } = useCurrentMaintenance();
  const current = currentList ?? [];
  const create = useCreateMaintenance();
  const update = useUpdateMaintenance();
  const setEnabled = useSetMaintenanceEnabled();
  const remove = useRemoveMaintenance();

  const [form, setForm] = useState<{ open: boolean; target: Maintenance | null }>({ open: false, target: null });
  const [detail, setDetail] = useState<Maintenance | null>(null);
  const [phase, setPhase] = useState('');

  // 목록이 페이징 없이 통째로 오므로 필터는 클라이언트에서 한다
  const rows = useMemo(() => {
    const now = Date.now();
    return (data ?? []).filter((m) => !phase || maintenancePhase(m, now) === phase);
  }, [data, phase]);

  // 아직 시작하지 않은 일정 중 가장 가까운 것
  const next = useMemo(() => {
    const now = Date.now();
    return (data ?? [])
      .filter((m) => m.enabled && new Date(m.startAt).getTime() > now)
      .sort((a, b) => a.startAt.localeCompare(b.startAt))[0];
  }, [data]);

  const columns: Column<Maintenance>[] = [
    {
      key: 'phase',
      header: '상태',
      cell: (m) => {
        const p = maintenancePhase(m);
        return <Badge tone={PHASE_TONE[p]}>{PHASE_LABEL[p]}</Badge>;
      },
    },
    { key: 'target', header: '대상 앱', cell: (m) => targetAppLabel(m), className: 'whitespace-nowrap' },
    { key: 'start', header: '시작', cell: (m) => formatDateTime(m.startAt) },
    { key: 'end', header: '종료', cell: (m) => (m.endAt ? formatDateTime(m.endAt) : '미정'), className: 'text-muted-foreground' },
    { key: 'message', header: '안내 문구', cell: (m) => m.message },
    {
      key: 'toggle',
      header: '',
      className: 'text-right',
      cell: (m) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={m.enabled}
            disabled={setEnabled.isPending}
            label="사용"
            onCheckedChange={(enabled) => setEnabled.mutate({ maintenanceId: m.maintenanceId, enabled })}
          />
        </span>
      ),
    },
  ];

  const pending = form.target ? update.isPending : create.isPending;
  const formError = errorMessage(form.target ? update.error : create.error);

  const submit = (body: SaveMaintenance) => {
    const done = { onSuccess: () => setForm({ open: false, target: null }) };
    if (form.target) update.mutate({ maintenanceId: form.target.maintenanceId, body }, done);
    else create.mutate(body, done);
  };

  return (
    <>
      <PageHeader
        title="서버 점검"
        description="점검 중이면 대상 앱이 진입 화면에서 안내를 띄우고 멈춥니다. 대상 앱을 비우면 모든 앱이 막힙니다. 로그인은 막지 않습니다. 행을 누르면 상세"
        actions={
          <Button className="w-full sm:w-auto" onClick={() => setForm({ open: true, target: null })}>
            <Plus className="size-4" /> 일정 등록
          </Button>
        }
      />

      {/* 서버 시계로 판정한 현재 상태. 표의 상태 배지는 브라우저 시계라 이쪽이 기준이다 */}
      <Card className={current.length ? 'border-danger/40 bg-danger-soft' : undefined}>
        <div className="flex flex-col gap-1 p-4">
          <p className={current.length ? 'text-sm font-medium text-danger' : 'text-sm font-medium'}>
            {current.length ? `지금 점검 중입니다 (${current.length}건)` : '정상 운영 중입니다'}
          </p>
          {/* 앱별로 따로 내릴 수 있으므로 어느 앱이 막혔는지를 같이 적는다 */}
          {current.length ? (
            current.map((m) => (
              <p key={m.maintenanceId} className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{targetAppLabel(m)}</span>
                {` · ${m.message} · ${formatDateTime(m.startAt)} ~ ${m.endAt ? formatDateTime(m.endAt) : '종료 미정'}`}
              </p>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">
              {next ? `다음 예정: ${formatDateTime(next.startAt)} · ${targetAppLabel(next)} · ${next.message}` : '예정된 점검이 없습니다.'}
            </p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader className="flex-col items-stretch sm:flex-row sm:items-center">
          <CardTitle>등록된 일정 {rows.length}개</CardTitle>
          <FilterSelect
            label="상태"
            value={phase}
            onChange={setPhase}
            options={PHASES.map((p) => ({ value: p, label: PHASE_LABEL[p] }))}
            className="w-full sm:w-40"
          />
        </CardHeader>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(m) => m.maintenanceId}
          loading={isLoading}
          emptyMessage="등록된 점검 일정이 없습니다."
          onRowClick={setDetail}
        />
      </Card>

      <MaintenanceDetailDialog
        maintenance={detail ? (data?.find((m) => m.maintenanceId === detail.maintenanceId) ?? detail) : null}
        onClose={() => setDetail(null)}
        onEdit={(m) => {
          setDetail(null);
          setForm({ open: true, target: m });
        }}
        onToggle={(maintenanceId, enabled) => setEnabled.mutateAsync({ maintenanceId, enabled })}
        onDelete={(maintenanceId) => remove.mutateAsync(maintenanceId)}
      />

      <MaintenanceFormDialog
        open={form.open}
        maintenance={form.target}
        pending={pending}
        error={formError}
        onSubmit={submit}
        onClose={() => setForm({ open: false, target: null })}
      />
    </>
  );
}
