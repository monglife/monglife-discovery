import { Plus } from 'lucide-react';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle } from '@/shared/ui';

interface Item {
  code: string;
  name: string;
  owned: boolean;
}

interface Props {
  title: string;
  items: Item[];
  onGrantClick: () => void;
}

/**
 * 도감은 전체 코드 목록이 내려오고 보유 여부(owned)가 표시된다. 지급은 헤더 버튼 → 모달.
 *
 * <p>맵과 몽은 항목 수가 크게 달라 카드 높이가 제각각이 된다. 배지 영역만 스크롤시켜
 * 두 카드가 같은 높이로 보이게 한다.
 */
export function CollectionPanel({ title, items, onGrantClick }: Props) {
  const owned = items.filter((i) => i.owned).length;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{owned} / {items.length}</span>
          <Button size="sm" variant="secondary" onClick={onGrantClick}>
            <Plus className="size-4" /> 지급
          </Button>
        </div>
      </CardHeader>
      <CardBody className="max-h-64 min-h-32 flex-1 overflow-y-auto">
        <div className="flex flex-wrap gap-1.5">
          {items.length === 0 && <span className="text-sm text-muted-foreground">조회된 항목이 없습니다.</span>}
          {items.map((i) => (
            <Badge key={i.code} tone={i.owned ? 'primary' : 'neutral'} className={i.owned ? '' : 'opacity-50'}>
              {i.name || i.code}
            </Badge>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
