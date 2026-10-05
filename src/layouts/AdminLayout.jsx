import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router';
import { AskStockPanel } from '../components/askStock/AskStockPanel';
import { ASK_STOCK_PERMISSIONS } from '../components/askStock/askStockAccess';
import { BranchSelect } from '../components/layout/BranchSelect';
import { NavList } from '../components/layout/NavList';
import { UserPanel } from '../components/layout/UserMenu';
import { APP_NAME } from '../constants/app';
import { visibleSections } from '../constants/navigation';
import { useAuth } from '../hooks/useAuth';

/** Desktop layout: fixed sidebar with grouped navigation and a wide content area. */
export function AdminLayout() {
  const { branch, canAny } = useAuth();
  const [askOpen, setAskOpen] = useState(false);
  const showAsk = Boolean(branch) && canAny(...ASK_STOCK_PERMISSIONS);

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 flex w-64 flex-col bg-slate-900">
        <div className="flex h-16 items-center gap-3 px-5">
          <img src="/icon.svg" alt="" className="size-8" />
          <span className="font-semibold text-white">{APP_NAME}</span>
        </div>
        {branch && (
          <div className="px-5 pb-2">
            <BranchSelect
              tone="dark"
              className="w-full [&_select]:w-full [&>span:last-child]:flex-1"
            />
          </div>
        )}
        {showAsk && (
          <div className="px-5 pt-2">
            <button
              type="button"
              onClick={() => setAskOpen(true)}
              className="flex h-10 w-full items-center gap-2 rounded-lg bg-slate-800 px-3 text-sm font-medium text-slate-100 transition hover:bg-slate-700"
            >
              <Sparkles className="text-brand-400 size-4" aria-hidden />
              Ask Stock
            </button>
          </div>
        )}
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
      {showAsk && askOpen && <AskStockPanel onClose={() => setAskOpen(false)} />}
    </div>
  );
}
