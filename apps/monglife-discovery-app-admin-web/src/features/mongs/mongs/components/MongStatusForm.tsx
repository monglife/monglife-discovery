import { useEffect, useState } from 'react';
import type { Mong, MongStatusPatch } from '../../types';
import { Button, Field, Input } from '@/shared/ui';

/** 0 ~ maxStatus 로 잘리는 지수들. 서버도 같은 범위로 자른다 */
const STATUS_KEYS = ['strength', 'satiety', 'healthy', 'fatigue', 'exp'] as const;
const PLAIN_KEYS = ['weight', 'payPoint', 'poopCount', 'randomDrawTicketCount'] as const;

const LABELS: Record<string, string> = {
  strength: '체력',
  satiety: '포만감',
  healthy: '건강',
  fatigue: '피로',
  exp: '경험치',
  weight: '몸무게',
  payPoint: '페이 포인트',
  poopCount: '배변 수',
  randomDrawTicketCount: '뽑기 티켓',
};

type Values = Record<string, string>;

interface Props {
  mong: Mong;
  loading?: boolean;
  onSubmit: (body: MongStatusPatch) => void;
}

const initial = (m: Mong): Values => ({
  strength: String(Math.round(m.strength)),
  satiety: String(Math.round(m.satiety)),
  healthy: String(Math.round(m.healthy)),
  fatigue: String(Math.round(m.fatigue)),
  exp: String(Math.round(m.exp)),
  weight: String(Math.round(m.weight)),
  payPoint: String(m.payPoint),
  poopCount: String(m.poopCount),
  randomDrawTicketCount: String(m.randomDrawTicketCount),
});

export function MongStatusForm({ mong, loading, onSubmit }: Props) {
  const [values, setValues] = useState<Values>(() => initial(mong));
  const [reason, setReason] = useState('');
  useEffect(() => setValues(initial(mong)), [mong]);

  const set = (key: string, v: string) => setValues((prev) => ({ ...prev, [key]: v }));
  const base = initial(mong);
  const changed = Object.keys(base).filter((k) => base[k] !== values[k]);

  const submit = () => {
    // 바뀐 항목만 보낸다. 서버는 null 인 항목을 건드리지 않는다.
    const body: MongStatusPatch = { reason: reason || undefined };
    for (const key of changed) {
      const n = Number(values[key]);
      if (Number.isFinite(n)) (body as Record<string, unknown>)[key] = n;
    }
    onSubmit(body);
    setReason('');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {STATUS_KEYS.map((key) => (
            <Field key={key} label={LABELS[key]} hint={`0 ~ ${Math.round(mong.maxStatus)}`}>
              <Input type="number" value={values[key]} onChange={(e) => set(key, e.target.value)} />
            </Field>
          ))}
          {PLAIN_KEYS.map((key) => (
            <Field key={key} label={LABELS[key]}>
              <Input type="number" value={values[key]} onChange={(e) => set(key, e.target.value)} />
            </Field>
          ))}
        </div>
        <Field label="사유" hint="로그에 남는다.">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 버그로 소실된 포인트 복구" />
        </Field>
      </div>
      {/* 입력 칸 수와 무관하게 카드 맨 아래에 붙는다 */}
      <div className="mt-4 flex items-center justify-between border-t pt-4">
        <span className="text-xs text-muted-foreground">
          {changed.length > 0 ? `${changed.map((k) => LABELS[k]).join(', ')} 변경됨` : '변경된 항목 없음'}
        </span>
        <Button loading={loading} disabled={changed.length === 0} onClick={submit}>적용</Button>
      </div>
    </div>
  );
}
