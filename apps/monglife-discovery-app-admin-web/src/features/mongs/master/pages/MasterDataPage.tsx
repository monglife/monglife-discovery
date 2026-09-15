import { useState } from 'react';
import { useMaster } from '../../queries';
import type { ExchangeStarPointProduct, FeedItem, MapType, MongType, RandomDraw, TrainingType } from '../../types';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { Card, PageHeader } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { formatNumber } from '@/shared/lib/format';

type TabKey = 'mongTypes' | 'foods' | 'snacks' | 'trainingTypes' | 'randomDraws' | 'mapTypes' | 'exchangeProducts';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'mongTypes', label: '몽 타입' },
  { key: 'foods', label: '음식' },
  { key: 'snacks', label: '간식' },
  { key: 'trainingTypes', label: '훈련' },
  { key: 'randomDraws', label: '랜덤 뽑기' },
  { key: 'mapTypes', label: '맵' },
  { key: 'exchangeProducts', label: '환전 상품' },
];

const round = (v: number) => formatNumber(Math.round(v));

const mongTypeColumns: Column<MongType>[] = [
  { key: 'code', header: '코드', cell: (r) => <span className="font-mono text-xs">{r.mongCode}</span> },
  { key: 'name', header: '이름', cell: (r) => r.mongName },
  { key: 'level', header: '레벨', cell: (r) => r.level },
  { key: 'score', header: '진화 점수', cell: (r) => round(r.evolutionScore) },
  { key: 'max', header: '최대 지수', cell: (r) => round(r.maxStatus) },
  { key: 'group', header: '그룹', cell: (r) => <span className="font-mono text-xs">{r.groupType ?? '-'}</span> },
];

const feedColumns: Column<FeedItem>[] = [
  { key: 'code', header: '코드', cell: (r) => <span className="font-mono text-xs">{r.code}</span> },
  { key: 'name', header: '이름', cell: (r) => r.name },
  { key: 'price', header: '가격', cell: (r) => formatNumber(r.price) },
  { key: 'strength', header: '체력', cell: (r) => round(r.strength) },
  { key: 'satiety', header: '포만감', cell: (r) => round(r.satiety) },
  { key: 'healthy', header: '건강', cell: (r) => round(r.healthy) },
  { key: 'fatigue', header: '피로', cell: (r) => round(r.fatigue) },
  { key: 'weight', header: '몸무게', cell: (r) => round(r.weight) },
  { key: 'delay', header: '재구매 대기', cell: (r) => `${formatNumber(r.delaySeconds)}초` },
];

const trainingColumns: Column<TrainingType>[] = [
  { key: 'code', header: '코드', cell: (r) => <span className="font-mono text-xs">{r.trainingCode}</span> },
  { key: 'name', header: '이름', cell: (r) => r.trainingName },
  { key: 'payPoint', header: '보상 포인트', cell: (r) => formatNumber(r.payPoint) },
  { key: 'score', header: '목표 점수', cell: (r) => formatNumber(r.score) },
  { key: 'timeout', header: '제한 시간', cell: (r) => formatNumber(r.timeout) },
  { key: 'exp', header: '경험치', cell: (r) => round(r.exp) },
];

const randomDrawColumns: Column<RandomDraw>[] = [
  { key: 'code', header: '코드', cell: (r) => <span className="font-mono text-xs">{r.randomDrawCode}</span> },
  { key: 'name', header: '이름', cell: (r) => r.randomDrawName },
  { key: 'type', header: '종류', cell: (r) => r.inventoryTypeCode },
];

const mapColumns: Column<MapType>[] = [
  { key: 'code', header: '코드', cell: (r) => <span className="font-mono text-xs">{r.mapCode}</span> },
  { key: 'name', header: '이름', cell: (r) => r.mapName },
  { key: 'words', header: '검색어', cell: (r) => <span className="text-muted-foreground">{r.words ?? '-'}</span> },
];

const exchangeColumns: Column<ExchangeStarPointProduct>[] = [
  { key: 'id', header: '상품 ID', cell: (r) => <span className="font-mono text-xs">{r.productId}</span> },
  { key: 'name', header: '이름', cell: (r) => r.productName },
  { key: 'star', header: '스타 포인트', cell: (r) => formatNumber(r.starPoint) },
];

export function MasterDataPage() {
  const [tab, setTab] = useState<TabKey>('mongTypes');
  const { data, isLoading } = useMaster(tab);

  // 탭마다 행 타입이 달라 컬럼·키를 여기서 고른다
  const table = () => {
    switch (tab) {
      case 'mongTypes':
        return <DataTable columns={mongTypeColumns} rows={(data ?? []) as MongType[]} rowKey={(r) => r.mongCode} loading={isLoading} />;
      case 'foods':
      case 'snacks':
        return <DataTable columns={feedColumns} rows={(data ?? []) as FeedItem[]} rowKey={(r) => r.code} loading={isLoading} />;
      case 'trainingTypes':
        return <DataTable columns={trainingColumns} rows={(data ?? []) as TrainingType[]} rowKey={(r) => r.trainingCode} loading={isLoading} />;
      case 'randomDraws':
        return <DataTable columns={randomDrawColumns} rows={(data ?? []) as RandomDraw[]} rowKey={(r) => r.randomDrawId} loading={isLoading} />;
      case 'mapTypes':
        return <DataTable columns={mapColumns} rows={(data ?? []) as MapType[]} rowKey={(r) => r.mapCode} loading={isLoading} />;
      case 'exchangeProducts':
        return <DataTable columns={exchangeColumns} rows={(data ?? []) as ExchangeStarPointProduct[]} rowKey={(r) => r.productId} loading={isLoading} />;
    }
  };

  return (
    <>
      <PageHeader
        title="마스터 데이터"
        description="읽기 전용. 값 수정은 캐시·시드 SQL 과 엇갈리므로 SQL 배포로 한다."
      />

      <div className="mb-3 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm',
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-surface text-muted-foreground hover:bg-surface-muted',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>{table()}</Card>
    </>
  );
}
