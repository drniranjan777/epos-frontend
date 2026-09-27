import { AlertTriangle, Inbox } from 'lucide-react';
import { getErrorMessage } from '../../utils/apiError';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export function EmptyState({ icon: Icon = Inbox, title, message, action, className }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      <div className="mb-3 rounded-full bg-slate-100 p-3 text-slate-400">
        <Icon className="size-6" aria-hidden />
      </div>
      <p className="font-semibold text-slate-800">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center px-6 py-12 text-center', className)}
    >
      <div className="mb-3 rounded-full bg-red-50 p-3 text-red-500">
        <AlertTriangle className="size-6" aria-hidden />
      </div>
      <p className="font-semibold text-slate-800">Could not load data</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200', className)} aria-hidden />;
}

export function ListSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3 p-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Renders loading / error / empty / content for a TanStack query result.
 * `isEmpty` decides when to show the empty state.
 */
export function QueryState({ query, isEmpty, empty, loading, children }) {
  if (query.isPending) return loading ?? <ListSkeleton />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (isEmpty?.(query.data)) return empty ?? <EmptyState title="Nothing here yet" />;
  return children(query.data);
}
