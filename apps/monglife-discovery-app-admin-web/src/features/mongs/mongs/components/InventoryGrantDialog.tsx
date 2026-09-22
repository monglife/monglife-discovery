import { useEffect, useMemo, useState } from 'react';
import { useMaster } from '../../queries';
import { Button, Dialog, Field, Select } from '@/shared/ui';
import { formatNumber } from '@/shared/lib/format';

type Type = 'FOOD' | 'SNACK';

interface Props {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (body: { inventoryCode: string; inventoryTypeCode: Type }) => void;
}

/** 코드는 직접 적지 않고 마스터 데이터(음식·간식)에서 고른다 */
export function InventoryGrantDialog({ open, loading, onClose, onSubmit }: Props) {
  const [inventoryTypeCode, setType] = useState<Type>('FOOD');
  const [inventoryCode, setCode] = useState('');

  const { data: foods, isLoading: foodsLoading } = useMaster('foods');
  const { data: snacks, isLoading: snacksLoading } = useMaster('snacks');

  const items = useMemo(
    () => (inventoryTypeCode === 'FOOD' ? (foods ?? []) : (snacks ?? [])),
    [inventoryTypeCode, foods, snacks],
  );
  const itemsLoading = inventoryTypeCode === 'FOOD' ? foodsLoading : snacksLoading;

  // 종류를 바꾸면 코드 목록이 통째로 바뀐다. 첫 항목으로 맞춰 둔다.
  useEffect(() => {
    setCode(items[0]?.code ?? '');
  }, [items]);

  useEffect(() => {
    if (open) setType('FOOD');
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="인벤토리 아이템 지급"
      description="지급한 아이템은 앱의 인벤토리에서 바로 쓸 수 있습니다."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>취소</Button>
          <Button
            loading={loading}
            disabled={!inventoryCode}
            onClick={() => onSubmit({ inventoryCode, inventoryTypeCode })}
          >
            지급
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="종류">
          <Select value={inventoryTypeCode} onChange={(e) => setType(e.target.value as Type)}>
            <option value="FOOD">음식</option>
            <option value="SNACK">간식</option>
          </Select>
        </Field>
        <Field label="아이템" hint={itemsLoading ? '목록을 불러오는 중…' : `${items.length}종`}>
          <Select value={inventoryCode} onChange={(e) => setCode(e.target.value)} disabled={itemsLoading || items.length === 0}>
            {items.length === 0 && <option value="">항목이 없습니다</option>}
            {items.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name} ({item.code}) · {formatNumber(item.price)}P
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Dialog>
  );
}
