import { useId, useState } from 'react';
import { useCustomers } from '../../hooks/useCustomers';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '../../utils/cn';
import { Input } from './Field';

const SUGGESTION_LIMIT = 6;

/**
 * Customer / supplier name. Free text is always allowed; with `suggestCustomers` matching
 * customers from the master are offered, and picking one links the entry to that customer.
 *
 * @param {{ name: string, customerId: number|null }} value
 */
export function PartyInput({ label, placeholder, value, onChange, disabled, suggestCustomers }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const search = useDebounce(value.name.trim(), 250);
  const customers = useCustomers(
    { search, isActive: true, limit: SUGGESTION_LIMIT },
    { enabled: Boolean(suggestCustomers && open && search && !value.customerId) },
  );
  const suggestions = open && !value.customerId ? (customers.data?.items ?? []) : [];

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className={cn(
          'mb-1.5 block text-sm font-medium',
          disabled ? 'text-slate-400' : 'text-slate-700',
        )}
      >
        {label}
      </label>
      <Input
        id={id}
        value={value.name}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => onChange({ name: e.target.value, customerId: null })}
        onFocus={() => setOpen(true)}
        // Delay so a tap on a suggestion registers before the list closes.
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        role={suggestCustomers ? 'combobox' : undefined}
        aria-expanded={suggestCustomers ? suggestions.length > 0 : undefined}
        aria-controls={suggestCustomers ? `${id}-list` : undefined}
      />
      {value.customerId && !disabled && (
        <p className="mt-1 text-xs text-emerald-700">Linked to customer record</p>
      )}
      {suggestions.length > 0 && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-slate-200"
        >
          {suggestions.map((customer) => (
            <li key={customer.id} role="option" aria-selected={false}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange({
                    name: customer.companyName || customer.name,
                    customerId: customer.id,
                  });
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-50"
              >
                <span className="block truncate text-sm font-medium">
                  {customer.companyName || customer.name}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {[customer.mobile, customer.gstin].filter(Boolean).join(' · ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
