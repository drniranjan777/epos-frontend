import { Package, Plus } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DataView } from '../../components/common/DataView';
import { PageHeader } from '../../components/common/PageHeader';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState, QueryState } from '../../components/common/States';
import { ProductFilters } from '../../components/forms/ProductFilters';
import { Select } from '../../components/forms/Field';
import { StockBadge } from '../../components/inventory/StockBadge';
import { PAGE_SIZE } from '../../constants/app';
import { PERMISSIONS as P } from '../../constants/permissions';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { useProducts } from '../../hooks/useProducts';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { formatCurrency, formatQty } from '../../utils/format';

export function ProductListPage() {
  const { can } = useAuth();
  const [filters, setFilters] = useUrlFilters({ page: '1', status: 'active' });
  const search = useDebounce(filters.search ?? '');
  const products = useProducts({
    page: filters.page,
    limit: PAGE_SIZE,
    search: search || undefined,
    categoryId: filters.categoryId,
    brandId: filters.brandId,
    stockStatus: filters.stockStatus,
    isActive: filters.status === 'all' ? undefined : filters.status === 'active',
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
    {
      header: 'Brand / Model',
      cell: (p) => [p.brandName, p.machineModel].filter(Boolean).join(' · ') || '—',
    },
    { header: 'HSN', cell: (p) => p.hsnCode ?? '—' },
    { header: 'GST', align: 'right', cell: (p) => (p.gstRate != null ? `${p.gstRate}%` : '—') },
    { header: 'Price', align: 'right', cell: (p) => formatCurrency(p.sellingPrice) },
    {
      header: 'Stock',
      align: 'right',
      cell: (p) => (
        <span className="inline-flex items-center gap-2">
          <StockBadge product={p} />
          <span className="font-semibold">{formatQty(p.stockQuantity, p.unitCode)}</span>
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        actions={
          can(P.PRODUCTS_CREATE) && (
            <Button to="/products/new">
              <Plus className="size-5" aria-hidden />
              New product
            </Button>
          )
        }
      />
      <ProductFilters filters={filters} setFilters={setFilters} />
      <div className="-mt-1 mb-4 flex justify-end">
        <Select
          className="h-9 w-auto text-sm"
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value })}
          aria-label="Product status"
        >
          <option value="active">Active products</option>
          <option value="inactive">Inactive products</option>
          <option value="all">All products</option>
        </Select>
      </div>
      <Card className="overflow-hidden">
        <QueryState
          query={products}
          isEmpty={(d) => d.items.length === 0}
          empty={
            <EmptyState
              icon={Package}
              title="No products found"
              message="Try a different search or add a new product."
            />
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
                      <p className="truncate font-medium">
                        {p.name} {!p.isActive && <Badge>Inactive</Badge>}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {[p.sku, p.brandName, p.machineModel].filter(Boolean).join(' · ')}
                      </p>
                      <p className="text-sm text-slate-700">{formatCurrency(p.sellingPrice)}</p>
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
