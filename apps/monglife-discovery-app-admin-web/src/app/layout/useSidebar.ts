import { useCallback, useEffect, useState } from 'react';
import { useIsMobile } from './useIsMobile';

const KEY = 'monglife.admin.sidebar';

/** 사이드바 접힘 상태. 새로고침해도 유지. 모바일에서는 항상 접힘 (저장값은 건드리지 않는다) */
export function useSidebar() {
  const mobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(KEY) === 'collapsed';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(KEY, collapsed ? 'collapsed' : 'expanded');
    } catch {
      /* noop */
    }
  }, [collapsed]);
  const toggle = useCallback(() => setCollapsed((c) => !c), []);
  return { collapsed: mobile || collapsed, toggle, mobile };
}
