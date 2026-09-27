import { Outlet } from 'react-router';
import { NavList } from '../components/layout/NavList';
import { UserPanel } from '../components/layout/UserMenu';
import { APP_NAME } from '../constants/app';
import { visibleSections } from '../constants/navigation';
import { useAuth } from '../hooks/useAuth';

/** Desktop layout: fixed sidebar with grouped navigation and a wide content area. */
export function AdminLayout() {
  const { canAny } = useAuth();

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 flex w-64 flex-col bg-slate-900">
        <div className="flex h-16 items-center gap-3 px-5">
          <img src="/icon.svg" alt="" className="size-8" />
          <span className="font-semibold text-white">{APP_NAME}</span>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavList sections={visibleSections(canAny)} dark />
        </div>
        <div className="border-t border-slate-800 p-3">
          <UserPanel dark />
        </div>
      </aside>
      <main className="pl-64">
        <div className="mx-auto max-w-7xl px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
