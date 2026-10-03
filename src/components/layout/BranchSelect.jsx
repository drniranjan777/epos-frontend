import { Building2, ChevronDown } from 'lucide-react';
import { useId } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';

/**
 * Branch the user is working in. Shows a plain label when the user has only one branch.
 * `tone="dark"` is for the app bar / sidebar; the default suits page headers.
 */
export function BranchSelect({ tone = 'light', showLabel = true, className }) {
  const { branches, branch, setBranch } = useAuth();
  const id = useId();
  if (!branch) return null;

  const dark = tone === 'dark';
  const labelClass = cn('text-xs font-semibold', dark ? 'text-slate-400' : 'text-slate-600');

  if (branches.length < 2) {
    return (
      <span className={cn('inline-flex items-center gap-2', className)}>
        {showLabel && <span className={labelClass}>Branch</span>}
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-sm font-medium',
            dark ? 'text-white' : 'text-slate-800',
          )}
        >
          <Building2 className="size-4 opacity-70" aria-hidden />
          {branch.name}
        </span>
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {showLabel && (
        <label htmlFor={id} className={labelClass}>
          Branch
        </label>
      )}
      <span className="relative inline-flex">
        <select
          id={id}
          value={branch.id}
          onChange={(e) => setBranch(Number(e.target.value))}
          aria-label="Branch"
          className={cn(
            'h-10 appearance-none rounded-lg border-0 pr-8 pl-3 text-sm font-medium ring-1 ring-inset focus:ring-2 focus:outline-none',
            dark
              ? 'focus:ring-brand-500 bg-slate-800 text-white ring-slate-700'
              : 'focus:ring-brand-500 bg-white text-slate-800 ring-slate-300',
          )}
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <ChevronDown
          className={cn(
            'pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2',
            dark ? 'text-slate-400' : 'text-slate-500',
          )}
          aria-hidden
        />
      </span>
    </span>
  );
}
