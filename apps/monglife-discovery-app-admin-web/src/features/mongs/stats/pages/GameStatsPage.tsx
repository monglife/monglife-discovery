import { useBattleStats, useGameStats } from '../../queries';
import { StatCard } from '@/shared/components/StatCard';
import { Card, CardBody, CardHeader, CardTitle, PageHeader } from '@/shared/ui';
import { formatNumber } from '@/shared/lib/format';

/** 백엔드 enum 이름 → 화면 라벨 */
const STATE_LABEL: Record<string, string> = {
  NORMAL: '정상',
  EVOLUTION_READY: '진화 준비',
  GRADUATE_READY: '졸업 준비',
  GRADUATE: '졸업',
  DEAD: '사망',
};
const STATUS_LABEL: Record<string, string> = {
  NORMAL: '정상',
  HUNGRY: '배고픔',
  SOMNOLENCE: '졸림',
  SICK: '아픔',
};

function Distribution({ title, counts, labels }: { title: string; counts: Record<string, number>; labels: Record<string, string> }) {
  const entries = Object.entries(counts ?? {});
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardBody className="space-y-2.5">
        {entries.length === 0 && <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>}
        {entries.map(([code, count]) => (
          <div key={code}>
            <div className="mb-1 flex justify-between text-xs">
              <span>{labels[code] ?? code}</span>
              <span className="text-muted-foreground">{formatNumber(count)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }} />
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

export function GameStatsPage() {
  const { data } = useGameStats();
  const { data: battle } = useBattleStats();

  return (
    <>
      <PageHeader title="게임 통계" description="mongs 서비스의 현재 상태. 계정·로그인 통계는 대시보드에 있다." />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="전체 몽" value={formatNumber(data?.mong.totalMongs)} hint={`오늘 생성 ${formatNumber(data?.mong.todayCreated)}`} />
        <StatCard label="도는 스케줄" value={formatNumber(data?.mong.scheduledTasks)} hint="메모리에 올라간 수" />
        <StatCard label="멤버" value={formatNumber(data?.member.totalMembers)} hint={`오늘 등록 ${formatNumber(data?.member.todayJoined)}`} />
        <StatCard label="스타 포인트 총량" value={formatNumber(data?.member.totalStarPoint)} />
        <StatCard label="오늘 주문" value={formatNumber(data?.member.todayOrders)} hint={`금액 ${formatNumber(Math.round(data?.member.todayOrderAmount ?? 0))}`} />
        <StatCard label="전체 주문" value={formatNumber(data?.member.totalOrders)} />
        <StatCard label="대기열" value={formatNumber(battle?.queueSize)} hint={`진행 중 매치 ${formatNumber(battle?.processingMatches)}`} />
        <StatCard label="오늘 매치" value={formatNumber(battle?.todayMatches)} hint={`봇 포함 ${formatNumber(battle?.todayBotMatches)}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Distribution title="몽 상태 분포" counts={data?.mong.countByState ?? {}} labels={STATE_LABEL} />
        <Distribution title="몽 지수 분포" counts={data?.mong.countByStatus ?? {}} labels={STATUS_LABEL} />
      </div>
    </>
  );
}
