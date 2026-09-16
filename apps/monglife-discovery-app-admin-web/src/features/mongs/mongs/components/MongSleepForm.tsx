import { Moon, Sun } from 'lucide-react';
import { Button, Field } from '@/shared/ui';

interface Props {
  isSleep: boolean;
  disabled?: boolean;
  loading?: boolean;
  onSubmit: (values: { isSleep: boolean }) => void;
}

/**
 * 수면·기상 전환. 앱에서 누른 것과 같은 경로라 지수 증감 스케줄도 함께 교체된다.
 * 알(Lv.0)·사망·졸업 상태에서는 서버가 거부하므로 버튼을 막는다.
 */
export function MongSleepForm({ isSleep, disabled, loading, onSubmit }: Props) {
  const next = !isSleep;

  return (
    <div className="flex items-end gap-3">
      <Field className="flex-1" label="수면 상태" hint={isSleep ? '증가 스케줄이 돌고 있다' : '감소·배변 스케줄이 돌고 있다'}>
        <div className="flex h-9 items-center gap-2 rounded-md border bg-surface px-3 text-sm">
          {isSleep ? <Moon className="size-4 text-primary" /> : <Sun className="size-4 text-warning" />}
          {isSleep ? '수면 중' : '기상'}
        </div>
      </Field>
      <Button variant="secondary" disabled={disabled} loading={loading} onClick={() => onSubmit({ isSleep: next })}>
        {next ? <Moon className="size-4" /> : <Sun className="size-4" />}
        {next ? '재우기' : '깨우기'}
      </Button>
    </div>
  );
}
