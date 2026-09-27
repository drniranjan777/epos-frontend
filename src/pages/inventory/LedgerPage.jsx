import { History } from 'lucide-react';
import { useState } from 'react';
import { Card } from '../../components/common/Card';
import { PageHeader } from '../../components/common/PageHeader';
import { Pagination } from '../../components/common/Pagination';
import { SearchInput } from '../../components/common/SearchInput';
import { EmptyState, QueryState } from '../../components/common/States';
import { Input, Select } from '../../components/forms/Field';
import { LedgerList } from '../../components/inventory/LedgerList';
import { PAGE_SIZE, TXN_TYPES } from '../../constants/app';
import { useDebounce } from '../../hooks/useDebounce';
import { useLedger } from '../../hooks/useInventory';
import { useUrlFilters } from '../../hooks/useUrlFilters';

export function LedgerPage() {
  const [filters, setFilters] = useUrlFilters({ page: '1' });
  const [search, setSearch] = useState(filters.search ?? '');
  const debouncedSearch = useDebounce(search.trim());

  const params = {
    page: filters.page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    types: filters.types,
    from: filters.from,
    to: filters.to,
  };
  const ledger = useLedger(params);

  return (
    <div>
      <PageHeader title="Inventory Ledger" subtitle="Every stock movement, newest first" />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SearchInput
          className="sm:col-span-2 lg:col-span-1"
          value={search}
          onChange={(value) => {
            setSearch(value);
            setFilters({ search: value.trim() });
          }}
          placeholder="Product, SKU or reference"
        />
        <Select
          value={filters.types ?? ''}
          onChange={(e) => setFilters({ types: e.target.value })}
          aria-label="Type"
        >
          <option value="">All types</option>
          <option value="IN,OPENING">Stock IN</option>
          <option value="OUT,INVOICE_OUT">Stock OUT</option>
          <option value="ADJUSTMENT_IN,ADJUSTMENT_OUT">Adjustments</option>
          {Object.entries(TXN_TYPES).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label} only
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-1">
          <Input
            type="date"
            aria-label="From date"
            value={filters.from ?? ''}
            onChange={(e) => setFilters({ from: e.target.value })}
          />
          <Input
            type="date"
            aria-label="To date"
            value={filters.to ?? ''}
            onChange={(e) => setFilters({ to: e.target.value })}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <QueryState
          query={ledger}
          isEmpty={(data) => data.items.length === 0}
          empty={
            <EmptyState icon={History} title="No movements" message="Try changing the filters." />
          }
        >
          {(data) => (
            <>
              <LedgerList items={data.items} showProduct />
              <Pagination
                meta={data.meta}
                isFetching={ledger.isFetching}
                onPageChange={(page) => setFilters({ page })}
              />
            </>
          )}
        </QueryState>
      </Card>
    </div>
  );
}
