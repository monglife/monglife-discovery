/**
 * 인메모리 fixture. 핸들러가 이 배열을 직접 변경하므로 새로고침 전까지 상태가 유지된다.
 * 실 백엔드가 생기면 mocks/ 전체를 지우면 된다.
 */
import type { Account, LoginHistory, Platform } from '@/features/accounts/types';
import type { Device } from '@/features/devices/types';
import type { Token } from '@/features/sessions/types';
import type { AppVersion } from '@/features/app-versions/types';
import type { Maintenance } from '@/features/maintenance/types';

// 결정적 의사난수 — 새로고침해도 같은 데이터
let seed = 42;
export function rand() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

const DAY = 86_400_000;
const now = Date.now();
const iso = (ms: number) => new Date(ms).toISOString();
const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10);

const NAMES = ['김몽', '이라이프', '박디스', '최커버리', '정유레카', '한게이트', '오웨이', '윤카프카', '장레디스', '임마이'];
const DEVICES = ['Galaxy S24', 'Galaxy S23', 'Galaxy A54', 'iPhone 15 Pro', 'iPhone 14', 'iPhone 13 mini', 'Pixel 8'];
const PACKAGES = ['com.monglife.app', 'com.monglife.app.dev'];
const VERSIONS = ['1.0.0', '1.1.0', '1.2.0', '1.2.1', '1.3.0'];

export const accounts: Account[] = Array.from({ length: 137 }, (_, i) => {
  const id = i + 1;
  const created = now - Math.floor(rand() * 180) * DAY - Math.floor(rand() * DAY);
  const platform: Platform | null = rand() < 0.7 ? pick<Platform>(['kakao', 'apple', 'google']) : null;
  const social = platform ? `${platform}_${100000 + id}` : null;
  return {
    accountId: id,
    socialAccountId: social,
    platform,
    email: id === 1 ? 'admin@monglife.cloud' : `user${id}@example.com`,
    name: id === 1 ? '관리자' : `${pick(NAMES)}${id}`,
    role: id === 1 ? 'ADMIN' : 'NORMAL',
    isDeleted: id !== 1 && rand() < 0.08,
    createdAt: iso(created),
    updatedAt: iso(created + Math.floor(rand() * 30) * DAY),
  };
});
// 최근 2주 가입자를 몰아 넣어 가입 추이가 보이게 한다 (마지막 6개는 오늘)
accounts.slice(-40, -6).forEach((a) => {
  a.createdAt = iso(now - Math.floor(rand() * 14) * DAY - Math.floor(rand() * DAY));
  a.updatedAt = a.createdAt;
});
accounts.slice(-6).forEach((a) => {
  a.createdAt = iso(now - Math.floor(rand() * 8) * 3_600_000);
  a.updatedAt = a.createdAt;
});

export const devices: Device[] = [];
accounts.forEach((a) => {
  const n = rand() < 0.15 ? 2 : 1;
  for (let k = 0; k < n; k++) {
    const idx = devices.length + 1;
    devices.push({
      deviceId: `dev-${String(idx).padStart(4, '0')}-${Math.floor(rand() * 1e8).toString(16)}`,
      deviceName: pick(DEVICES),
      fcmToken: rand() < 0.8 ? `fcm_${Math.floor(rand() * 1e12).toString(36)}${Math.floor(rand() * 1e12).toString(36)}` : null,
      accountId: a.isDeleted ? null : a.accountId,
      createdAt: iso(new Date(a.createdAt).getTime() + Math.floor(rand() * 3 * DAY)),
    });
  }
});
// 미연결 기기(비회원)
for (let i = 0; i < 12; i++) {
  const idx = devices.length + 1;
  devices.push({
    deviceId: `dev-${String(idx).padStart(4, '0')}-${Math.floor(rand() * 1e8).toString(16)}`,
    deviceName: pick(DEVICES),
    fcmToken: rand() < 0.5 ? `fcm_${Math.floor(rand() * 1e12).toString(36)}${Math.floor(rand() * 1e12).toString(36)}` : null,
    accountId: null,
    createdAt: iso(now - Math.floor(rand() * 60) * DAY),
  });
}

