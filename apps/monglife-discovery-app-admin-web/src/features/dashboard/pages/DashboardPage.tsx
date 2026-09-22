import { useState } from 'react';
import { Activity, UserPlus, Users, UserX } from 'lucide-react';
import { useLoginStats, useSignupStats, useUserStats } from '../queries';
import { StatCard } from '@/shared/components/StatCard';
import { TrendChart } from '@/shared/components/TrendChart';
import { Card, CardBody, CardHeader, CardTitle, PageHeader, Select } from '@/shared/ui';
import { formatNumber } from '@/shared/lib/format';

export function DashboardPage() {
  const [loginDays, setLoginDays] = useState(14);
  const [signupDays, setSignupDays] = useState(14);
  const users = useUserStats();
  const logins = useLoginStats(loginDays);
  const signups = useSignupStats(signupDays);

  return (
    <>
      <PageHeader title="대시보드" description="사용자 현황과 로그인 · 가입 추이" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="오늘 가입" value={formatNumber(users.data?.todayJoined)} hint={`최근 7일 ${formatNumber(users.data?.weekJoined)}`} icon={<UserPlus className="size-5" />} />
        <StatCard label="전체 계정" value={formatNumber(users.data?.totalAccounts)} icon={<Users className="size-5" />} />
        <StatCard label="30일 미로그인" value={formatNumber(users.data?.inactiveAccounts)} hint="최근 30일 로그인 기록 없음" icon={<UserX className="size-5" />} />
        <StatCard label="현재 로그인" value={formatNumber(users.data?.activeSessions)} hint="유효 토큰 기준" icon={<Activity className="size-5" />} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>로그인 추이</CardTitle>
          <PeriodSelect value={loginDays} onChange={setLoginDays} />
        </CardHeader>
        <CardBody>
          <TrendChart
            label="로그인 추이"
            loading={logins.isLoading}
            data={(logins.data ?? []).map((d) => ({ date: d.date, value: d.loginCount, tooltip: `${d.date} · 로그인 ${d.loginCount} · 계정 ${d.uniqueAccounts}` }))}
          />
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>일일 가입자</CardTitle>
          <PeriodSelect value={signupDays} onChange={setSignupDays} />
        </CardHeader>
        <CardBody>
          <TrendChart
            label="일일 가입자"
            loading={signups.isLoading}
            data={(signups.data ?? []).map((d) => ({ date: d.date, value: d.count, tooltip: `${d.date} · 가입 ${d.count}` }))}
          />
        </CardBody>
      </Card>
    </>
  );
}

function PeriodSelect({ value, onChange }: { value: number; onChange: (days: number) => void }) {
  return (
    <Select className="w-32" value={value} onChange={(e) => onChange(Number(e.target.value))}>
      <option value={7}>최근 7일</option>
      <option value={14}>최근 14일</option>
      <option value={30}>최근 30일</option>
    </Select>
  );
}
