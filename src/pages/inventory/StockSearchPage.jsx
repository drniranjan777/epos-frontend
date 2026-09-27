import { PackageSearch, SearchX } from 'lucide-react';
import { useState } from 'react';
import { SearchInput } from '../../components/common/SearchInput';
import { EmptyState, ErrorState, ListSkeleton } from '../../components/common/States';
import { ProductStockCard } from '../../components/inventory/ProductStockCard';
import { StockMovementSheet } from '../../components/inventory/StockMovementSheet';
import { useDebounce } from '../../hooks/useDebounce';
import { useProductSearch } from '../../hooks/useInventory';
import { useUrlFilters } from '../../hooks/useUrlFilters';

/**
 * Search-first stock screen: search → pick a product → IN / OUT → quantity → confirm.
 * The search term lives in the URL so going back keeps the results.
 */
export function StockSearchPage() {
  const [{ q = '' }, setFilters] = useUrlFilters();
  const [input, setInput] = useState(q);
  const term = useDebounce(input.trim(), 250);
  const [movement, setMovement] = useState(null);
  const search = useProductSearch(term);

  function onChange(value) {
    setInput(value);
    setFilters({ q: value.trim() });
  }

  const results = search.data ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="sr-only">Stock IN / OUT</h1>
      <div className="sticky top-14 z-20 -mx-4 bg-slate-100 px-4 pt-1 pb-3 lg:top-0 lg:mx-0 lg:px-0 lg:pt-0">
        <SearchInput
          value={input}
          onChange={onChange}
          placeholder="Search product / part number"
          autoFocus
        />
      </div>

      {!term && (
        <EmptyState
          icon={PackageSearch}
          title="Find a product"
          message="Search by name, SKU, part number, brand, machine model or HSN code."
        />
      )}
      {term && search.isPending && <ListSkeleton rows={3} />}
      {term && search.isError && (
        <ErrorState error={search.error} onRetry={() => search.refetch()} />
      )}
      {term && search.isSuccess && results.length === 0 && (
        <EmptyState
          icon={SearchX}
          title="No products found"
          message={`Nothing matches “${term}”.`}
        />
      )}

      {term && results.length > 0 && (
        <ul className="space-y-3" aria-live="polite">
          {results.map((product) => (
            <li key={product.id}>
              <ProductStockCard
                product={product}
                onMove={(p, mode) => setMovement({ product: p, mode })}
              />
            </li>
          ))}
        </ul>
      )}

      {movement && (
        <StockMovementSheet
          key={`${movement.product.id}-${movement.mode}`}
          product={movement.product}
          mode={movement.mode}
          open
          onClose={() => setMovement(null)}
        />
      )}
    </div>
  );
}
