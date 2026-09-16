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
 *
 * <p>맵과 몽은 항목 수가 크게 달라 카드 높이가 제각각이 된다. 배지 영역만 스크롤시키고
 * 지급 줄은 카드 아래에 고정해, 두 카드가 같은 높이·같은 모양으로 보이게 한다.
 */
export function CollectionPanel({ title, items, loading, onGrant }: Props) {
  const [code, setCode] = useState('');
  const owned = items.filter((i) => i.owned).length;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <span className="text-xs text-muted-foreground">{owned} / {items.length}</span>
      </CardHeader>
      <CardBody className="flex min-h-0 flex-1 flex-col gap-3 p-0">
        <div className="max-h-56 min-h-32 flex-1 overflow-y-auto p-5 pb-0">
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
        </div>
        <div className="flex gap-2 border-t p-5">
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
