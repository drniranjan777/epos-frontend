import { cn } from '../../utils/cn';

export function Spinner({ className }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block size-5 animate-spin rounded-full border-2 border-current border-r-transparent',
        className,
      )}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-slate-500">
      <Spinner className="size-8" />
    </div>
  );
}
