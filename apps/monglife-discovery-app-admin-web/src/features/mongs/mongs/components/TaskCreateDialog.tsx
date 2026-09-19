import { useEffect, useState } from 'react';
import type { MongSchedulerTypeCode, Task } from '../../types';
import { SCHEDULER_LABEL, SCHEDULER_OPTIONS } from '../taskLabels';
import { Button, Dialog, Field, Select } from '@/shared/ui';

interface Props {
  open: boolean;
  /** 이미 걸린 스케줄. 같은 타입은 서버가 막으므로 고르지 못하게 한다 */
  existing: Task[];
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (schedulerTypeCode: MongSchedulerTypeCode) => void;
}

export function TaskCreateDialog({ open, existing, loading, error, onClose, onSubmit }: Props) {
  const taken = new Set(existing.map((t) => t.schedulerTypeCode));
  const available = SCHEDULER_OPTIONS.filter((o) => !taken.has(o.code));
  const [code, setCode] = useState<MongSchedulerTypeCode | ''>('');

  useEffect(() => {
    if (open) setCode(available[0]?.code ?? '');
    // available 은 매 렌더 새 배열이라 open 에만 건다 - 넣으면 고른 값이 계속 초기화된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const hint = SCHEDULER_OPTIONS.find((o) => o.code === code)?.hint;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="스케줄 등록"
      description="수면·기상 시각은 몽에 저장된 값을 씁니다. 여기서 따로 지정하지 않습니다."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>취소</Button>
          <Button loading={loading} disabled={code === ''} onClick={() => code !== '' && onSubmit(code)}>등록</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="스케줄 타입" hint={hint}>
          <Select value={code} onChange={(e) => setCode(e.target.value as MongSchedulerTypeCode)} disabled={available.length === 0}>
            {available.length === 0 && <option value="">등록할 수 있는 타입이 없습니다</option>}
            {available.map((o) => (
              <option key={o.code} value={o.code}>{SCHEDULER_LABEL[o.code]}</option>
            ))}
          </Select>
        </Field>

        {taken.size > 0 && (
          <p className="text-xs text-muted-foreground">
            이미 걸림: {[...taken].map((c) => SCHEDULER_LABEL[c] ?? c).join(', ')} — 같은 타입은 지운 뒤 다시 등록해야 합니다.
          </p>
        )}

        {error && <p className="rounded-md bg-danger-soft p-3 text-xs text-danger">{error}</p>}
      </div>
    </Dialog>
  );
}
