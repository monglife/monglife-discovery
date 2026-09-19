import { http } from 'msw';
import { db } from '../data/db';
import type { NotifiableDevice, NotificationRequest } from '@/features/notifications/types';
import { fail, includes, latency, ok, paged, q } from './util';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const notificationHandlers = [
  http.get(`${BASE}/admin/notification/devices`, async ({ request }) => {
    await latency();
    const url = new URL(request.url);
    const needle = q(url);
    const accountId = url.searchParams.get('accountId');
    const deviceName = url.searchParams.get('deviceName');
    const items: NotifiableDevice[] = db.devices
      .filter((d): d is typeof d & { accountId: number } => !!d.fcmToken && !!d.accountId)
      .filter((d) => (!accountId || d.accountId === Number(accountId)) && (!deviceName || d.deviceName === deviceName))
      .map((d) => {
        const a = db.accounts.find((x) => x.accountId === d.accountId);
        return { ...d, accountEmail: a?.email, accountName: a?.name };
      })
      .filter((d) => !needle || includes(d.accountEmail, needle) || includes(d.accountName, needle) || includes(d.deviceName, needle));
    return paged(items, url);
  }),

  http.post(`${BASE}/admin/notification/mongs`, async ({ request }) => {
    await latency();
    const body = (await request.json()) as NotificationRequest;
    if (!db.accounts.some((a) => a.accountId === body.accountId)) return fail(404, 'NOT_EXISTS_ACCOUNT', '계정이 없습니다.');
    console.info('[mock] notification sent', body);
    return ok(null, '알림을 전송했습니다.');
  }),
];
