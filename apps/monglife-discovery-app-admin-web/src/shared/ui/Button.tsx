import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

/**
 * 모든 변형에 테두리를 준다. 채워진 변형은 배경보다 한 단계 짙은 같은 색을 써서
 * 임의의 선이 아니라 그 버튼의 가장자리로 읽히게 한다.
 */
const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground border border-primary-hover hover:bg-primary-hover shadow-sm',
  secondary: 'bg-surface text-foreground border border-border hover:bg-surface-muted',
  ghost: 'text-foreground border border-border hover:bg-surface-muted',
  danger: 'bg-danger text-white border border-danger-hover hover:bg-danger-hover',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        // pointer-events-none 을 쓰지 않는다. 비활성 버튼은 어차피 click 이 안 나가는데,
        // 이걸 걸면 커서가 not-allowed 로 안 바뀌고 title 툴팁도 뜨지 않는다 -
        // "왜 못 누르는지" 를 알려 줄 방법이 사라진다.
        'disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
});
