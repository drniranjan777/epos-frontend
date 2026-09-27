import { Boxes } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { DataView } from '../../components/common/DataView';
import { PageHeader } from '../../components/common/PageHeader';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState, QueryState } from '../../components/common/States';
import { ProductFilters } from '../../components/forms/ProductFilters';
import { StockBadge } from '../../components/inventory/StockBadge';
import { PAGE_SIZE } from '../../constants/app';
import { useDebounce } from '../../hooks/useDebounce';
import { useProducts } from '../../hooks/useProducts';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { formatNumber, formatQty } from '../../utils/format';

/** Current stock per product with low / out-of-stock filters. */
export function StockLevelsPage() {
  const [filters, setFilters] = useUrlFilters({ page: '1', sortBy: 'stock', sortOrder: 'asc' });
  const search = useDebounce(filters.search ?? '');
  const products = useProducts({
    page: filters.page,
    limit: PAGE_SIZE,
    search: search || undefined,
    categoryId: filters.categoryId,
    brandId: filters.brandId,
    stockStatus: filters.stockStatus,
    isActive: true,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const columns = [
    {
      header: 'Product',
      cell: (p) => (
        <>
          <span className="font-medium">{p.name}</span>
          <span className="block text-xs text-slate-500">
            {[p.sku, p.partNumber].filter(Boolean).join(' · ')}
          </span>
        </>
      ),
    },
    { header: 'Category', cell: (p) => p.categoryName ?? '—' },
    { header: 'Brand', cell: (p) => p.brandName ?? '—' },
    { header: 'Min level', align: 'right', cell: (p) => formatNumber(p.minStockLevel) },
    {
      header: 'In stock',
      align: 'right',
      cell: (p) => <span className="font-semibold">{formatQty(p.stockQuantity, p.unitCode)}</span>,
    },
    { header: 'Status', cell: (p) => <StockBadge product={p} /> },
  ];

  return (
    <div>
      <PageHeader title="Stock Levels" subtitle="Lowest stock first" />
      <ProductFilters filters={filters} setFilters={setFilters} />
      <Card className="overflow-hidden">
        <QueryState
          query={products}
          isEmpty={(d) => d.items.length === 0}
          empty={
            <EmptyState icon={Boxes} title="No products match" message="Try different filters." />
          }
        >
          {(data) => (
            <>
              <DataView
                items={data.items}
                columns={columns}
                getLink={(p) => `/products/${p.id}`}
                renderCard={(p) => (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="truncate text-sm text-slate-500">{p.sku}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tabular font-bold">{formatQty(p.stockQuantity, p.unitCode)}</p>
                      <StockBadge product={p} />
                    </div>
                  </div>
                )}
              />
              <Pagination
                meta={data.meta}
                isFetching={products.isFetching}
                onPageChange={(page) => setFilters({ page })}
              />
            </>
          )}
        </QueryState>
      </Card>
    </div>
  );
}
