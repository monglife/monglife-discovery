import { useState } from 'react';
import type { MongStateCode } from '../../types';
import { Button, Field, Input, Select } from '@/shared/ui';

const STATE_CODES: MongStateCode[] = ['NORMAL', 'EVOLUTION_READY', 'GRADUATE_READY', 'GRADUATE', 'DEAD'];

interface Props {
  current: MongStateCode;
  onSubmit: (values: { stateCode: MongStateCode; reason?: string }) => void;
}

export function MongStateForm({ current, onSubmit }: Props) {
  const [stateCode, setStateCode] = useState<MongStateCode>(current);
  const [reason, setReason] = useState('');

  return (
    <div className="space-y-3">
      <Field label="상태 코드" hint="도메인 규칙을 우회하는 운영 조치다. DEAD 복구도 여기서 한다.">
        <Select value={stateCode} onChange={(e) => setStateCode(e.target.value as MongStateCode)}>
          {STATE_CODES.map((code) => (
            <option key={code} value={code}>{code}{code === current ? ' (현재)' : ''}</option>
          ))}
        </Select>
      </Field>
      <Field label="사유" hint="로그에 남는다.">
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 스케줄 오작동으로 잘못 사망 처리" />
      </Field>
      <div className="flex justify-end">
        <Button variant="danger" disabled={stateCode === current} onClick={() => onSubmit({ stateCode, reason: reason || undefined })}>
          변경
        </Button>
      </div>
    </div>
  );
}
