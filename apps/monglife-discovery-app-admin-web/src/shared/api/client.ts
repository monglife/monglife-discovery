import { tokenStorage } from '@/shared/auth/tokenStorage';
import type { Page, PageResponseDto, ResponseDto } from './types';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');
/**
 * mongs(게임) 관리 API 는 게이트웨이를 거친다. 토큰 검증·패스포트 발급이 거기에 있고,
 * mongs 는 패스포트의 role 로 /admin/** 을 막는다.
 * 운영은 인그레스가 같은 출처로 묶어 주어 common-api 와 값이 같다(`/api`).
 */
const GATEWAY_BASE_URL = (import.meta.env.VITE_GATEWAY_BASE_URL ?? BASE_URL).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type Query = { [key: string]: string | number | boolean | undefined | null };

interface RequestOptions {
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Query, baseUrl: string = BASE_URL) {
  const url = new URL(baseUrl + path, window.location.origin);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

/**
 * fetch 자체가 실패하면(서버 다운, 프록시 대상 없음, CORS 거부) 브라우저는 "Failed to fetch" 만 준다.
 * 어느 주소로 갔는지 붙여서 원인을 좁힐 수 있게 한다.
 */
async function doFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    throw new ApiError(0, 'NETWORK', `서버에 연결할 수 없습니다 (${url}) — ${reason}. 백엔드 실행 여부·프록시 대상·CORS 허용 출처를 확인하세요.`);
  }
}

/** 응답 본문을 JSON 으로. HTML(프록시 502, 옛 서버의 404 페이지 등)이면 상태 코드와 함께 알린다 */
async function parseJson<T>(res: Response): Promise<T | undefined> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(res.status, 'NON_JSON', `서버가 JSON 이 아닌 응답을 보냈습니다 (HTTP ${res.status}, ${res.url}). 백엔드 주소·버전(관리자 API 포함 여부)을 확인하세요.`);
  }
}

function forceLogin(): never {
  tokenStorage.clear();
  if (window.location.pathname !== '/login') window.location.assign('/login');
  throw new ApiError(401, 'UNAUTHORIZED', '세션이 만료되었습니다. 다시 로그인하세요.');
}

interface ReissueResult {
  accessToken: string;
  refreshToken: string;
}

/**
 * 액세스 토큰 만료(401) 시 /public/auth/reissue 로 한 번 재발급한다.
 * 동시에 여러 요청이 401 을 받아도 재발급은 한 번만 하도록 진행 중인 Promise 를 공유한다.
 * 재발급도 실패하면(리프레시 만료 등) 토큰을 지우고 로그인으로 보낸다.
 */
let reissueInFlight: Promise<string> | null = null;

function reissue(): Promise<string> {
  if (reissueInFlight) return reissueInFlight;
  const accessToken = tokenStorage.getAccessToken();
  const refreshToken = tokenStorage.getRefreshToken();
  if (!accessToken || !refreshToken) forceLogin();

  reissueInFlight = (async () => {
    try {
      const res = await doFetch(buildUrl('/public/auth/reissue'), {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, refreshToken }),
      });
      const json = await parseJson<ResponseDto<ReissueResult>>(res);
      if (!res.ok || !json?.result?.accessToken) forceLogin();
      tokenStorage.set(json.result.accessToken, json.result.refreshToken);
      return json.result.accessToken;
    } finally {
      reissueInFlight = null;
    }
  })();
  return reissueInFlight;
}

/** 401 이면 재발급 후 같은 요청을 한 번 더 보낸다. 재시도도 401 이면 로그인으로 */
async function fetchWithReissue(url: string, init: RequestInit & { headers: Record<string, string> }): Promise<Response> {
  const res = await doFetch(url, init);
  if (res.status !== 401) return res;
  const accessToken = await reissue();
  const retried = await doFetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${accessToken}` } });
  if (retried.status === 401) forceLogin();
  return retried;
}

async function request<T>(method: string, path: string, opts: RequestOptions = {}, baseUrl: string = BASE_URL): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const accessToken = tokenStorage.getAccessToken();
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetchWithReissue(buildUrl(path, opts.query, baseUrl), {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: opts.signal,
  });

  const json = await parseJson<ResponseDto<T>>(res);

  if (!res.ok) {
    throw new ApiError(res.status, json?.code ?? String(res.status), json?.message ?? `HTTP ${res.status} ${res.statusText}`);
  }
  return json?.result as T;
}

/** PageResponseDto 를 Page<T> 로 변환. total 은 X-Total-Count 헤더가 있으면 그 값을 쓴다. */
async function requestPage<T>(path: string, query?: Query, baseUrl: string = BASE_URL): Promise<Page<T>> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const accessToken = tokenStorage.getAccessToken();
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetchWithReissue(buildUrl(path, query, baseUrl), { headers });
  const json = await parseJson<PageResponseDto<T[]>>(res);
  if (!res.ok || !json) throw new ApiError(res.status, json?.code ?? String(res.status), json?.message ?? `HTTP ${res.status} ${res.statusText}`);
  // 백엔드는 X-Total-Count 헤더에 정확한 건수를 준다. 없으면 totalPage 로 근사한다.
  const header = res.headers.get('X-Total-Count');
  const total = header !== null ? Number(header) : (json.totalPage ?? 0) * json.size;
  return { items: json.result, page: json.page, size: json.size, total };
}

function createApi(baseUrl: string) {
  return {
    get: <T>(path: string, query?: Query) => request<T>('GET', path, { query }, baseUrl),
    getPage: <T>(path: string, query?: Query) => requestPage<T>(path, query, baseUrl),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }, baseUrl),
    put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }, baseUrl),
    patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }, baseUrl),
    delete: <T>(path: string, body?: unknown) => request<T>('DELETE', path, { body }, baseUrl),
  };
}

/** common-api(/api/admin/**) */
export const api = createApi(BASE_URL);

/** 게이트웨이 경유 mongs 관리 API (/api/character/admin/**, /api/user/admin/**) */
export const mongsApi = createApi(GATEWAY_BASE_URL);
