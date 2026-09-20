import { http } from 'msw';
import { db } from '../data/db';
import type { SaveMaintenance } from '@/features/maintenance/types';
import { fail, latency, ok } from './util';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

const localIso = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** 서버(MaintenanceEntity.isActive)와 같은 판정. 끝은 열린 구간이다 */
const isActive = (m: { enabled: boolean; startAt: string; endAt: string | null }, now = Date.now()) =>
  m.enabled && new Date(m.startAt).getTime() <= now && (m.endAt === null || new Date(m.endAt).getTime() > now);

/** 목록을 읽을 때마다 active 를 다시 계산한다. 서버가 조회 시점에 계산해 주는 값이라서다 */
const withActive = <T extends { enabled: boolean; startAt: string; endAt: string | null; active: boolean }>(m: T) => {
  m.active = isActive(m);
  return m;
};

const invalidPeriod = (body: SaveMaintenance) => body.endAt !== null && body.endAt <= body.startAt;

export const maintenanceHandlers = [
  http.get(`${BASE}/admin/maintenances`, async () => {
    await latency();
    return ok(db.maintenances.map(withActive));
  }),

  http.get(`${BASE}/admin/maintenances/current`, async () => {
    await latency();
    return ok(db.maintenances.map(withActive).find((m) => m.active) ?? null);
  }),

  http.post(`${BASE}/admin/maintenances`, async ({ request }) => {
    await latency();
    const body = (await request.json()) as SaveMaintenance;
    if (invalidPeriod(body)) return fail(400, 'DISCOVERY-DEVICE-104', '점검 종료 시각은 시작 시각보다 뒤여야 합니다.');
    const ts = localIso(new Date());
    const created = {
      maintenanceId: Math.max(0, ...db.maintenances.map((m) => m.maintenanceId)) + 1,
      ...body,
      active: isActive(body),
      createdAt: ts,
      updatedAt: ts,
    };
    db.maintenances.unshift(created);
    return ok(created);
  }),

  http.put(`${BASE}/admin/maintenances/:id`, async ({ params, request }) => {
    await latency();
    const m = db.maintenances.find((x) => x.maintenanceId === Number(params.id));
    if (!m) return fail(404, 'DISCOVERY-DEVICE-103', '점검 일정이 존재하지 않습니다.');
    const body = (await request.json()) as SaveMaintenance;
    if (invalidPeriod(body)) return fail(400, 'DISCOVERY-DEVICE-104', '점검 종료 시각은 시작 시각보다 뒤여야 합니다.');
    Object.assign(m, body, { updatedAt: localIso(new Date()) });
    return ok(withActive(m));
  }),

  http.patch(`${BASE}/admin/maintenances/:id`, async ({ params, request }) => {
    await latency();
    const m = db.maintenances.find((x) => x.maintenanceId === Number(params.id));
    if (!m) return fail(404, 'DISCOVERY-DEVICE-103', '점검 일정이 존재하지 않습니다.');
    const { enabled } = (await request.json()) as { enabled: boolean };
    m.enabled = enabled;
    m.updatedAt = localIso(new Date());
    return ok(withActive(m));
  }),

  http.delete(`${BASE}/admin/maintenances/:id`, async ({ params }) => {
    await latency();
    const i = db.maintenances.findIndex((x) => x.maintenanceId === Number(params.id));
    if (i < 0) return fail(404, 'DISCOVERY-DEVICE-103', '점검 일정이 존재하지 않습니다.');
    db.maintenances.splice(i, 1);
    return ok(null);
  }),
];
