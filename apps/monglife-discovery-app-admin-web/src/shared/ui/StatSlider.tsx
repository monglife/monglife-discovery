import { useId } from 'react';
import { cn } from '@/shared/lib/cn';

interface Props {
  label: string;
  value: number;
  /** 서버에 저장돼 있는 현재 값. 드래그한 값과 다르면 막대 위에 원래 자리를 표시한다 */
  original: number;
  min?: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

/**
 * 드래그로 고치는 지수 막대.
 *
 * <p>숫자 입력 대신 막대를 쓰는 이유는 "지금 얼마나 찼는지"가 한눈에 들어와야 해서다.
 * 대신 정확한 값도 필요하므로 오른쪽에 숫자를 같이 띄우고 직접 입력도 받는다.
 *
 * <p>원래 값은 막대 위 눈금으로 남긴다 - 드래그하다 보면 원래 어디였는지 잊는다.
 */
export function StatSlider({ label, value, original, min = 0, max, step = 1, unit, disabled, onChange }: Props) {
  const id = useId();
  const span = Math.max(1, max - min);
  const pct = (v: number) => Math.min(100, Math.max(0, ((v - min) / span) * 100));
  const changed = value !== original;

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs text-muted-foreground">{label}</label>
        <span className="flex items-baseline gap-1">
          {/* 직접 입력. 막대만으로는 큰 수(경험치·페이 포인트)를 정확히 맞추기 어렵다 */}
          <input
            id={id}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
            }}
            className={cn(
              'w-20 rounded-md border bg-surface px-1.5 py-0.5 text-right text-sm tabular-nums',
              changed ? 'border-primary font-medium text-primary' : 'border-border',
            )}
          />
          {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        </span>
      </div>

      <div className="relative mt-1.5">
        {/* 원래 값 눈금. 값이 바뀐 동안만 보여 준다 */}
        {changed && (
          <span
            className="pointer-events-none absolute -top-0.5 z-10 h-3 w-0.5 -translate-x-1/2 rounded-full bg-muted-foreground/70"
            style={{ left: `${pct(original)}%` }}
            title={`원래 ${original}`}
          />
        )}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            'h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-muted',
            'disabled:cursor-not-allowed disabled:opacity-50',
            // 채워진 구간을 배경 그라데이션으로 그린다. ::-moz-range-progress 가 없는 브라우저도 같게 보인다.
            changed ? '[--fill:var(--color-primary)]' : '[--fill:var(--color-muted-foreground)]',
            '[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:bg-[var(--fill)]',
            '[&::-webkit-slider-thumb]:shadow',
            '[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2',
            '[&::-moz-range-thumb]:border-surface [&::-moz-range-thumb]:bg-[var(--fill)]',
          )}
          style={{
            background: `linear-gradient(to right, var(--fill) 0%, var(--fill) ${pct(value)}%, var(--color-surface-muted) ${pct(value)}%, var(--color-surface-muted) 100%)`,
          }}
        />
      </div>
    </div>
  );
}
