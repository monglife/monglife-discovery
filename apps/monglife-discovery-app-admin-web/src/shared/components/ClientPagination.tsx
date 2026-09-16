import { useEffect, useMemo, useState } from 'react';

/**
 * 서버가 목록을 통째로 주는 화면(스케줄·대기열처럼 건수가 적은 것)의 클라이언트 페이지네이션.
 * 목록이 짧아져 현재 페이지가 비면 마지막 페이지로 당긴다.
 */
export function useClientPage<T>(rows: T[] | undefined, size: number) {
  const [page, setPage] = useState(0);
  const total = rows?.length ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / size) - 1);

  useEffect(() => {
    if (page > lastPage) setPage(lastPage);
  }, [page, lastPage]);

  const items = useMemo(() => (rows ?? []).slice(page * size, page * size + size), [rows, page, size]);

  return { items, page, size, total, setPage };
}
