import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { useErrorReport, useReplyErrorReport } from '../queries';
import { StatusBadge } from './ErrorReportListPage';
import { Button, Card, CardBody, CardHeader, CardTitle, Dialog, Field, PageHeader, Textarea } from '@/shared/ui';
import { formatDateTime } from '@/shared/lib/format';

const schema = z.object({ content: z.string().min(1, '답변 내용을 입력하세요.').max(2000) });
type FormValues = z.infer<typeof schema>;

export function ErrorReportDetailPage() {
  const id = Number(useParams().reportId);
  const { data: r, isLoading } = useErrorReport(id);
  const reply = useReplyErrorReport(id);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [logsOpen, setLogsOpen] = useState(false);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { content: '' } });

  if (isLoading) return <div className="h-40 animate-pulse rounded bg-surface-muted" />;
  if (!r) return <p className="text-sm text-muted-foreground">신고를 찾을 수 없습니다.</p>;

  const doSend = () => {
    if (!confirm) return;
    reply.mutate(confirm, {
      onSuccess: (res) => {
        setConfirm(null);
        setSent(`${res.sentTo} 로 답변을 발송했습니다.`);
        form.reset({ content: '' });
      },
    });
  };

  return (
    <>
      <Link to="/error-reports" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> 오류 신고 목록
      </Link>
      <PageHeader title={r.title} description={`#${r.reportId} · ${formatDateTime(r.createdAt)}`} actions={<StatusBadge status={r.status} />} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>신고 내용</CardTitle></CardHeader>
            <CardBody>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.content}</p>
            </CardBody>
          </Card>

          {/*
            진단 로그. 기본으로 접어 둔다 - 수백 줄이라 펼쳐 두면 답변 작성 칸이 화면 밖으로 밀린다.
            구버전 앱이 보낸 신고에는 없다.
          */}
          {r.logs && (
            <Card>
              <CardHeader>
                <CardTitle>진단 로그</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => setLogsOpen((v) => !v)}>
                  {logsOpen ? '접기' : `펼치기 (${r.logs.split('\n').length}줄)`}
                </Button>
              </CardHeader>
              {logsOpen && (
                <CardBody>
                  {/* 로그는 자동 줄바꿈하지 않는다. 한 줄이 한 사건이라 접히면 오히려 읽기 어렵다. */}
                  <pre className="max-h-96 overflow-auto rounded-md bg-surface-muted p-3 font-mono text-[11px] leading-relaxed">
                    {r.logs}
                  </pre>
                </CardBody>
              )}
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>답변</CardTitle></CardHeader>
            {!r.reply ? (
              <CardBody><p className="text-sm text-muted-foreground">아직 답변이 없습니다.</p></CardBody>
            ) : (
              <CardBody>
                <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="size-3.5" /> {r.reply.sentTo} · {formatDateTime(r.reply.createdAt)}
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.reply.content}</p>
              </CardBody>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{r.reply ? '재답변' : '답변 작성'}</CardTitle>
              <span className="text-xs text-muted-foreground">{r.email} 로 이메일 발송{r.reply && ' · 기존 답변을 덮어씁니다'}</span>
            </CardHeader>
            <CardBody>
              <form onSubmit={form.handleSubmit((v) => { setSent(null); setConfirm(v.content); })} className="space-y-3">
                <Field label="내용" error={form.formState.errors.content?.message}>
                  <Textarea className="min-h-40" placeholder="사용자에게 보낼 답변을 입력하세요" {...form.register('content')} />
                </Field>
                {sent && <p className="text-xs text-success">{sent}</p>}
                <div className="flex justify-end">
                  <Button type="submit"><Send className="size-4" /> 답변 전송</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        <Card className="self-start">
          <CardHeader><CardTitle>신고자 정보</CardTitle></CardHeader>
          <CardBody>
            <dl className="space-y-3 text-sm">
              <Row label="계정"><Link className="text-primary hover:underline" to={`/accounts/${r.accountId}`}>{r.email}</Link></Row>
              <Row label="이름">{r.name}</Row>
              <Row label="기기">{r.deviceName}</Row>
              <Row label="기기 ID"><span className="font-mono text-xs">{r.deviceId}</span></Row>
              <Row label="앱">{r.appPackageName}</Row>
              <Row label="버전">{r.buildVersion}</Row>
            </dl>
          </CardBody>
        </Card>
      </div>

      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="답변을 전송할까요?"
        description={`${r.email} 로 이메일이 발송됩니다`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)} disabled={reply.isPending}>취소</Button>
            <Button onClick={doSend} loading={reply.isPending}><Send className="size-4" /> 전송</Button>
          </>
        }
      >
        <div className="rounded-md border bg-surface-muted p-3 text-sm">
          <p className="mb-1 text-xs text-muted-foreground">Re: {r.title}</p>
          <p className="whitespace-pre-wrap">{confirm}</p>
        </div>
      </Dialog>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right">{children}</dd>
    </div>
  );
}