export const loginHistories: LoginHistory[] = [];
let logId = 1;
devices
  .filter((d) => d.accountId)
  .forEach((d) => {
    const days = 1 + Math.floor(rand() * 20);
    for (let k = 0; k < days; k++) {
      loginHistories.push({
        accountLogId: logId++,
        accountId: d.accountId!,
        deviceId: d.deviceId,
        appPackageName: PACKAGES[0],
        deviceName: d.deviceName,
        buildVersion: pick(VERSIONS),
        loginAt: ymd(now - Math.floor(rand() * 30) * DAY),
        loginCount: 1 + Math.floor(rand() * 5),
      });
    }
  });

export const tokens: Token[] = devices
  .filter((d) => d.accountId && rand() < 0.45)
  .map((d) => {
    const created = now - Math.floor(rand() * 5 * DAY);
    return {
      refreshToken: `rt_${Math.floor(rand() * 1e15).toString(36)}${Math.floor(rand() * 1e15).toString(36)}`,
      accessToken: `at_${Math.floor(rand() * 1e15).toString(36)}${Math.floor(rand() * 1e15).toString(36)}`,
      deviceId: d.deviceId,
      accountId: d.accountId!,
      appPackageName: PACKAGES[0],
      buildVersion: pick(VERSIONS),
      createdAt: iso(created),
      expiration: Math.floor((created + 14 * DAY - now) / 1000),
    };
  });

export const appVersions: AppVersion[] = [];
let avId = 1;
PACKAGES.forEach((p) =>
  VERSIONS.forEach((v, i) =>
    appVersions.push({
      appVersionId: avId++,
      appPackageName: p,
      buildVersion: v,
      mustUpdate: i < 2,
      createdAt: iso(now - (VERSIONS.length - i) * 30 * DAY),
      updatedAt: iso(now - (VERSIONS.length - i) * 30 * DAY + Math.floor(rand() * 20) * DAY),
    }),
  ),
);

/**
 * 점검 일정.
 *
 * 서버는 시간대 없는 LocalDateTime 문자열을 준다. iso() 는 UTC('Z') 로 만들어 9시간
 * 어긋나므로 여기서는 로컬 벽시계 문자열을 쓴다 - 화면의 시간대 처리를 목에서도 그대로 본다.
 */
const localIso = (ms: number) => {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const HOUR = 3_600_000;

export const maintenances: Maintenance[] = [
  // 진행 중
  {
    maintenanceId: 3,
    message: '서버 점검 중입니다. 잠시 후 다시 이용해 주세요.',
    startAt: localIso(now - HOUR),
    endAt: localIso(now + 2 * HOUR),
    enabled: true,
    active: true,
    createdAt: localIso(now - 2 * DAY),
    updatedAt: localIso(now - 2 * DAY),
  },
  // 예정
  {
    maintenanceId: 2,
    message: '정기 점검이 예정되어 있습니다.',
    startAt: localIso(now + 3 * DAY),
    endAt: localIso(now + 3 * DAY + 2 * HOUR),
    enabled: true,
    active: false,
    createdAt: localIso(now - DAY),
    updatedAt: localIso(now - DAY),
  },
  // 종료
  {
    maintenanceId: 1,
    message: '긴급 점검을 진행했습니다.',
    startAt: localIso(now - 10 * DAY),
    endAt: localIso(now - 10 * DAY + HOUR),
    enabled: true,
    active: false,
    createdAt: localIso(now - 11 * DAY),
    updatedAt: localIso(now - 10 * DAY),
  },
];

export const db = { accounts, devices, loginHistories, tokens, appVersions, maintenances };
