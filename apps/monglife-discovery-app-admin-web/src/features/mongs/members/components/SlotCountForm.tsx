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
    <div className="flex h-full flex-col">
      <div className="flex-1">
        <Field label="슬롯 수" hint="스타 포인트 차감 없이 값만 바꾼다.">
          <Select value={String(value)} onChange={(e) => setValue(Number(e.target.value))}>
            {Array.from({ length: MAX_SLOT_COUNT }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}개</option>
            ))}
          </Select>
        </Field>
      </div>
      {/* 옆 카드(스타 포인트 가감)와 버튼 높이를 맞춘다 */}
      <div className="mt-4 flex items-center justify-between border-t pt-4">
        <span className="text-xs text-muted-foreground">
          {value === current ? '변경된 항목 없음' : `${current}개 → ${value}개`}
        </span>
        <Button loading={loading} disabled={value === current} onClick={() => onSubmit(value)}>적용</Button>
      </div>
    </div>
  );
}
