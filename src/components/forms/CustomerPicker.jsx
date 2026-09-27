import { UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { useCustomers } from '../../hooks/useCustomers';
import { useDebounce } from '../../hooks/useDebounce';
import { SearchInput } from '../common/SearchInput';
import { Spinner } from '../common/Spinner';

const RESULT_LIMIT = 8;

/**
 * Searchable customer selector. `value` is the selected customer object (or null).
 */
export function CustomerPicker({ value, onChange, label = 'Customer', error, optional }) {
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search.trim());
  const query = useCustomers(
    { search: debounced || undefined, isActive: true, limit: RESULT_LIMIT },
    { enabled: !value },
  );

  if (value) {
    return (
      <div>
        <p className="mb-1.5 text-sm font-medium text-slate-700">{label}</p>
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200">
          <UserRound className="size-5 shrink-0 text-slate-400" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{value.companyName || value.name}</p>
            <p className="truncate text-xs text-slate-500">
              {[value.companyName && value.name, value.gstin, value.state]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="-mr-1 rounded-lg p-2 text-slate-400 hover:text-slate-600"
            aria-label="Change customer"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>
    );
  }

  const customers = query.data?.items ?? [];

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">
        {label}
        {optional && <span className="ml-1 font-normal text-slate-400">(optional)</span>}
      </p>
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search customer, mobile or GSTIN"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <div className="mt-2 max-h-56 overflow-y-auto rounded-xl ring-1 ring-slate-200 empty:hidden">
        {query.isFetching && !customers.length && (
          <div className="flex justify-center p-4 text-slate-400">
            <Spinner />
          </div>
        )}
        {!query.isFetching && debounced && !customers.length && (
          <p className="p-4 text-center text-sm text-slate-500">No customers match “{debounced}”</p>
        )}
        {customers.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {customers.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(customer);
                    setSearch('');
                  }}
                  className="w-full px-3 py-2.5 text-left hover:bg-slate-50 active:bg-slate-100"
                >
                  <p className="truncate font-medium">{customer.companyName || customer.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {[customer.mobile, customer.gstin, customer.city].filter(Boolean).join(' · ')}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
