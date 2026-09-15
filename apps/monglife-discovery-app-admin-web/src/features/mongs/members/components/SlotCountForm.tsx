import { useEffect, useState } from 'react';
import { Button, Field, Select } from '@/shared/ui';

/** 백엔드 Player.MAX_SLOT_COUNT 와 같다 */
const MAX_SLOT_COUNT = 3;

interface Props {
  current: number;
  loading?: boolean;
  onSubmit: (slotCount: number) => void;
}

export function SlotCountForm({ current, loading, onSubmit }: Props) {
  const [value, setValue] = useState(current);
  useEffect(() => setValue(current), [current]);

  return (
    <div className="space-y-3">
      <Field label="슬롯 수" hint="스타 포인트 차감 없이 값만 바꾼다.">
        <Select value={String(value)} onChange={(e) => setValue(Number(e.target.value))}>
          {Array.from({ length: MAX_SLOT_COUNT }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}개</option>
          ))}
        </Select>
      </Field>
      <div className="flex justify-end">
        <Button loading={loading} disabled={value === current} onClick={() => onSubmit(value)}>적용</Button>
      </div>
    </div>
  );
}
