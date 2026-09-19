import { Moon, Sun } from 'lucide-react';
import { Button } from '@/shared/ui';

interface Props {
  isSleep: boolean;
  disabled?: boolean;
  loading?: boolean;
  onSubmit: (values: { isSleep: boolean }) => void;
}

/**
 * 수면·기상 전환. 앱에서 누른 것과 같은 경로라 지수 증감 스케줄도 함께 교체된다.
 * 알(Lv.0)·사망·졸업 상태에서는 서버가 거부하므로 버튼을 막는다.
 *
 * <p>Field 는 힌트를 입력 칸 <b>아래</b>에 두기 때문에 `items-end` 로 묶으면 버튼이
 * 힌트 줄까지 내려가 어긋난다. 상태 칸과 버튼만 한 줄로 묶고 힌트는 그 아래에 둔다.
 */
export function MongSleepForm({ isSleep, disabled, loading, onSubmit }: Props) {
  const next = !isSleep;

  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-medium text-muted-foreground">수면 상태</span>
      <div className="flex gap-2">
        <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border bg-surface px-3 text-sm">
          {isSleep ? <Moon className="size-4 shrink-0 text-primary" /> : <Sun className="size-4 shrink-0 text-warning" />}
          <span className="truncate">{isSleep ? '수면 중' : '기상'}</span>
        </div>
        <Button className="shrink-0" variant="secondary" disabled={disabled} loading={loading} onClick={() => onSubmit({ isSleep: next })}>
          {next ? <Moon className="size-4" /> : <Sun className="size-4" />}
          {next ? '재우기' : '깨우기'}
        </Button>
      </div>
      <span className="block text-xs text-muted-foreground">
        {disabled
          ? '알·사망·졸업 상태에서는 서버가 전환을 받지 않는다.'
          : isSleep
            ? '증가 스케줄이 돌고 있다'
            : '감소·배변 스케줄이 돌고 있다'}
      </span>
    </div>
  );
}
