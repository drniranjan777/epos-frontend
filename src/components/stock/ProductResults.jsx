import { Check, PackageSearch, Plus } from 'lucide-react';
import { useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useProductSearch } from '../../hooks/useInventory';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/format';
import { stockStatus } from '../../utils/stock';
import { SearchInput } from '../common/SearchInput';
import { Spinner } from '../common/Spinner';

const PILL_TONES = {
  ok: 'bg-emerald-50 text-emerald-700',
  low: 'bg-amber-50 text-amber-700',
  out: 'bg-red-50 text-red-700',
};

/**
 * Search box (with voice) and a scrollable result list. Tapping a result adds it to the
 * cart. With `capped`, parts with no stock in the branch cannot be added.
 */
export function ProductResults({ branchName, capped, onAdd, cartQuantities }) {
  const [search, setSearch] = useState('');
  const term = useDebounce(search.trim(), 250);
  const results = useProductSearch(term);
  const products = term ? (results.data ?? []) : [];

  return (
    <div>
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search Product, Model, Parts"
        voice
        autoFocus
      />

      <div className="mt-2 max-h-72 overflow-y-auto rounded-xl bg-white ring-1 ring-slate-200">
        {!term && (
          <p className="flex items-center gap-2 px-4 py-6 text-sm text-slate-500">
            <PackageSearch className="size-5 shrink-0 text-slate-400" aria-hidden />
            Search by part name, SKU, part number, brand, model or HSN — or tap the mic.
          </p>
        )}
        {term && results.isPending && (
          <div className="flex justify-center py-6 text-slate-400">
            <Spinner />
          </div>
        )}
        {term && results.isError && (
          <p className="px-4 py-6 text-sm text-red-600">Search failed. Check your connection.</p>
        )}
        {term && results.isSuccess && products.length === 0 && (
          <p className="px-4 py-6 text-sm text-slate-500">No parts match “{term}”.</p>
        )}
        {products.length > 0 && (
          <ul className="divide-y divide-slate-100" aria-label="Search results">
            {products.map((product) => {
              const status = stockStatus(product);
              const disabled = capped && Number(product.stockQuantity) <= 0;
              const inCart = cartQuantities[product.id];
              return (
                <li key={product.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onAdd(product)}
                    aria-label={`${product.name}, ${product.sku}, ${formatNumber(product.stockQuantity)} in ${branchName}${inCart ? `, ${inCart} in entry` : ', add'}`}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{product.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {[product.sku, product.partNumber, product.machineModel]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap',
                        PILL_TONES[status],
                      )}
                    >
                      {formatNumber(product.stockQuantity)} in {branchName}
                    </span>
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full',
                        inCart ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600',
                      )}
                      aria-label={inCart ? `${inCart} in entry` : 'Add'}
                    >
                      {inCart ? <Check className="size-4" /> : <Plus className="size-4" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
