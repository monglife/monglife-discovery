import type { ReactNode } from 'react';
import type { Task } from '../../types';
import { SCHEDULER_LABEL, TASK_STATE_LABEL, TASK_STATE_TONE, TASK_TYPE_LABEL } from '../taskLabels';
import { Badge, Button, Dialog } from '@/shared/ui';
import { formatDateTimeSec, formatDuration, formatNumber } from '@/shared/lib/format';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right text-sm">{children}</span>
    </div>
  );
}

interface Props {
  task: Task | null;
  pausing?: boolean;
  resuming?: boolean;
  onClose: () => void;
  onPause: () => void;
  onResume: () => void;
  onDelete: () => void;
}

/**
 * 스케줄 상세.
 *
 * <p>가장 중요한 줄은 <b>메모리 등재</b>다. DB 행이 PROCESSING 인데 메모리에 없으면
 * 아무도 그 스케줄을 깨우지 않는다 - 재기동 전까지 잠자는 상태라 목록 숫자만 보면 모른다.
 */
export function TaskDetailDialog({ task, pausing, resuming, onClose, onPause, onResume, onDelete }: Props) {
  if (!task) return null;

  const paused = task.stateCode === 'PAUSE' || task.stateCode === 'APP_STOP_PAUSE';
  // DB 는 도는 중이라는데 메모리에 타이머가 없는 상태. 조용히 멈춘 스케줄이다.
  const orphaned = task.stateCode === 'PROCESSING' && !task.isScheduled;

  return (
    <Dialog
      open
      onClose={onClose}
      title={`${SCHEDULER_LABEL[task.schedulerTypeCode] ?? task.schedulerTypeCode} 스케줄`}
      description={`#${task.taskId} · 몽 ${task.mongId}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>닫기</Button>
          <Button variant="danger" onClick={onDelete}>삭제</Button>
          {paused
            ? <Button loading={resuming} onClick={onResume}>재시작</Button>
            : <Button variant="secondary" loading={pausing} onClick={onPause}>일시중지</Button>}
        </>
      }
    >
      <div className="space-y-0">
        <Row label="타입">{SCHEDULER_LABEL[task.schedulerTypeCode] ?? <span className="font-mono text-xs">{task.schedulerTypeCode}</span>}</Row>
        <Row label="주기 방식">{TASK_TYPE_LABEL[task.typeCode] ?? task.typeCode}</Row>
        <Row label="상태">
          <Badge tone={TASK_STATE_TONE[task.stateCode] ?? 'neutral'}>{TASK_STATE_LABEL[task.stateCode] ?? task.stateCode}</Badge>
        </Row>
        <Row label="메모리 등재">
          {task.isScheduled
            ? <Badge tone="success">올라가 있음</Badge>
            : <Badge tone={orphaned ? 'danger' : 'neutral'}>{orphaned ? '없음 (잠자는 중)' : '없음'}</Badge>}
        </Row>
        <Row label="다음 실행">
          {task.expiredAt ? formatDateTimeSec(task.expiredAt) : <span className="text-muted-foreground">-</span>}
        </Row>
        <Row label="고정 시각">
          {task.fixTime ?? <span className="text-muted-foreground">-</span>}
        </Row>
        <Row label="주기">
          {task.expirationSeconds ? formatDuration(task.expirationSeconds) : <span className="text-muted-foreground">-</span>}
        </Row>
        <Row label="남은 시간">
          {task.restExpirationSeconds != null
            ? `${formatDuration(task.restExpirationSeconds)} (${formatNumber(task.restExpirationSeconds)}초)`
            : <span className="text-muted-foreground">-</span>}
        </Row>
        <Row label="계정">{task.accountId}</Row>
        <Row label="등록">{formatDateTimeSec(task.createdAt)}</Row>
        <Row label="수정">{formatDateTimeSec(task.updatedAt)}</Row>
      </div>

      {orphaned && (
        <p className="mt-3 rounded-md bg-danger-soft p-3 text-xs text-danger">
          DB 는 도는 중이라고 하는데 메모리에 타이머가 없습니다. 이 스케줄은 앱을 다시 띄우기 전까지
          깨어나지 않습니다. 지우고 다시 등록하면 복구됩니다.
        </p>
      )}
    </Dialog>
  );
}
