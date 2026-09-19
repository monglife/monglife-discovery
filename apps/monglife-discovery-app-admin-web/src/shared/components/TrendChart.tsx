import { useLayoutEffect, useRef, useState } from 'react';

export interface TrendPoint {
  /** YYYY-MM-DD */
  date: string;
  value: number;
  tooltip?: string;
}

/**
 * 의존성 없는 간단한 SVG 막대 차트. 디자인 시스템 싱크 후 차트 라이브러리로 교체해도 된다.
 * viewBox 를 컨테이너의 실제 픽셀 너비로 잡아 화면 폭에 맞춰 압축된다 (가로 스크롤 없음, 글자 크기는 고정).
 */
export function TrendChart({ data, loading, label }: { data: TrendPoint[]; loading?: boolean; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(800);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.floor(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (loading) return <div className="h-48 animate-pulse rounded bg-surface-muted" />;
  if (data.length === 0) return <p className="py-12 text-center text-sm text-muted-foreground">데이터가 없습니다.</p>;

  const H = 180;
  const pad = { top: 18, right: 8, bottom: 24, left: 36 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = innerW / data.length;
  const barW = Math.max(3, step * 0.6);
  const ticks = [0, 0.5, 1].map((r) => Math.round(max * r));
  // 좁으면 라벨을 솎는다 — 날짜는 ~40px, 값은 ~24px 마다 하나
  const dateEvery = Math.max(1, Math.ceil(40 / step));
  const valueEvery = Math.max(1, Math.ceil(24 / step));

  return (
    <div ref={ref} className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block max-w-full" role="img" aria-label={label}>
        {ticks.map((t) => {
          const y = pad.top + innerH - (t / max) * innerH;
          return (
            <g key={t}>
              <line x1={pad.left} x2={W - pad.right} y1={y} y2={y} stroke="var(--color-border)" strokeDasharray="2 3" />
              <text x={pad.left - 6} y={y + 3} textAnchor="end" fontSize="10" fill="var(--color-muted-foreground)">
                {t}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.value / max) * innerH;
          const x = pad.left + i * step + (step - barW) / 2;
          const y = pad.top + innerH - h;
          const last = i === data.length - 1;
          const showDate = i % dateEvery === 0 || (last && (data.length - 1) % dateEvery >= dateEvery / 2);
          const showValue = d.value > 0 && i % valueEvery === 0;
          return (
            <g key={d.date}>
              <rect x={x} y={y} width={barW} height={h} rx="3" fill="var(--color-primary)" opacity="0.85">
                <title>{d.tooltip ?? `${d.date} · ${d.value}`}</title>
              </rect>
              {showValue && (
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--color-foreground)">
                  {d.value}
                </text>
              )}
              {showDate && (
                <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--color-muted-foreground)">
                  {d.date.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
