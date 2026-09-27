import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  autoFocus,
  className,
  ...props
}) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <input
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
        className="focus:ring-brand-500 block h-12 w-full rounded-xl border-0 bg-white pr-11 pl-10 text-slate-900 shadow-sm ring-1 ring-slate-300 ring-inset placeholder:text-slate-400 focus:ring-2 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute top-1/2 right-1 -translate-y-1/2 rounded-lg p-2.5 text-slate-400 hover:text-slate-600"
          aria-label="Clear search"
        >
          <X className="size-5" />
        </button>
      )}
    </div>
  );
}
