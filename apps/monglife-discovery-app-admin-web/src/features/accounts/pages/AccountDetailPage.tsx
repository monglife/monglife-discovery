import { useState } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, RefreshCw } from 'lucide-react';
import { accountKeys, useAccount, useAccountDevices, useAccountLoginHistories, usePatchAccount } from '../queries';
import type { LoginHistory } from '../types';
import { PlatformBadge } from '../components/PlatformBadge';
import type { Device } from '@/features/devices/types';
import { useConnectDevice, useDisconnectDevice } from '@/features/devices/queries';
import { DeviceDetailDialog } from '@/features/devices/components/DeviceDetailDialog';
import { DevicePickerDialog } from '@/features/devices/components/DevicePickerDialog';
import { sessionKeys, useRevokeAccountTokens, useRevokeToken, useTokens } from '@/features/sessions/queries';
import type { Token } from '@/features/sessions/types';
import { TokenDetailDialog } from '@/features/sessions/components/TokenDetailDialog';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, PageHeader, Select, Switch } from '@/shared/ui';
import { formatDate, formatDateTime, formatDuration, maskToken } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

type Tab = 'devices' | 'logins' | 'tokens';

export function AccountDetailPage() {
  const id = Number(useParams().accountId);
  const [tab, setTab] = useState<Tab>('devices');
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const account = useAccount(id);
  const patch = usePatchAccount(id);
  const revokeAll = useRevokeAccountTokens();
  const qc = useQueryClient();
  // 계정 정보 + 기기/로그인 이력(detail 하위) + 토큰 목록을 한 번에 다시 불러온다
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: accountKeys.detail(id) });
    void qc.invalidateQueries({ queryKey: sessionKeys.all });
  };
  const refreshing = useIsFetching({ queryKey: accountKeys.detail(id) }) + useIsFetching({ queryKey: sessionKeys.all }) > 0;

  if (account.isLoading) return <div className="h-40 animate-pulse rounded bg-surface-muted" />;
  if (!account.data) return <p className="text-sm text-muted-foreground">계정을 찾을 수 없습니다.</p>;
  const a = account.data;

  return (
    <>
      <Link to="/accounts" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> 계정 목록
      </Link>
      <PageHeader
        title={a.name}
        description={a.email}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={refresh} disabled={refreshing} aria-label="새로고침" title="새로고침">
              <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
              <span className="hidden sm:inline">새로고침</span>
            </Button>
            <Button variant="danger" size="sm" className="flex-1 sm:flex-none" onClick={() => setConfirmRevoke(true)}>
              모든 세션 강제 로그아웃
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>계정 정보</CardTitle></CardHeader>
          <CardBody>
            <dl className="space-y-3 text-sm">
              <Row label="ID">{a.accountId}</Row>
              <Row label="플랫폼"><PlatformBadge platform={a.platform} /></Row>
              <Row label="소셜 ID">{a.socialAccountId ?? '-'}</Row>
              <Row label="권한">
                <Select className="h-8 w-36" value={a.role} disabled={patch.isPending} onChange={(e) => patch.mutate({ role: e.target.value as 'ADMIN' | 'NORMAL' })}>
                  <option value="NORMAL">NORMAL</option>
                  <option value="ADMIN">ADMIN</option>
                </Select>
              </Row>
              <Row label="탈퇴 처리">
                <Switch
                  checked={a.isDeleted}
                  disabled={patch.isPending}
                  onCheckedChange={(v) => (v ? setConfirmDelete(true) : patch.mutate({ isDeleted: false }))}
                  label="탈퇴"
                />
              </Row>
              <Row label="가입일">{formatDateTime(a.createdAt)}</Row>
              <Row label="수정일">{formatDateTime(a.updatedAt)}</Row>
            </dl>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-wrap py-0">
            <div className="flex flex-wrap gap-1">
              {(['devices', 'logins', 'tokens'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn('whitespace-nowrap border-b-2 px-3 py-3 text-sm', tab === t ? 'border-primary font-medium text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}
                >
                  {{ devices: '기기', logins: '로그인 이력', tokens: '토큰' }[t]}
                </button>
              ))}
            </div>
            {tab === 'devices' && <div className="py-2 sm:py-0"><DeviceConnectButton accountId={id} /></div>}
          </CardHeader>
          {tab === 'devices' && <DevicesTab accountId={id} />}
          {tab === 'logins' && <LoginsTab accountId={id} />}
          {tab === 'tokens' && <TokensTab accountId={id} />}
        </Card>
      </div>

      <ConfirmDialog
        open={confirmRevoke}
        danger
        title="모든 세션을 종료할까요?"
        description="이 계정의 모든 액세스/리프레시 토큰을 삭제합니다. 사용자는 다시 로그인해야 합니다."
        confirmLabel="강제 로그아웃"
        loading={revokeAll.isPending}
        onClose={() => setConfirmRevoke(false)}
        onConfirm={() => revokeAll.mutate(id, { onSuccess: () => setConfirmRevoke(false) })}
      />
      <ConfirmDialog
        open={confirmDelete}
        danger
        title="탈퇴 처리할까요?"
        description={`${a.email} 계정을 탈퇴 상태로 바꿉니다. 조회 API 에서 제외되며 기기 연결이 끊깁니다.`}
        confirmLabel="탈퇴 처리"
        loading={patch.isPending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => patch.mutate({ isDeleted: true }, { onSuccess: () => setConfirmDelete(false) })}
      />
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-all text-right">{children}</dd>
    </div>
  );
}

