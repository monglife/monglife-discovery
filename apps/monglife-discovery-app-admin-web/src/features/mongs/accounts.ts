import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

/**
 * mongs 는 계정 ID 만 들고 있다. 이메일은 discovery common-api 가 정본이라
 * 화면에서 ID 목록으로 한 번 더 물어 이름표를 붙인다.
 */
export interface AccountSummary {
  accountId: number;
  email: string;
  name: string;
  isDeleted: boolean;
}

const summariesApi = (accountIds: number[]) =>
  api.get<AccountSummary[]>('/admin/accounts/summaries', { accountIds: accountIds.join(',') });

/**
 * 계정 ID 목록 → { accountId: 요약 } 조회.
 * ID 가 없으면 요청하지 않는다. 계정이 지워졌거나 조회에 실패하면 호출 쪽이 ID 를 그대로 보여 준다.
 */
export function useAccountSummaries(accountIds: (number | null | undefined)[]) {
  const ids = [...new Set(accountIds.filter((id): id is number => typeof id === 'number' && id > 0))].sort((a, b) => a - b);

  const { data } = useQuery({
    queryKey: ['mongs', 'account-summaries', ids],
    queryFn: () => summariesApi(ids),
    enabled: ids.length > 0,
    staleTime: 60_000,
  });

  const map = new Map((data ?? []).map((a) => [a.accountId, a]));
  return {
    map,
    /** 이메일이 있으면 이메일, 없으면 계정 ID */
    label: (accountId?: number | null) => (accountId == null ? '-' : (map.get(accountId)?.email ?? String(accountId))),
    get: (accountId?: number | null) => (accountId == null ? undefined : map.get(accountId)),
  };
}
