import { Badge } from '@/shared/ui';
import type { MongStateCode, MongStatusCode } from '../../types';

const STATE_TONE: Record<MongStateCode, 'neutral' | 'primary' | 'success' | 'warning' | 'danger'> = {
  NORMAL: 'neutral',
  EVOLUTION_READY: 'primary',
  GRADUATE_READY: 'primary',
  GRADUATE: 'success',
  DEAD: 'danger',
};

const STATE_LABEL: Record<MongStateCode, string> = {
  NORMAL: '정상',
  EVOLUTION_READY: '진화 준비',
  GRADUATE_READY: '졸업 준비',
  GRADUATE: '졸업',
  DEAD: '사망',
};

const STATUS_TONE: Record<MongStatusCode, 'neutral' | 'warning' | 'danger'> = {
  NORMAL: 'neutral',
  HUNGRY: 'warning',
  SOMNOLENCE: 'warning',
  SICK: 'danger',
};

const STATUS_LABEL: Record<MongStatusCode, string> = {
  NORMAL: '정상',
  HUNGRY: '배고픔',
  SOMNOLENCE: '졸림',
  SICK: '아픔',
};

export const MongStateBadge = ({ code }: { code: MongStateCode }) => (
  <Badge tone={STATE_TONE[code] ?? 'neutral'}>{STATE_LABEL[code] ?? code}</Badge>
);

export const MongStatusBadge = ({ code }: { code: MongStatusCode }) => (
  <Badge tone={STATUS_TONE[code] ?? 'neutral'}>{STATUS_LABEL[code] ?? code}</Badge>
);
