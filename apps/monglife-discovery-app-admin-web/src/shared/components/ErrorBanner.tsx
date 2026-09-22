import { cn } from '@/shared/lib/cn';

/**
 * 폼·다이얼로그 안에서 실패 사유를 보여 주는 배너.
 *
 * 같은 한 줄이 미션·마스터·스케줄 화면에 흩어져 복사돼 있었다. 문구 자리가 아니라
 * 문구를 감싸는 모양이 흩어진 것이라, 한쪽만 고치면 화면마다 다르게 보인다.
 *
 * message 가 비면 아무것도 그리지 않는다. 호출부마다 `{error && ...}` 를 쓰지 않게 하려는 것이다.
 */
export function ErrorBanner({ message, className }: { message?: string | null; className?: string }) {
  if (!message) return null;

  return <p className={cn('rounded-md bg-danger-soft p-3 text-xs text-danger', className)}>{message}</p>;
}
