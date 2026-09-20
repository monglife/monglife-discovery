import { useEffect, useState } from 'react';
import type { Mong, MongStatusPatch } from '../../types';
import { Button, Field, Input } from '@/shared/ui';
import { formatNumber } from '@/shared/lib/format';

/**
 * 페이 포인트·뽑기 티켓. 지수와 같은 API 를 쓰지만 카드를 나눴다.
 *
 * <p>막대를 쓰지 않는다 - 0~maxStatus 로 잘리는 지수와 달리 상한이 없어서 "얼마나 찼나"가
 * 없는 값이다. 막대로 만들면 눈금의 의미가 없고 큰 수를 맞추기만 어려워진다.
 */
type Key = 'payPoint' | 'randomDrawTicketCount';

const LABELS: Record<Key, string> = {
  payPoint: '페이 포인트',
  randomDrawTicketCount: '뽑기 티켓',
};

const initial = (m: Mong): Record<Key, string> => ({
  payPoint: String(m.payPoint),
  randomDrawTicketCount: String(m.randomDrawTicketCount),
});

interface Props {
  mong: Mong;
  loading?: boolean;
  onSubmit: (body: MongStatusPatch) => void;
}

export function MongAssetForm({ mong, loading, onSubmit }: Props) {
  const [values, setValues] = useState<Record<Key, string>>(() => initial(mong));

  useEffect(() => setValues(initial(mong)), [mong]);

  const base = initial(mong);
  const changed = (Object.keys(base) as Key[]).filter((k) => base[k] !== values[k]);

  const submit = () => {
    const body: MongStatusPatch = {};
    for (const key of changed) {
      const n = Number(values[key]);
      if (Number.isFinite(n)) (body as Record<string, unknown>)[key] = n;
    }
    onSubmit(body);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(LABELS) as Key[]).map((key) => (
            <Field key={key} label={LABELS[key]} hint={`현재 ${formatNumber(Number(base[key]))}`}>
              <Input
                type="number"
                min={0}
                value={values[key]}
                onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </Field>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {changed.length > 0 ? `${changed.map((k) => LABELS[k]).join(', ')} 변경됨` : '변경된 항목 없음'}
        </span>
        <Button loading={loading} disabled={changed.length === 0} onClick={submit}>적용</Button>
      </div>
    </div>
  );
}
