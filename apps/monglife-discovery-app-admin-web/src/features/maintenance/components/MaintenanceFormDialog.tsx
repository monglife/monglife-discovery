import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Maintenance, SaveMaintenance } from '../types';
import { nowForInput, toInputDateTime, toServerDateTime } from '../datetime';
import { Button, Dialog, Field, Input, Switch, Textarea } from '@/shared/ui';
import { ErrorBanner } from '@/shared/components/ErrorBanner';

const schema = z
  .object({
    message: z.string().trim().min(1, '안내 문구를 입력하세요.').max(200, '200자까지 쓸 수 있습니다.'),
    startAt: z.string().min(1, '시작 시각을 입력하세요.'),
    endAt: z.string(),
    enabled: z.boolean(),
  })
  // 서버도 같은 것을 보고 400 을 내리지만, 여기서 막아야 왜 안 되는지가 그 자리에 보인다
  .refine((v) => !v.endAt || v.endAt > v.startAt, {
    path: ['endAt'],
    message: '종료는 시작보다 뒤여야 합니다.',
  });

type FormValues = z.infer<typeof schema>;

interface MaintenanceFormDialogProps {
  open: boolean;
  /** 주면 수정, 없으면 등록 */
  maintenance?: Maintenance | null;
  pending?: boolean;
  error?: string;
  onSubmit: (body: SaveMaintenance) => void;
  onClose: () => void;
}

export function MaintenanceFormDialog({ open, maintenance, pending, error, onSubmit, onClose }: MaintenanceFormDialogProps) {
  const editing = !!maintenance;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { message: '', startAt: nowForInput(), endAt: '', enabled: true },
  });

  // 같은 다이얼로그를 등록·수정에 돌려 쓰므로 열 때마다 값을 다시 채운다
  useEffect(() => {
    if (!open) return;
    form.reset(
      maintenance
        ? {
            message: maintenance.message,
            startAt: toInputDateTime(maintenance.startAt),
            endAt: toInputDateTime(maintenance.endAt),
            enabled: maintenance.enabled,
          }
        : { message: '', startAt: nowForInput(), endAt: '', enabled: true },
    );
    // form 은 매 렌더 새 객체가 아니지만 의존성에 넣으면 reset 이 반복된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, maintenance]);

  const submit = form.handleSubmit((values) =>
    onSubmit({
      message: values.message.trim(),
      startAt: toServerDateTime(values.startAt),
      endAt: values.endAt ? toServerDateTime(values.endAt) : null,
      enabled: values.enabled,
    }),
  );

  const enabled = form.watch('enabled');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? '점검 일정 수정' : '점검 일정 등록'}
      description="시작 시각이 되면 저절로 켜집니다. 손으로 켜 줄 필요는 없습니다."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button type="submit" form="maintenance-form" loading={pending}>{editing ? '저장' : '등록'}</Button>
        </>
      }
    >
      <form id="maintenance-form" onSubmit={submit} className="space-y-4">
        <Field label="안내 문구" error={form.formState.errors.message?.message} hint="앱 점검 화면에 그대로 보입니다.">
          <Textarea rows={2} placeholder="서버 점검 중입니다. 잠시 후 다시 이용해 주세요." {...form.register('message')} />
        </Field>
        <Field label="시작" error={form.formState.errors.startAt?.message}>
          <Input type="datetime-local" {...form.register('startAt')} />
        </Field>
        <Field label="종료" error={form.formState.errors.endAt?.message} hint="비우면 종료 미정 — 끌 때까지 계속 점검 중입니다.">
          <Input type="datetime-local" {...form.register('endAt')} />
        </Field>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">사용</p>
            <p className="text-xs text-muted-foreground">끄면 시간이 되어도 점검이 걸리지 않습니다.</p>
          </div>
          <Switch checked={enabled} label="사용" onCheckedChange={(v) => form.setValue('enabled', v, { shouldDirty: true })} />
        </div>
        <ErrorBanner message={error} />
      </form>
    </Dialog>
  );
}
