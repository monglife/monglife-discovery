import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSidebar } from './useSidebar';

export function AdminLayout() {
  const { collapsed, toggle, mobile } = useSidebar();
  return (
    <div className="flex h-full">
      <Sidebar collapsed={collapsed} onToggle={toggle} mobile={mobile} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
