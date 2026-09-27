import { Check, PackageSearch } from 'lucide-react';
import { useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useProductSearch } from '../../hooks/useInventory';
import { formatCurrency, formatQty } from '../../utils/format';
import { SearchInput } from '../common/SearchInput';
import { Sheet } from '../common/Sheet';
import { EmptyState, ErrorState, ListSkeleton } from '../common/States';
import { StockBadge } from '../inventory/StockBadge';

/** Search and tap products to add them to an invoice. Already added products show a tick. */
export function ProductPickerSheet({ open, onClose, onPick, selectedIds }) {
  const [search, setSearch] = useState('');
  const term = useDebounce(search.trim(), 250);
  const results = useProductSearch(term);

  return (
    <Sheet open={open} onClose={onClose} title="Add item" size="lg">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search product / part number"
        data-autofocus
      />
      <div className="mt-3">
        {!term && <EmptyState icon={PackageSearch} title="Search for a product" />}
        {term && results.isPending && <ListSkeleton rows={3} />}
        {term && results.isError && (
          <ErrorState error={results.error} onRetry={() => results.refetch()} />
        )}
        {term && results.isSuccess && results.data.length === 0 && (
          <EmptyState title="No products found" message={`Nothing matches “${term}”.`} />
        )}
        {results.data?.length > 0 && term && (
          <ul className="divide-y divide-slate-100">
            {results.data.map((product) => {
              const added = selectedIds.includes(product.id);
              return (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => onPick(product)}
                    className="flex w-full items-center gap-3 py-3 text-left active:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{product.name}</p>
                      <p className="truncate text-sm text-slate-500">
                        {product.sku} · {formatCurrency(product.sellingPrice)} · GST{' '}
                        {product.gstRate ?? 0}%
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tabular text-sm font-semibold">
                        {formatQty(product.stockQuantity, product.unitCode)}
                      </p>
                      <StockBadge product={product} />
                    </div>
                    {added && (
                      <Check className="size-5 shrink-0 text-emerald-600" aria-label="Added" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
