import { useState } from 'react';
import type { Maintenance } from '../types';
import { PHASE_LABEL, PHASE_TONE, maintenancePhase } from '../phase';
import { targetAppLabel } from '../target';
import { Badge, Button, Dialog, Switch } from '@/shared/ui';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { formatDateTime } from '@/shared/lib/format';
import { errorMessage } from '@/shared/lib/error';

interface MaintenanceDetailDialogProps {
  maintenance: Maintenance | null;
  onClose: () => void;
  onEdit: (maintenance: Maintenance) => void;
  onToggle: (maintenanceId: number, enabled: boolean) => Promise<unknown>;
  onDelete: (maintenanceId: number) => Promise<unknown>;
}

export function MaintenanceDetailDialog({ maintenance, onClose, onEdit, onToggle, onDelete }: MaintenanceDetailDialogProps) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const phase = maintenance ? maintenancePhase(maintenance) : 'past';

  return (
    <>
      <Dialog
        open={!!maintenance}
        onClose={onClose}
        title="점검 일정"
        description={maintenance?.message}
        footer={
          <>
            <Button variant="secondary" onClick={() => maintenance && onEdit(maintenance)}>수정</Button>
            <Button variant="danger" onClick={() => { setError(undefined); setConfirm(true); }}>삭제</Button>
          </>
        }
      >
        {maintenance && (
          <dl className="space-y-3 text-sm">
            <Row label="ID">{maintenance.maintenanceId}</Row>
            <Row label="상태"><Badge tone={PHASE_TONE[phase]}>{PHASE_LABEL[phase]}</Badge></Row>
            <Row label="대상 앱">{targetAppLabel(maintenance)}</Row>
            <Row label="시작">{formatDateTime(maintenance.startAt)}</Row>
            <Row label="종료">{maintenance.endAt ? formatDateTime(maintenance.endAt) : '미정'}</Row>
            <Row label="사용">
              <Switch
                checked={maintenance.enabled}
                disabled={busy}
                label="사용"
                onCheckedChange={async (v) => {
                  setBusy(true);
                  try {
                    await onToggle(maintenance.maintenanceId, v);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </Row>
            <Row label="등록일">{formatDateTime(maintenance.createdAt)}</Row>
            <Row label="수정일">{formatDateTime(maintenance.updatedAt)}</Row>
          </dl>
        )}
      </Dialog>
      <ConfirmDialog
        open={confirm}
        danger
        title="점검 일정을 삭제할까요?"
        description={maintenance ? `${formatDateTime(maintenance.startAt)} 시작 — 잡아 둔 예약이 사라집니다.` : undefined}
        confirmLabel="삭제"
        loading={busy}
        error={error}
        onClose={() => setConfirm(false)}
        onConfirm={async () => {
          if (!maintenance) return;
          setBusy(true);
          setError(undefined);
          try {
            await onDelete(maintenance.maintenanceId);
            setConfirm(false);
            onClose();
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}
