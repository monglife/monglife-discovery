import { useState } from 'react';
import { Button, Field, Input, Select } from '@/shared/ui';

type Type = 'FOOD' | 'SNACK';

interface Props {
  loading?: boolean;
  onSubmit: (body: { inventoryCode: string; inventoryTypeCode: Type }) => void;
}

export function InventoryGrantForm({ loading, onSubmit }: Props) {
  const [inventoryCode, setCode] = useState('');
  const [inventoryTypeCode, setType] = useState<Type>('FOOD');

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="종류">
          <Select value={inventoryTypeCode} onChange={(e) => setType(e.target.value as Type)}>
            <option value="FOOD">음식 (FD)</option>
            <option value="SNACK">간식 (SN)</option>
          </Select>
        </Field>
        <Field label="코드" hint="마스터 데이터 화면에서 확인">
          <Input value={inventoryCode} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="예: FD000" />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button
          loading={loading}
          disabled={!inventoryCode}
          onClick={() => { onSubmit({ inventoryCode, inventoryTypeCode }); setCode(''); }}
        >
          지급
        </Button>
      </div>
    </div>
  );
}
