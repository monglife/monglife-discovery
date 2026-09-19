import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Field, Input } from '@/shared/ui';
import { formatNumber } from '@/shared/lib/format';

const schema = z.object({
  delta: z.coerce.number().int('정수로 입력하세요.').refine((v) => v !== 0, '0 은 변화가 없습니다.'),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  current: number;
  loading?: boolean;
  onSubmit: (values: { delta: number }) => void;
}

export function StarPointForm({ current, loading, onSubmit }: Props) {
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { delta: 0 } });
  const delta = form.watch('delta');
  const after = current + (Number.isFinite(Number(delta)) ? Number(delta) : 0);

  return (
    <form
      className="flex h-full flex-col"
      onSubmit={form.handleSubmit((values) => {
        onSubmit({ delta: values.delta });
        form.reset({ delta: 0 });
      })}
    >
      <div className="flex-1 space-y-3">
        <Field label="가감할 스타 포인트" error={form.formState.errors.delta?.message} hint="음수면 차감. 0 아래로는 내려가지 않는다.">
          <Input type="number" {...form.register('delta')} />
        </Field>
      </div>
      <div className="mt-4 flex items-center justify-between border-t pt-4">
        <span className="text-xs text-muted-foreground">
          {formatNumber(current)} → <span className={after < 0 ? 'text-danger' : 'text-foreground'}>{formatNumber(after)}</span>
        </span>
        <Button type="submit" loading={loading} disabled={after < 0}>적용</Button>
      </div>
    </form>
  );
}
