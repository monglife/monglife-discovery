import { useEffect, useState } from 'react';
import type { Mong, MongStatusPatch } from '../../types';
import { Button, StatSlider } from '@/shared/ui';

/**
 * 지수 수정. 막대를 끌어 고친다.
 *
 * <p>페이 포인트·뽑기 티켓은 여기 없다 - 지수가 아니라 재화라 별도 카드(MongAssetForm)로 뺐다.
 */
type Key = 'strength' | 'satiety' | 'healthy' | 'fatigue' | 'exp' | 'weight' | 'poopCount';

const LABELS: Record<Key, string> = {
  strength: '체력',
  satiety: '포만감',
  healthy: '건강',
  fatigue: '피로',
  exp: '경험치',
  weight: '몸무게',
  poopCount: '배변 수',
};

/** 배변은 4개에서 캡된다(도메인 MAX_POOP_COUNT). 나머지는 몽 타입의 최대 지수가 상한 */
const MAX_POOP_COUNT = 4;

const initial = (m: Mong): Record<Key, number> => ({
  strength: Math.round(m.strength),
  satiety: Math.round(m.satiety),
  healthy: Math.round(m.healthy),
  fatigue: Math.round(m.fatigue),
  exp: Math.round(m.exp),
  weight: Math.round(m.weight),
  poopCount: m.poopCount,
});

interface Props {
  mong: Mong;
  loading?: boolean;
  onSubmit: (body: MongStatusPatch) => void;
}

export function MongStatusForm({ mong, loading, onSubmit }: Props) {
  const [values, setValues] = useState<Record<Key, number>>(() => initial(mong));

  // 서버 값이 갱신되면(적용 후·MQTT 반영) 막대를 다시 맞춘다
  useEffect(() => setValues(initial(mong)), [mong]);

  const base = initial(mong);
  const changed = (Object.keys(base) as Key[]).filter((k) => base[k] !== values[k]);
  const maxStatus = Math.round(mong.maxStatus);

  const maxOf = (key: Key) => (key === 'poopCount' ? MAX_POOP_COUNT : maxStatus);
  const set = (key: Key, v: number) => setValues((prev) => ({ ...prev, [key]: v }));

  const submit = () => {
    // 바뀐 항목만 보낸다. 서버는 null 인 항목을 건드리지 않는다.
    const body: MongStatusPatch = {};
    for (const key of changed) (body as Record<string, unknown>)[key] = values[key];
    onSubmit(body);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {(Object.keys(LABELS) as Key[]).map((key) => (
            <StatSlider
              key={key}
              label={LABELS[key]}
              value={values[key]}
              original={base[key]}
              max={maxOf(key)}
              unit={key === 'poopCount' ? '개' : undefined}
              onChange={(v) => set(key, v)}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {changed.length > 0 ? `${changed.map((k) => LABELS[k]).join(', ')} 변경됨` : '변경된 항목 없음'}
        </span>
        <span className="flex shrink-0 gap-2">
          {changed.length > 0 && <Button variant="secondary" onClick={() => setValues(base)}>되돌리기</Button>}
          <Button loading={loading} disabled={changed.length === 0} onClick={submit}>적용</Button>
        </span>
      </div>
    </div>
  );
}
