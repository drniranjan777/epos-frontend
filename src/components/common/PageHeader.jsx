import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

/** Page title with optional back link and actions (actions wrap below the title on phones). */
export function PageHeader({ title, subtitle, backTo, actions }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2">
        {backTo && (
          <Link
            to={backTo}
            className="-ml-2 rounded-lg p-2 text-slate-600 hover:bg-slate-200"
            aria-label="Back"
          >
            <ArrowLeft className="size-5" />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
