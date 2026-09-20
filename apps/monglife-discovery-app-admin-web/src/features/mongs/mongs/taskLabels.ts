import type { MongSchedulerTypeCode } from '../types';

/**
 * 서버 MongSchedulerType 과 1:1. 코드가 늘면 여기도 늘린다.
 *
 * <p>키는 enum 이름이 아니라 **하이픈 코드**다. 서버는 이름과 코드가 다른데(7종 중 4종)
 * 목록 응답이 주는 값도, 등록 요청이 받는 값도 코드 쪽이다. 예전에 이름을 키로 쓰는 바람에
 * 4종의 라벨이 안 뜨고 등록 모달의 중복 필터도 헛돌았다.
 *
 * <p>Record 의 키를 유니온으로 둔다 - 코드가 늘면 컴파일러가 누락을 잡는다.
 */
export const SCHEDULER_LABEL: Record<MongSchedulerTypeCode, string> = {
  'EGG-EVOLUTION': '알 부화',
  SLEEP: '수면 전환',
  WAKEUP: '기상 전환',
  'INCREASE-STATUS': '지수 증가 (수면 중)',
  'DECREASE-STATUS': '지수 감소 (기상 중)',
  'INCREASE-POOP': '배변 증가',
  DEAD: '사망',
};

/** 등록 모달이 고를 수 있는 타입과 그 주기 설명 */
export const SCHEDULER_OPTIONS: { code: MongSchedulerTypeCode; hint: string }[] = [
  { code: 'EGG-EVOLUTION', hint: '300초 뒤 한 번. 알이 부화 가능 상태가 된다' },
  { code: 'DECREASE-STATUS', hint: '900초마다 반복. 기상 중 지수가 깎인다' },
  { code: 'INCREASE-STATUS', hint: '900초마다 반복. 수면 중 지수가 회복된다' },
  { code: 'INCREASE-POOP', hint: '3600초마다 반복. 배변이 하나씩 는다' },
  { code: 'SLEEP', hint: '매일 몽의 수면 시각에 반복' },
  { code: 'WAKEUP', hint: '매일 몽의 기상 시각에 반복' },
  { code: 'DEAD', hint: '43200초(12시간) 뒤 한 번. 지수가 0인 채로 방치되면 죽는다' },
];

export const TASK_TYPE_LABEL: Record<string, string> = {
  FIX_TIME: '고정 시각 1회',
  FIX_TIME_CYCLE: '고정 시각 반복',
  NONE_FIX_TIME: '일정 시간 뒤 1회',
  NONE_FIX_TIME_CYCLE: '일정 시간 간격 반복',
};

export const TASK_STATE_LABEL: Record<string, string> = {
  PROCESSING: '동작 중',
  PAUSE: '일시중지',
  APP_STOP_PROCESSING: '앱 종료로 중지',
  APP_STOP_PAUSE: '앱 종료 (일시중지였음)',
};

export const TASK_STATE_TONE: Record<string, 'neutral' | 'primary' | 'success' | 'warning' | 'danger'> = {
  PROCESSING: 'success',
  PAUSE: 'warning',
  APP_STOP_PROCESSING: 'neutral',
  APP_STOP_PAUSE: 'neutral',
};
