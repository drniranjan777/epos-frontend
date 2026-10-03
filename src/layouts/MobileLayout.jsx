import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import { BranchSelect } from '../components/layout/BranchSelect';
import { NavList } from '../components/layout/NavList';
import { Avatar, UserPanel } from '../components/layout/UserMenu';
import { APP_NAME } from '../constants/app';
import { bottomNavItems, visibleSections } from '../constants/navigation';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../utils/cn';

/** Phone layout: compact top bar, bottom navigation for core modules and a drawer for the rest. */
export function MobileLayout() {
  const { user, branch, canAny } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const items = bottomNavItems(canAny);

  // Lock background scroll and support Escape while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-dvh">
      <header className="pt-safe sticky top-0 z-30 bg-slate-900 text-white">
        <div className="flex h-14 items-center justify-between px-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2.5 hover:bg-slate-800"
            aria-label="Open menu"
          >
            <Menu className="size-6" />
          </button>
          {branch ? (
            <BranchSelect tone="dark" showLabel={false} />
          ) : (
            <span className="truncate text-base font-semibold">{APP_NAME}</span>
          )}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-full p-1"
            aria-label="Account"
          >
            <Avatar name={user.name} className="size-8 text-xs" />
          </button>
        </div>
      </header>

      <main className="px-4 pt-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      <nav
        className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white"
        aria-label="Primary"
      >
        <ul className="flex h-16">
          {items.map(({ to, label, shortLabel, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium',
                    isActive ? 'text-slate-900' : 'text-slate-500',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-7 w-12 items-center justify-center rounded-full transition',
                        isActive && 'bg-brand-100',
                      )}
                    >
                      <Icon className={cn('size-5', isActive && 'text-brand-700')} aria-hidden />
                    </span>
                    {shortLabel ?? label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-slate-500"
            >
              <span className="flex h-7 w-12 items-center justify-center">
                <Menu className="size-5" aria-hidden />
              </span>
              More
            </button>
          </li>
        </ul>
      </nav>

      {drawerOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-slate-950/50" onClick={() => setDrawerOpen(false)} />
          <div className="pt-safe pb-safe absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col bg-white shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4">
              <span className="font-semibold">{APP_NAME}</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="-mr-2 rounded-lg p-2.5 text-slate-500 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <NavList sections={visibleSections(canAny)} onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="border-t border-slate-100 p-3">
              <UserPanel onNavigate={() => setDrawerOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
