import { Building2, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link } from 'react-router';
import { visibleSections } from '../../constants/navigation';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';
import { Logo } from '../common/Logo';
import { BranchSelect } from './BranchSelect';
import { NavList } from './NavList';
import { SidebarUser } from './UserMenu';

/**
 * Tooltips for the icon-only sidebar. They are positioned against the viewport because the
 * navigation scrolls, which would clip a tooltip placed inside it. Controls keep their own
 * `aria-label`, so the tooltip is purely visual.
 */
function useRailTooltip(enabled) {
  const [shown, setShown] = useState(null);
  const hide = useCallback(() => setShown(null), []);
  const tip = useCallback(
    (label) => {
      const show = (event) => {
        const box = event.currentTarget.getBoundingClientRect();
        setShown({ label, top: box.top + box.height / 2, left: box.right + 12 });
      };
      return { onMouseEnter: show, onFocus: show, onMouseLeave: hide, onBlur: hide };
    },
    [hide],
  );
  const tooltip = enabled && shown && (
    <div
      aria-hidden
      style={{ top: shown.top, left: shown.left }}
      className="pointer-events-none fixed z-50 -translate-y-1/2 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow-lg"
    >
      {shown.label}
    </div>
  );
  return { tip: enabled ? tip : undefined, tooltip, hide };
}

/**
 * Desktop sidebar: logo, branch, grouped navigation and the signed-in user.
 * `compact` narrows it to an icon rail with tooltips.
 */
export function Sidebar({ compact, onToggleCompact }) {
  const { branch, canAny } = useAuth();
  const { tip, tooltip, hide } = useRailTooltip(compact);
  const railButton =
    'flex size-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900';

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ease-out motion-reduce:transition-none',
        compact ? 'w-[72px]' : 'w-64',
      )}
    >
      <div
        className={cn(
          'flex shrink-0 items-center',
          compact ? 'h-16 justify-center' : 'px-5 pt-4 pb-3',
        )}
      >
        <Link to="/" className="rounded-lg" aria-label="Go to dashboard" {...tip?.('Dashboard')}>
          <Logo variant={compact ? 'icon' : 'full'} className={compact ? 'h-9' : 'h-14'} />
        </Link>
      </div>

      <button
        type="button"
        onClick={() => {
          hide();
          onToggleCompact();
        }}
        aria-label={compact ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!compact}
        title={compact ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute top-5 -right-3 flex size-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-900"
      >
        {compact ? (
          <ChevronsRight className="size-3.5" aria-hidden />
        ) : (
          <ChevronsLeft className="size-3.5" aria-hidden />
        )}
      </button>

      {branch && (
        <div
          className={cn(
            'shrink-0 border-y border-slate-200',
            compact ? 'flex flex-col items-center gap-1 py-2' : 'space-y-2 px-4 py-3',
          )}
        >
          {compact ? (
            // The rail has no room for the picker: opening the sidebar reveals it.
            <button
              type="button"
              className={railButton}
              onClick={() => {
                hide();
                onToggleCompact();
              }}
              aria-label={`Branch: ${branch.name}. Expand sidebar to change`}
              {...tip(`Branch: ${branch.name}`)}
            >
              <Building2 className="size-[18px]" aria-hidden />
            </button>
          ) : (
            <BranchSelect className="flex w-full [&_select]:w-full [&>span:last-child]:flex-1" />
          )}
        </div>
      )}

      <div
        className={cn(
          'scrollbar-slim min-h-0 flex-1 overflow-y-auto py-3',
          compact ? 'px-2' : 'px-3',
        )}
        onScroll={hide}
      >
        <NavList sections={visibleSections(canAny)} compact={compact} tip={tip} />
      </div>

      <div className={cn('shrink-0 border-t border-slate-200', compact ? 'py-3' : 'p-3')}>
        <SidebarUser compact={compact} tip={tip} />
      </div>
      {tooltip}
    </aside>
  );
}
