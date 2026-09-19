import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NAV, isSection, type NavGroup, type NavItem, type NavSection } from '@/app/nav';
import { cn } from '@/shared/lib/cn';
import { Logo } from '@/shared/components/Logo';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  /** 모바일이면 접힘 고정. 펼치기 버튼 대신 로고를 보여준다 */
  mobile?: boolean;
}

function Item({ item, collapsed, nested }: { item: NavItem; collapsed: boolean; nested?: boolean }) {
  return (
    <li>
      <NavLink
        to={item.to}
        end={item.end}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-2.5 rounded-md text-sm transition-colors',
            collapsed ? 'justify-center px-0 py-2.5' : nested ? 'py-2 pr-2.5 pl-3.5' : 'px-2.5 py-2',
            isActive ? 'bg-sidebar-active text-white' : 'hover:bg-sidebar-active/60 hover:text-white',
          )
        }
      >
        <item.icon className="size-4 shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </NavLink>
    </li>
  );
}

function Group({ group, collapsed, nested }: { group: NavGroup; collapsed: boolean; nested?: boolean }) {
  return (
    <div>
      {collapsed ? (
        <div className="mx-2 mb-2 border-t border-white/10" />
      ) : (
        <p className={cn('mb-1.5 text-[11px] font-medium tracking-wide uppercase opacity-60', nested ? 'px-3.5' : 'px-2')}>
          {group.title}
        </p>
      )}
      <ul className="space-y-0.5">
        {group.items.map((item) => (
          <Item key={item.to} item={item} collapsed={collapsed} nested={nested} />
        ))}
      </ul>
    </div>
  );
}

/** 대메뉴. 하위 경로에 있으면 자동으로 펼쳐지고, 그 뒤로는 사용자가 접었다 펼 수 있다 */
function Section({ section, collapsed }: { section: NavSection; collapsed: boolean }) {
  const { pathname } = useLocation();
  const active = pathname.startsWith(section.match);
  const [open, setOpen] = useState(active);

  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  // 접힌 사이드바에는 펼침 버튼을 둘 자리가 없다. 하위 항목을 아이콘으로 죽 편다.
  if (collapsed) {
    return (
      <div className="space-y-2">
        {section.groups.map((group) => (
          <Group key={group.title} group={group} collapsed />
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
          active ? 'text-white' : 'hover:bg-sidebar-active/60 hover:text-white',
        )}
      >
        <section.icon className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left font-medium">{section.title}</span>
        <ChevronDown className={cn('size-4 shrink-0 transition-transform', !open && '-rotate-90')} />
      </button>
      {open && (
        <div className="mt-1 ml-4 space-y-3 border-l border-white/10 pl-1">
          {section.groups.map((group) => (
            <Group key={group.title} group={group} collapsed={false} nested />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ collapsed, onToggle, mobile }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className={cn('flex h-14 items-center', collapsed ? 'flex-col justify-center gap-1 px-0' : 'gap-2 px-4')}>
        {!collapsed && (
          <>
            <Logo className="size-8" />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">MongLife Admin</span>
          </>
        )}
        {mobile ? (
          <Logo className="size-8" />
        ) : (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
            title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
            className="rounded-md p-1.5 hover:bg-sidebar-active hover:text-white"
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        )}
      </div>

      <nav className={cn('flex-1 space-y-5 overflow-y-auto py-3', collapsed ? 'px-2' : 'px-3')}>
        {NAV.map((entry) =>
          isSection(entry) ? (
            <Section key={entry.title} section={entry} collapsed={collapsed} />
          ) : (
            <Group key={entry.title} group={entry} collapsed={collapsed} />
          ),
        )}
      </nav>
      {!collapsed && <div className="px-5 py-3 text-[11px] opacity-50">discovery admin · v0.1.0</div>}
    </aside>
  );
}
