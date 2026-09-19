import { useMemo } from 'react';
import { Heart, Shield, Swords } from 'lucide-react';
import { useMatch } from '../../queries';
import type { MatchDetail } from '../../types';
import { Badge, Dialog } from '@/shared/ui';
import { formatDateTime, formatNumber } from '@/shared/lib/format';

interface Props {
  matchId: number | null;
  onClose: () => void;
}

type Pick = MatchDetail['picks'][number];
type Player = MatchDetail['players'][number];

const PICK_META: Record<string, { label: string; tone: 'danger' | 'primary' | 'success'; icon: typeof Swords }> = {
  MATCH_PICK_ATTACK: { label: '공격', tone: 'danger', icon: Swords },
  MATCH_PICK_DEFENCE: { label: '방어', tone: 'primary', icon: Shield },
  MATCH_PICK_HEAL: { label: '회복', tone: 'success', icon: Heart },
};

export function MatchDetailDialog({ matchId, onClose }: Props) {
  const { data, isLoading } = useMatch(matchId ?? 0);

  /** playerId 는 사람이 읽을 수 없는 난수다. 이름·몽으로 바꿔 보여 준다 */
  const nameOf = useMemo(() => {
    const map = new Map<string, Player>();
    for (const p of data?.players ?? []) map.set(p.playerId, p);
    return (playerId: string | null) => {
      if (!playerId) return { label: '-', bot: false };
      const p = map.get(playerId);
      if (!p) return { label: playerId.slice(0, 8), bot: false };
      return { label: p.name ?? p.mongName ?? playerId.slice(0, 8), bot: Boolean(p.isBot) };
    };
  }, [data]);

  /** 라운드별로 묶는다. 0 라운드(입장 직후)도 그대로 둔다 */
  const rounds = useMemo(() => {
    const byRound = new Map<number, Pick[]>();
    for (const pick of data?.picks ?? []) {
      const list = byRound.get(pick.round) ?? [];
      list.push(pick);
      byRound.set(pick.round, list);
    }
    return [...byRound.entries()].sort((a, b) => b[0] - a[0]);
  }, [data]);

  return (
    <Dialog
      open={matchId !== null}
      onClose={onClose}
      size="lg"
      className="max-w-5xl"
      title={`매치 #${matchId ?? ''}`}
      description={data ? `${data.stateCode} · 라운드 ${data.round} / ${data.maxRound}` : undefined}
    >
      {isLoading && <div className="py-10 text-center text-sm text-muted-foreground">불러오는 중…</div>}
      {data && (
        /* 모바일은 두 단이 위아래로 쌓여 길어진다. 모달 안에서 스크롤시킨다 */
        <div className="grid max-h-[70vh] gap-5 overflow-y-auto pr-1 lg:max-h-none lg:grid-cols-2 lg:overflow-visible lg:pr-0">
          <section>
            <h4 className="mb-2 text-xs font-medium text-muted-foreground">플레이어</h4>
            <ul className="space-y-2">
              {data.players.map((p) => (
                <li key={p.playerId} className="rounded-md border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{p.name ?? '-'}</span>
                    <span className="text-muted-foreground">{p.mongName ?? p.mongCode ?? ''}</span>
                    {p.isBot && <Badge>봇</Badge>}
                    {!p.isBot && <Badge tone={p.isEnter ? 'success' : 'neutral'}>{p.isEnter ? '입장' : '미입장'}</Badge>}
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
                    <Stat label="HP" value={p.hp} />
                    <Stat label="공격" value={p.attack} />
                    <Stat label="회복" value={p.heal} />
                    <Stat label="방어" value={p.defence} />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {p.accountId !== null && `계정 ${p.accountId}`}
                    {p.enteredAt && ` · 입장 ${formatDateTime(p.enteredAt)}`}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="min-w-0">
            <h4 className="mb-2 text-xs font-medium text-muted-foreground">라운드별 선택 · 최신 순</h4>
            {rounds.length === 0 ? (
              <p className="text-sm text-muted-foreground">선택 기록이 없습니다.</p>
            ) : (
              <ul className="space-y-3 lg:max-h-[28rem] lg:overflow-y-auto lg:pr-1">
                {rounds.map(([round, picks]) => (
                  <li key={round} className="rounded-md border">
                    <div className="flex items-center justify-between border-b px-3 py-2">
                      <span className="text-sm font-medium">라운드 {round}</span>
                      <span className="text-xs text-muted-foreground">{picks.length}건</span>
                    </div>
                    <ul className="divide-y">
                      {picks.map((pick, i) => {
                        const meta = PICK_META[pick.pickCode ?? ''] ?? { label: pick.pickCode ?? '-', tone: 'primary' as const, icon: Swords };
                        const from = nameOf(pick.playerId);
                        const to = nameOf(pick.targetPlayerId);
                        const Icon = meta.icon;
                        const self = pick.playerId === pick.targetPlayerId;
                        return (
                          <li key={pick.pickId ?? `${round}-${i}`} className="flex items-center gap-2 px-3 py-2 text-sm">
                            <Icon className="size-4 shrink-0 text-muted-foreground" />
                            <Badge tone={meta.tone}>{meta.label}</Badge>
                            <span className="min-w-0 flex-1 truncate">
                              <b>{from.label}</b>
                              {from.bot && <span className="text-muted-foreground"> (봇)</span>}
                              {!self && (
                                <>
                                  <span className="mx-1 text-muted-foreground">→</span>
                                  <b>{to.label}</b>
                                  {to.bot && <span className="text-muted-foreground"> (봇)</span>}
                                </>
                              )}
                              {self && <span className="ml-1 text-muted-foreground">자신에게</span>}
                            </span>
                            <span className="shrink-0 tabular-nums">{formatNumber(Math.round(pick.pickValue ?? 0))}</span>
                          </li>
                        );
                      })}
                    </ul>
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded bg-surface-muted py-1.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="font-medium tabular-nums">{formatNumber(Math.round(value))}</div>
    </div>
  );
}
