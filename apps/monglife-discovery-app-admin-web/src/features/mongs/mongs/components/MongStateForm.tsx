import { useEffect, useState } from 'react';
import type { MongStateCode } from '../../types';
import { Button, Field, Select } from '@/shared/ui';

const STATE_CODES: MongStateCode[] = ['NORMAL', 'EVOLUTION_READY', 'GRADUATE_READY', 'GRADUATE', 'DEAD'];

interface Props {
  current: MongStateCode;
  loading?: boolean;
  onSubmit: (values: { stateCode: MongStateCode }) => void;
}

/**
 * 상태 변경. 재화 카드와 같은 모양이다 - 위에 입력, 아래 구분선 + 적용 버튼.
 *
 * <p>버튼을 danger 로 두지 않는다. 여기서 바로 반영되지 않고 확인 모달이 한 번 더 뜬다.
 */
export function MongStateForm({ current, loading, onSubmit }: Props) {
  const [stateCode, setStateCode] = useState<MongStateCode>(current);

  // 서버 값이 갱신되면 선택을 다시 맞춘다
  useEffect(() => setStateCode(current), [current]);

  const changed = stateCode !== current;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3">
        <Field label="상태 코드" hint="도메인 규칙을 우회하는 운영 조치다. DEAD 복구도 여기서 한다.">
          <Select value={stateCode} onChange={(e) => setStateCode(e.target.value as MongStateCode)}>
            {STATE_CODES.map((code) => (
              <option key={code} value={code}>{code}{code === current ? ' (현재)' : ''}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {changed ? `${current} → ${stateCode}` : '변경된 항목 없음'}
        </span>
        <Button loading={loading} disabled={!changed} onClick={() => onSubmit({ stateCode })}>적용</Button>
      </div>
    </div>
  );
}
