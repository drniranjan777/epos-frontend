import { useState } from 'react';
import { STOCK_STATUS_OPTIONS } from '../../constants/app';
import { useActiveMasterList } from '../../hooks/useMasters';
import { SearchInput } from '../common/SearchInput';
import { Select } from './Field';

/** Search + category + brand + stock status, bound to URL filters. */
export function ProductFilters({ filters, setFilters, showStatus = true }) {
  const [search, setSearch] = useState(filters.search ?? '');
  const categories = useActiveMasterList('categories');
  const brands = useActiveMasterList('brands');

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <SearchInput
        className="sm:col-span-2 lg:col-span-1"
        value={search}
        onChange={(value) => {
          setSearch(value);
          setFilters({ search: value.trim() });
        }}
        placeholder="Name, SKU, part no., model, HSN"
      />
      <Select
        value={filters.categoryId ?? ''}
        onChange={(e) => setFilters({ categoryId: e.target.value })}
        aria-label="Category"
      >
        <option value="">All categories</option>
        {(categories.data ?? []).map((c) => (
          <option key={c.id} value={c.id}>
            {c.parentName ? `${c.parentName} › ${c.name}` : c.name}
          </option>
        ))}
      </Select>
      <Select
        value={filters.brandId ?? ''}
        onChange={(e) => setFilters({ brandId: e.target.value })}
        aria-label="Brand"
      >
        <option value="">All brands</option>
        {(brands.data ?? []).map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </Select>
      {showStatus && (
        <Select
          value={filters.stockStatus ?? ''}
          onChange={(e) => setFilters({ stockStatus: e.target.value })}
          aria-label="Stock status"
        >
          {STOCK_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}
