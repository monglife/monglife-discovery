import { useState } from 'react';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Input } from '@/shared/ui';

interface Item {
  code: string;
  name: string;
  owned: boolean;
}

interface Props {
  title: string;
  items: Item[];
  loading?: boolean;
  onGrant: (code: string) => void;
}

/**
 * 도감은 전체 코드 목록이 내려오고 보유 여부(owned)가 표시된다.
 * 미보유 항목을 눌러 수동 지급한다.
 */
export function CollectionPanel({ title, items, loading, onGrant }: Props) {
  const [code, setCode] = useState('');
  const owned = items.filter((i) => i.owned).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <span className="text-xs text-muted-foreground">{owned} / {items.length}</span>
      </CardHeader>
      <CardBody className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {items.length === 0 && <span className="text-sm text-muted-foreground">조회된 항목이 없습니다.</span>}
          {items.map((i) => (
            <button
              key={i.code}
              type="button"
              title={i.owned ? '보유 중' : '클릭하면 지급'}
              disabled={i.owned || loading}
              onClick={() => onGrant(i.code)}
              className="disabled:cursor-default"
            >
              <Badge tone={i.owned ? 'primary' : 'neutral'} className={i.owned ? '' : 'opacity-50'}>
                {i.name || i.code}
              </Badge>
            </button>
          ))}
        </div>
        <div className="flex gap-2 border-t pt-3">
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="코드 직접 입력 (예: CH100)" />
          <Button
            variant="secondary"
            loading={loading}
            disabled={!code}
            onClick={() => { onGrant(code); setCode(''); }}
          >
            지급
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
