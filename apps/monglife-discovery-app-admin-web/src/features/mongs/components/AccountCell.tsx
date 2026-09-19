import { Link } from 'react-router-dom';
import type { AccountSummary } from '../accounts';

interface Props {
  accountId: number | null | undefined;
  account?: AccountSummary;
}

/**
 * 계정 칸. 이메일만 보여 준다 — 이메일이 아직 안 왔거나 계정이 지워졌으면 계정 ID 로 떨어진다.
 */
export function AccountCell({ accountId, account }: Props) {
  if (accountId == null) return <span className="text-muted-foreground">-</span>;
  return (
    <Link
      className="inline-flex min-w-0 items-center gap-1.5 truncate text-primary hover:underline"
      to={`/accounts/${accountId}`}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="truncate">{account?.email ?? `#${accountId}`}</span>
      {account?.isDeleted && <span className="shrink-0 text-xs text-muted-foreground">(탈퇴)</span>}
    </Link>
  );
}
