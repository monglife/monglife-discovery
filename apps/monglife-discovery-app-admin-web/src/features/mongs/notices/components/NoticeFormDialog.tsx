import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Notice } from '../../types';
import { Button, Dialog, Field, Input, Textarea } from '@/shared/ui';

const schema = z.object({
  title: z.string().min(1, '제목을 입력하세요.').max(255, '255자 이하로 입력하세요.'),
  content: z.string().min(1, '내용을 입력하세요.'),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  notice?: Notice;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
}

export function NoticeFormDialog({ open, notice, loading, onClose, onSubmit }: Props) {
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { title: '', content: '' } });

  // 같은 다이얼로그를 등록·수정에 함께 쓰므로 열릴 때마다 값을 다시 채운다
  useEffect(() => {
    if (open) form.reset({ title: notice?.title ?? '', content: notice?.content ?? '' });
  }, [open, notice, form]);

  const submit = form.handleSubmit((values) => onSubmit(values));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={notice ? '공지 사항 수정' : '공지 사항 등록'}
      description="앱의 공지 목록에 그대로 노출됩니다."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>취소</Button>
          <Button onClick={submit} loading={loading}>저장</Button>
        </>
      }
    >
      <form className="space-y-3" onSubmit={submit}>
        <Field label="제목" error={form.formState.errors.title?.message}>
          <Input {...form.register('title')} placeholder="공지 제목" />
        </Field>
        <Field label="내용" error={form.formState.errors.content?.message}>
          <Textarea rows={6} className="sm:min-h-56" {...form.register('content')} placeholder="공지 내용" />
        </Field>
      </form>
    </Dialog>
  );
}
