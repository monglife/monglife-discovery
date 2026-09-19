import { LogOut, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/shared/auth/useAuth';
import { Button } from '@/shared/ui';

function useTheme() {
  // 기본값 라이트. 저장된 선택이 있으면 그것을 따른다 (index.html 의 인라인 스크립트와 같은 규칙)
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem('monglife.admin.theme') === 'dark';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('monglife.admin.theme', dark ? 'dark' : 'light');
    } catch {
      /* noop */
    }
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}

export function Header() {
  const { logout } = useAuth();
  const { dark, toggle } = useTheme();
  const usingMock = import.meta.env.VITE_ENABLE_MSW !== 'false';

  return (
    <header className="flex h-14 items-center justify-between border-b bg-surface px-4 sm:px-6">
      <div className="text-xs text-muted-foreground">
        {usingMock && <span className="rounded-full bg-warning/20 px-2 py-0.5 text-warning">MOCK API</span>}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={toggle} aria-label="테마 전환">
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => void logout()} aria-label="로그아웃" title="로그아웃">
          <LogOut className="size-4" />
          <span className="hidden sm:inline">로그아웃</span>
        </Button>
      </div>
    </header>
  );
}
