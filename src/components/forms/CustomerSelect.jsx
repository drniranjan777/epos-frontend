import { ChevronDown, Plus, UserRound, X } from 'lucide-react';
import { useId, useState } from 'react';
import { useCustomers } from '../../hooks/useCustomers';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '../../utils/cn';
import { Spinner } from '../common/Spinner';
import { Input } from './Field';
import { QuickCustomerSheet } from './QuickCustomerSheet';

const RESULT_LIMIT = 8;

const displayName = (customer) => customer.companyName || customer.name;

/**
 * Customer dropdown: type to search the customer master, pick one, or add a new customer
 * on the spot. `search` is controlled so the screen can warn about text that was typed
 * but never turned into a customer.
 *
 * @param {{ value: object|null, onChange: (customer: object|null) => void,
 *           search: string, onSearchChange: (text: string) => void, canCreate?: boolean }} props
 */
export function CustomerSelect({
  label = 'Customer',
  value,
  onChange,
  search,
  onSearchChange,
  disabled,
  error,
  canCreate,
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [adding, setAdding] = useState(false);
  const debounced = useDebounce(search.trim(), 250);
  const query = useCustomers(
    { search: debounced || undefined, isActive: true, limit: RESULT_LIMIT },
    { enabled: open && !value && !disabled },
  );
  const customers = query.data?.items ?? [];
  // The "add new" row comes after the customers.
  const optionCount = customers.length + (canCreate ? 1 : 0);

  function pick(customer) {
    onChange(customer);
    onSearchChange('');
    setOpen(false);
  }

  function startAdding() {
    setOpen(false);
    setAdding(true);
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      if (!optionCount) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i + step + optionCount) % optionCount);
    } else if (event.key === 'Enter' && open && optionCount) {
      event.preventDefault();
      if (active < customers.length) pick(customers[active]);
      else startAdding();
    } else if (event.key === 'Escape' && open) {
      event.stopPropagation();
      setOpen(false);
    }
  }

  const labelClass = cn(
    'mb-1.5 block text-sm font-medium',
    disabled ? 'text-slate-400' : 'text-slate-700',
  );

  const sheet = canCreate && adding && (
    <QuickCustomerSheet
      initialName={search.trim()}
      onClose={() => setAdding(false)}
      onCreated={(customer) => {
        setAdding(false);
        pick(customer);
      }}
    />
  );

  if (value) {
    return (
      <div>
        <p className={labelClass}>{label}</p>
        <div
          className={cn(
            'flex h-11 items-center gap-2 rounded-lg bg-white pr-1 pl-3 ring-1 ring-slate-300',
            disabled && 'bg-slate-50 opacity-60',
          )}
        >
          <UserRound className="size-4 shrink-0 text-slate-400" aria-hidden />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-slate-900">{displayName(value)}</p>
            {(value.mobile || (value.companyName && value.name)) && (
              <p className="truncate text-xs text-slate-500">
                {[value.companyName && value.name, value.mobile].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Change customer"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        {sheet}
      </div>
    );
  }

  const typed = search.trim();
  return (
    <div className="relative">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          value={search}
          disabled={disabled}
          placeholder="Select or search customer"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && optionCount ? `${id}-opt-${active}` : undefined}
          invalid={Boolean(error)}
          className="pr-9"
          onChange={(e) => {
            onSearchChange(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          // Delay so a tap on an option registers before the list closes.
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
        />
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {open && !disabled && (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-slate-200"
        >
          <div className="max-h-64 overflow-y-auto py-1">
            {query.isFetching && !customers.length && (
              <div className="flex justify-center p-3 text-slate-400">
                <Spinner />
              </div>
            )}
            {!query.isFetching && !customers.length && (
              <p className="px-3 py-2.5 text-sm text-slate-500">
                {debounced ? `No customer matches “${debounced}”` : 'No customers yet'}
              </p>
            )}
            {customers.map((customer, index) => (
              <button
                key={customer.id}
                id={`${id}-opt-${index}`}
                type="button"
                role="option"
                aria-selected={active === index}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => pick(customer)}
                className={cn(
                  'block w-full px-3 py-2 text-left',
                  active === index && 'bg-slate-100',
                )}
              >
                <span className="block truncate text-sm font-medium">{displayName(customer)}</span>
                <span className="block truncate text-xs text-slate-500">
                  {[customer.companyName && customer.name, customer.mobile, customer.city]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </button>
            ))}
          </div>
          {canCreate && (
            <button
              id={`${id}-opt-${customers.length}`}
              type="button"
              role="option"
              aria-selected={active === customers.length}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(customers.length)}
              onClick={startAdding}
              className={cn(
                'text-brand-700 flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-left text-sm font-semibold',
                active === customers.length && 'bg-brand-50',
              )}
            >
              <Plus className="size-4" aria-hidden />
              {typed ? `Add “${typed}” as new customer` : 'Add new customer'}
            </button>
          )}
        </div>
      )}
      {sheet}
    </div>
  );
}
