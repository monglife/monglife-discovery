import { useEffect, useMemo, useState } from 'react';
import { useMaster } from '../../queries';
import type { MasterCreateBody, MasterKind } from '../../api';
import { Button, Dialog, Field, Input, Select } from '@/shared/ui';

/** 종류마다 입력 폼이 다르다. 종류 → 라벨·필드 정의를 한곳에 모아 둔다 */
interface FieldDef {
  key: keyof MasterCreateBody;
  label: string;
  type?: 'number' | 'text';
  hint?: string;
  required?: boolean;
}

const COMMON: FieldDef[] = [
  { key: 'code', label: '코드', hint: '공통 코드로 등록된다. 예: FD040', required: true },
  { key: 'name', label: '이름', required: true },
];

const STAT_FIELDS: FieldDef[] = [
  { key: 'price', label: '가격', type: 'number', required: true },
  { key: 'weight', label: '몸무게', type: 'number', required: true },
  { key: 'strength', label: '체력', type: 'number', required: true },
  { key: 'satiety', label: '포만감', type: 'number', required: true },
  { key: 'healthy', label: '건강', type: 'number', required: true },
  { key: 'fatigue', label: '피로', type: 'number', required: true },
  { key: 'delaySeconds', label: '재구매 대기(초)', type: 'number', required: true },
];

const FORMS: Record<MasterKind, { label: string; fields: FieldDef[] }> = {
  MONG_TYPE: {
    label: '몽 타입',
    fields: [
      ...COMMON,
      { key: 'level', label: '레벨', type: 'number', hint: '0=알, 1~3', required: true },
      { key: 'evolutionScore', label: '진화 점수', type: 'number', required: true },
      { key: 'maxStatus', label: '최대 지수', type: 'number', required: true },
      { key: 'groupType', label: '그룹 타입', hint: '진화 계보. 예: GCH200', required: true },
    ],
  },
  FOOD: { label: '음식', fields: [...COMMON, ...STAT_FIELDS] },
  SNACK: { label: '간식', fields: [...COMMON, ...STAT_FIELDS] },
  TRAINING_TYPE: {
    label: '훈련',
    fields: [
      ...COMMON,
      { key: 'payPoint', label: '보상 포인트', type: 'number', required: true },
      { key: 'score', label: '목표 점수', type: 'number', required: true },
      { key: 'timeout', label: '제한 시간(초)', type: 'number', required: true },
      { key: 'exp', label: '경험치', type: 'number', required: true },
      { key: 'strength', label: '체력', type: 'number', required: true },
      { key: 'weight', label: '몸무게', type: 'number', required: true },
      { key: 'satiety', label: '포만감', type: 'number', required: true },
      { key: 'fatigue', label: '피로', type: 'number', required: true },
    ],
  },
  RANDOM_DRAW: { label: '랜덤 뽑기', fields: [] },
  MAP_TYPE: {
    label: '맵',
    fields: [...COMMON, { key: 'words', label: '검색어', hint: '탐색에 쓰는 키워드. 콤마로 구분' }],
  },
  EXCHANGE_STAR_POINT_PRODUCT: {
    label: '환전 상품',
    fields: [
      { key: 'code', label: '상품 ID', hint: '공통 코드로도 등록된다. 예: PRDT003', required: true },
      { key: 'name', label: '상품명', required: true },
      { key: 'starPoint', label: '지급 스타 포인트', type: 'number', required: true },
    ],
  },
};

const KINDS = Object.keys(FORMS) as MasterKind[];

interface Props {
  open: boolean;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (body: MasterCreateBody) => void;
}

export function MasterCreateDialog({ open, loading, error, onClose, onSubmit }: Props) {
  const [kind, setKind] = useState<MasterKind>('FOOD');
  const [values, setValues] = useState<Record<string, string>>({});
  const [drawCode, setDrawCode] = useState('');
  const [drawType, setDrawType] = useState<'FOOD' | 'SNACK' | 'MAP'>('FOOD');

  // 랜덤 뽑기는 새 코드를 만들지 않고 이미 있는 음식·간식·맵 코드를 풀에 얹는다
  const foods = useMaster('foods');
  const snacks = useMaster('snacks');
  const maps = useMaster('mapTypes');
  const drawOptions = useMemo(() => {
    if (drawType === 'FOOD') return (foods.data ?? []).map((f) => ({ code: f.code, name: f.name }));
    if (drawType === 'SNACK') return (snacks.data ?? []).map((s) => ({ code: s.code, name: s.name }));
    return (maps.data ?? []).map((m) => ({ code: m.mapCode, name: m.mapName }));
  }, [drawType, foods.data, snacks.data, maps.data]);

  useEffect(() => setDrawCode(drawOptions[0]?.code ?? ''), [drawOptions]);
  useEffect(() => { if (open) { setKind('FOOD'); setValues({}); } }, [open]);
  useEffect(() => setValues({}), [kind]);

  const form = FORMS[kind];
  const set = (key: string, v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  const filled =
    kind === 'RANDOM_DRAW'
      ? Boolean(drawCode)
      : form.fields.filter((f) => f.required).every((f) => (values[f.key] ?? '').trim() !== '');

  const submit = () => {
    if (kind === 'RANDOM_DRAW') {
      onSubmit({ kind, code: drawCode, inventoryTypeCode: drawType });
      return;
    }
    const body: Record<string, unknown> = { kind };
    for (const f of form.fields) {
      const raw = (values[f.key] ?? '').trim();
      if (raw === '') continue;
      body[f.key] = f.type === 'number' ? Number(raw) : raw;
    }
    onSubmit(body as unknown as MasterCreateBody);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="마스터 데이터 등록"
      description="코드는 공통 코드(monglife_comn_code)로도 함께 등록됩니다. 그룹은 종류가 정합니다."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>취소</Button>
          <Button loading={loading} disabled={!filled} onClick={submit}>등록</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="종류">
          <Select value={kind} onChange={(e) => setKind(e.target.value as MasterKind)}>
            {KINDS.map((k) => (
              <option key={k} value={k}>{FORMS[k].label}</option>
            ))}
          </Select>
        </Field>

        {kind === 'RANDOM_DRAW' ? (
          <>
            <Field label="아이템 종류">
              <Select value={drawType} onChange={(e) => setDrawType(e.target.value as 'FOOD' | 'SNACK' | 'MAP')}>
                <option value="FOOD">음식</option>
                <option value="SNACK">간식</option>
                <option value="MAP">맵</option>
              </Select>
            </Field>
            <Field
              label="아이템"
              hint="이미 있는 코드를 뽑기 풀에 한 줄 더 얹습니다. 같은 코드를 여러 번 넣으면 그만큼 확률이 올라갑니다."
            >
              <Select value={drawCode} onChange={(e) => setDrawCode(e.target.value)} disabled={drawOptions.length === 0}>
                {drawOptions.length === 0 && <option value="">항목이 없습니다</option>}
                {drawOptions.map((o) => (
                  <option key={o.code} value={o.code}>{o.name} ({o.code})</option>
                ))}
              </Select>
            </Field>
          </>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {form.fields.map((f) => (
              <Field key={f.key} label={f.label} hint={f.hint}>
                <Input
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={values[f.key] ?? ''}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              </Field>
            ))}
          </div>
        )}

        {error && <p className="rounded-md bg-danger-soft p-3 text-xs text-danger">{error}</p>}
      </div>
    </Dialog>
  );
}
