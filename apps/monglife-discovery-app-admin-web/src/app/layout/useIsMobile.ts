import { useEffect, useState } from 'react';

/** Tailwind `sm` 미만(640px)이면 모바일로 본다. DataTable 의 카드 전환 기준과 같다 */
const QUERY = '(max-width: 639px)';

export function useIsMobile() {
  const [mobile, setMobile] = useState(() => (typeof window === 'undefined' ? false : window.matchMedia(QUERY).matches));
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mobile;
}
