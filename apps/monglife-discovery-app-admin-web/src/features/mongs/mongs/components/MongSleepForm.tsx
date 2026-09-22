import { useEffect, useState } from 'react';
import { Button, Field, Select } from '@/shared/ui';

interface Props {
  isSleep: boolean;
  disabled?: boolean;
  loading?: boolean;
  onSubmit: (values: { isSleep: boolean }) => void;
}

/**
 * 수면·기상 전환. 재화 카드와 같은 모양이다 - 위에 셀렉트, 아래 구분선 + 적용 버튼.
 *
 * <p>앱에서 누른 것과 같은 경로라 지수 증감 스케줄도 함께 교체된다.
 * 알(Lv.0)·사망·졸업 상태에서는 서버가 거부하므로 입력을 막는다.
 */
export function MongSleepForm({ isSleep, disabled, loading, onSubmit }: Props) {
  const [next, setNext] = useState(isSleep);

  // 서버 값이 갱신되면 선택을 다시 맞춘다
  useEffect(() => setNext(isSleep), [isSleep]);

  const changed = next !== isSleep;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3">
        <Field
          label="수면 상태"
          hint={
            disabled
              ? '알·사망·졸업 상태에서는 서버가 전환을 받지 않는다.'
              : isSleep
                ? '지금은 증가 스케줄이 돌고 있다.'
                : '지금은 감소·배변 스케줄이 돌고 있다.'
          }
        >
          <Select
            value={next ? 'SLEEP' : 'AWAKE'}
            disabled={disabled}
            onChange={(e) => setNext(e.target.value === 'SLEEP')}
          >
            <option value="AWAKE">기상{!isSleep ? ' (현재)' : ''}</option>
            <option value="SLEEP">수면 중{isSleep ? ' (현재)' : ''}</option>
          </Select>
        </Field>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {changed ? (next ? '기상 → 수면 중' : '수면 중 → 기상') : '변경된 항목 없음'}
        </span>
        <Button loading={loading} disabled={disabled || !changed} onClick={() => onSubmit({ isSleep: next })}>적용</Button>
      </div>
    </div>
  );
}
