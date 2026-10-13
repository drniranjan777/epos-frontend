import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router';
import { AskStockPanel } from '../components/askStock/AskStockPanel';
import { ASK_STOCK_PERMISSIONS } from '../components/askStock/askStockAccess';
import { Sidebar } from '../components/layout/Sidebar';
import { useAuth } from '../hooks/useAuth';
import { useStoredState } from '../hooks/useStoredState';
import { cn } from '../utils/cn';

/** Desktop layout: fixed sidebar (full, or an icon rail) and a wide content area. */
export function AdminLayout() {
  const { branch, canAny } = useAuth();
  const [askOpen, setAskOpen] = useState(false);
  // Small laptops start with the icon rail so pages keep their width.
  const [compact, setCompact] = useStoredState('sidebar.compact', () => window.innerWidth < 1280);
  const showAsk = Boolean(branch) && canAny(...ASK_STOCK_PERMISSIONS);

  return (
    <div className="min-h-dvh">
      <Sidebar
        compact={compact}
        onToggleCompact={() => setCompact((value) => !value)}
        showAsk={showAsk}
        onAsk={() => setAskOpen(true)}
      />
      <main
        className={cn(
          'transition-[padding] duration-200 ease-out motion-reduce:transition-none',
          compact ? 'pl-[72px]' : 'pl-64',
        )}
      >
        <div className="mx-auto max-w-7xl px-8 py-6">
          <Outlet />
        </div>
      </main>
      {/* Sits above the sticky save bars at the bottom of forms. */}
      {showAsk && !askOpen && (
        <button
          type="button"
          onClick={() => setAskOpen(true)}
          aria-label="Ask Stock"
          title="Ask Stock"
          className="bg-brand-500 hover:bg-brand-400 fixed right-6 bottom-24 z-40 flex size-14 items-center justify-center rounded-full text-slate-950 shadow-lg ring-4 ring-white transition hover:scale-105"
        >
          <Sparkles className="size-6" aria-hidden />
        </button>
      )}
      {showAsk && askOpen && <AskStockPanel onClose={() => setAskOpen(false)} />}
    </div>
  );
}