function DeviceConnectButton({ accountId }: { accountId: number }) {
  const [open, setOpen] = useState(false);
  const connect = useConnectDevice();
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> 기기 연결
      </Button>
      <DevicePickerDialog open={open} onClose={() => setOpen(false)} onPick={(d) => connect.mutateAsync({ deviceId: d.deviceId, accountId })} />
    </>
  );
}

function DevicesTab({ accountId }: { accountId: number }) {
  const { data, isLoading } = useAccountDevices(accountId);
  const disconnect = useDisconnectDevice();
  const [detail, setDetail] = useState<Device | null>(null);
  const [toDisconnect, setToDisconnect] = useState<Device | null>(null);

  const columns: Column<Device>[] = [
    {
      key: 'id',
      header: '기기 ID',
      cell: (d) => (
        <button className="font-mono text-xs text-primary hover:underline" onClick={() => setDetail(d)}>
          {d.deviceId}
        </button>
      ),
    },
    { key: 'name', header: '기기명', cell: (d) => d.deviceName },
    { key: 'fcm', header: 'FCM', cell: (d) => (d.fcmToken ? <Badge tone="success">등록</Badge> : <Badge>없음</Badge>) },
    { key: 'created', header: '등록일', cell: (d) => formatDateTime(d.createdAt), className: 'text-muted-foreground' },
    { key: 'act', header: '', cell: (d) => <Button variant="ghost" size="sm" onClick={() => setToDisconnect(d)}>연결 해제</Button>, className: 'text-right' },
  ];
  return (
    <>
      <DataTable columns={columns} rows={data ?? []} rowKey={(d) => d.deviceId} loading={isLoading} emptyMessage="연결된 기기가 없습니다." />
      <DeviceDetailDialog device={detail} onClose={() => setDetail(null)} onDisconnect={(id) => disconnect.mutateAsync(id)} />
      <ConfirmDialog
        open={!!toDisconnect}
        title="계정 연결을 해제할까요?"
        description={toDisconnect ? `${toDisconnect.deviceName} (${toDisconnect.deviceId})` : undefined}
        confirmLabel="해제"
        loading={disconnect.isPending}
        onClose={() => setToDisconnect(null)}
        onConfirm={() => toDisconnect && disconnect.mutate(toDisconnect.deviceId, { onSuccess: () => setToDisconnect(null) })}
      />
    </>
  );
}

function LoginsTab({ accountId }: { accountId: number }) {
  const { data, isLoading } = useAccountLoginHistories(accountId);
  const columns: Column<LoginHistory>[] = [
    { key: 'date', header: '일자', cell: (h) => formatDate(h.loginAt) },
    { key: 'device', header: '기기', cell: (h) => h.deviceName },
    { key: 'app', header: '앱', cell: (h) => <span className="text-muted-foreground">{h.appPackageName}</span> },
    { key: 'ver', header: '버전', cell: (h) => h.buildVersion },
    { key: 'count', header: '횟수', cell: (h) => h.loginCount, className: 'text-right tabular-nums' },
  ];
  return <DataTable columns={columns} rows={data ?? []} rowKey={(h) => h.accountLogId} loading={isLoading} emptyMessage="로그인 이력이 없습니다." />;
}

function TokensTab({ accountId }: { accountId: number }) {
  const { data, isLoading } = useTokens({ accountId, size: 50 });
  const revoke = useRevokeToken();
  const [detail, setDetail] = useState<Token | null>(null);
  const columns: Column<Token>[] = [
    { key: 'device', header: '기기 ID', cell: (t) => <span className="font-mono text-xs">{t.deviceId}</span> },
    { key: 'access', header: 'Access', cell: (t) => <span className="font-mono text-xs">{maskToken(t.accessToken)}</span> },
    { key: 'ver', header: '버전', cell: (t) => t.buildVersion },
    { key: 'created', header: '발급', cell: (t) => formatDateTime(t.createdAt) },
    { key: 'ttl', header: '남은 시간', cell: (t) => formatDuration(t.expiration) },
  ];
  return (
    <>
      <DataTable columns={columns} rows={data?.items ?? []} rowKey={(t) => t.refreshToken} loading={isLoading} onRowClick={setDetail} emptyMessage="유효한 토큰이 없습니다." />
      <TokenDetailDialog token={detail} onClose={() => setDetail(null)} onRevoke={(rt) => revoke.mutateAsync(rt)} />
    </>
  );
}
