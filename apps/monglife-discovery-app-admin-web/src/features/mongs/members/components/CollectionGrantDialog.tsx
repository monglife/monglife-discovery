import { useEffect, useMemo, useState } from 'react';
import { useMaster } from '../../queries';
import { Button, Dialog, Field, Select } from '@/shared/ui';

type Kind = 'MONG' | 'MAP';

interface Props {
  open: boolean;
  kind: Kind;
  /** 이미 보유한 코드. 셀렉트에서 고를 수 없게 막는다 */
  ownedCodes: string[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
}

/**
 * 컬렉션 수동 지급. 코드를 손으로 적지 않고 공통 코드(몽 타입·맵 타입)에서 이름으로 고른다.
 */
export function CollectionGrantDialog({ open, kind, ownedCodes, loading, onClose, onSubmit }: Props) {
  const [code, setCode] = useState('');

  const mongTypes = useMaster('mongTypes');
  const mapTypes = useMaster('mapTypes');
  const source = kind === 'MONG' ? mongTypes : mapTypes;

  const options = useMemo(() => {
    const rows =
      kind === 'MONG'
        ? (mongTypes.data ?? []).map((t) => ({ code: t.mongCode, name: t.mongName }))
        : (mapTypes.data ?? []).map((t) => ({ code: t.mapCode, name: t.mapName }));
    // 같은 코드의 몽 타입이 레벨별로 여러 줄일 수 있어 코드 기준으로 한 번만 남긴다
    const seen = new Set<string>();
    return rows
      .filter((r) => (seen.has(r.code) ? false : seen.add(r.code)))
      .map((r) => ({ ...r, owned: ownedCodes.includes(r.code) }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [kind, mongTypes.data, mapTypes.data, ownedCodes]);

  // 목록이 바뀌면 아직 없는 것 중 첫 항목으로 맞춘다
  useEffect(() => {
    setCode(options.find((o) => !o.owned)?.code ?? '');
  }, [options]);

  const label = kind === 'MONG' ? '몽' : '맵';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`컬렉션 ${label} 지급`}
      description="이미 보유한 항목은 고를 수 없습니다."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>취소</Button>
          <Button loading={loading} disabled={!code} onClick={() => onSubmit(code)}>지급</Button>
        </>
      }
    >
      <Field
        label={`${label} 코드`}
        hint={source.isLoading ? '목록을 불러오는 중…' : `${options.filter((o) => !o.owned).length}종 지급 가능 / 전체 ${options.length}종`}
      >
        <Select value={code} onChange={(e) => setCode(e.target.value)} disabled={source.isLoading || options.length === 0}>
          {options.length === 0 && <option value="">항목이 없습니다</option>}
          {options.map((o) => (
            <option key={o.code} value={o.code} disabled={o.owned}>
              {o.name} ({o.code}){o.owned ? ' · 보유 중' : ''}
            </option>
          ))}
        </Select>
      </Field>
    </Dialog>
  );
}
