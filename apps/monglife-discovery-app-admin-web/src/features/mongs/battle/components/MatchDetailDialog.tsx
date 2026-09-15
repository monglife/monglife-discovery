import { useMatch } from '../../queries';
import { Badge, Dialog } from '@/shared/ui';
import { formatDateTime, formatNumber } from '@/shared/lib/format';

interface Props {
  matchId: number | null;
  onClose: () => void;
}

export function MatchDetailDialog({ matchId, onClose }: Props) {
  const { data, isLoading } = useMatch(matchId ?? 0);

  return (
    <Dialog
      open={matchId !== null}
      onClose={onClose}
      size="lg"
      title={`매치 #${matchId ?? ''}`}
      description={data ? `${data.stateCode} · 라운드 ${data.round} / ${data.maxRound}` : undefined}
    >
      {isLoading && <div className="py-6 text-center text-sm text-muted-foreground">불러오는 중…</div>}
      {data && (
        <div className="space-y-4">
          <section>
            <h4 className="mb-2 text-xs font-medium text-muted-foreground">플레이어</h4>
            <ul className="space-y-2">
              {data.players.map((p) => (
                <li key={p.playerId} className="rounded-md border p-2.5 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{p.name ?? '-'}</span>
                    <span className="text-muted-foreground">{p.mongName ?? p.mongCode ?? ''}</span>
                    {p.isBot && <Badge>봇</Badge>}
                    {!p.isBot && <Badge tone={p.isEnter ? 'success' : 'neutral'}>{p.isEnter ? '입장' : '미입장'}</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    HP {formatNumber(Math.round(p.hp))} · 공격 {formatNumber(Math.round(p.attack))} · 회복 {formatNumber(Math.round(p.heal))} · 방어 {formatNumber(Math.round(p.defence))}
                    {p.accountId !== null && ` · 계정 ${p.accountId}`}
                    {p.enteredAt && ` · 입장 ${formatDateTime(p.enteredAt)}`}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-medium text-muted-foreground">선택 로그</h4>
            {data.picks.length === 0 ? (
              <p className="text-sm text-muted-foreground">선택 기록이 없습니다.</p>
            ) : (
              <ul className="max-h-64 space-y-1 overflow-y-auto text-xs">
                {data.picks.map((pick, i) => (
                  <li key={pick.pickId ?? i} className="flex items-center justify-between gap-2 rounded border px-2 py-1">
                    <span className="text-muted-foreground">R{pick.round}</span>
                    <span className="min-w-0 flex-1 truncate font-mono">{pick.playerId} → {pick.targetPlayerId}</span>
                    <span>{pick.pickCode?.replace('MATCH_PICK_', '')}</span>
                    <span className="text-muted-foreground">{formatNumber(Math.round(pick.pickValue ?? 0))}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Dialog>
  );
}
