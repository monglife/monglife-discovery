import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { useAuth } from '@/shared/auth/useAuth';
import { ApiError } from '@/shared/api/client';
import { Button, Card, CardBody, Field, Input } from '@/shared/ui';
import { Logo } from '@/shared/components/Logo';

const emailSchema = z.object({ email: z.string().email('이메일 형식이 아닙니다.') });
type EmailForm = z.infer<typeof emailSchema>;

const CODE_LENGTH = 6;

function useCountdown(seconds: number, key: unknown) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    setLeft(seconds);
    if (seconds <= 0) return;
    const t = setInterval(() => setLeft((v) => (v <= 1 ? 0 : v - 1)), 1000);
    return () => clearInterval(t);
    // key 가 바뀔 때(재발송) 다시 시작
  }, [seconds, key]);
  return left;
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function LoginPage() {
  const { isAuthenticated, requestEmailCode, verifyEmailCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [issue, setIssue] = useState<{ expiresIn: number; resendAfter: number; at: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  const expiresLeft = useCountdown(issue?.expiresIn ?? 0, issue?.at);
  const resendLeft = useCountdown(issue?.resendAfter ?? 0, issue?.at);

  const form = useForm<EmailForm>({ resolver: zodResolver(emailSchema), defaultValues: { email: '' } });

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const sendCode = async (target: string) => {
    setError(null);
    setBusy(true);
    try {
      const res = await requestEmailCode(target);
      setEmail(target);
      if (res.skipVerify) {
        // 서버가 인증을 건너뛰는 환경(local/dev) — 코드 입력 없이 바로 로그인
        await verifyEmailCode(target, '0'.repeat(CODE_LENGTH));
        navigate(fromPath(), { replace: true });
        return;
      }
      setIssue({ ...res, at: Date.now() });
      setCode('');
      setStep('code');
    } catch (e) {
      setError(e instanceof Error ? e.message : '인증 코드를 보내지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const fromPath = () => (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  const verify = async (value: string) => {
    if (value.length !== CODE_LENGTH || busy) return;
    setError(null);
    setBusy(true);
    try {
      await verifyEmailCode(email, value);
      navigate(fromPath(), { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : '인증에 실패했습니다.');
      setCode('');
      if (e instanceof ApiError && e.status === 410) setIssue((i) => (i ? { ...i, expiresIn: 0 } : i));
      codeRef.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  const onCodeChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) void verify(digits);
  };

  return (
    <div className="flex h-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardBody className="space-y-5">
          <div className="flex items-center gap-2">
            <Logo className="size-12" />
            <div>
              <h1 className="text-base font-semibold">MongLife Admin</h1>
              <p className="text-xs text-muted-foreground">디스커버리 관리자</p>
            </div>
          </div>

          {step === 'email' ? (
            <form onSubmit={form.handleSubmit((v) => sendCode(v.email))} className="space-y-4">
              <Field label="관리자 이메일" error={form.formState.errors.email?.message}>
                <Input type="email" autoFocus autoComplete="email" placeholder="admin@monglife.cloud" {...form.register('email')} />
              </Field>
              {error && <p className="text-xs text-danger">{error}</p>}
              <Button type="submit" className="w-full" loading={busy}>
                인증 코드 받기
              </Button>
              <p className="rounded-md bg-surface-muted p-3 text-xs text-muted-foreground">
                관리자 권한이 있는 계정의 이메일로 6자리 인증 코드를 보냅니다.
              </p>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void verify(code);
              }}
              className="space-y-4"
            >
              <div className="flex items-start gap-2 rounded-md bg-primary-soft p-3 text-xs">
                <MailCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p>
                    <span className="font-medium">{email}</span> 로 인증 코드를 보냈습니다.
                  </p>
                  <button
                    type="button"
                    className="mt-0.5 text-primary hover:underline"
                    onClick={() => {
                      setStep('email');
                      setError(null);
                      form.setValue('email', email);
                    }}
                  >
                    이메일 변경
                  </button>
                </div>
              </div>

              <Field
                label="인증 코드"
                error={error ?? undefined}
                hint={expiresLeft > 0 ? `${mmss(expiresLeft)} 후 만료` : '코드가 만료되었습니다. 다시 받아 주세요.'}
              >
                <Input
                  ref={codeRef}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={CODE_LENGTH}
                  placeholder="000000"
                  className="text-center font-mono text-lg tracking-[0.5em]"
                  value={code}
                  disabled={busy || expiresLeft <= 0}
                  onChange={(e) => onCodeChange(e.target.value)}
                />
              </Field>

              <Button type="submit" className="w-full" loading={busy} disabled={code.length !== CODE_LENGTH || expiresLeft <= 0}>
                로그인
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={busy || resendLeft > 0}
                onClick={() => void sendCode(email)}
              >
                {resendLeft > 0 ? `${resendLeft}초 후 다시 보내기` : '인증 코드 다시 보내기'}
              </Button>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
