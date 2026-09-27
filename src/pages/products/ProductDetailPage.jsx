import { ArrowDownToLine, ArrowUpFromLine, Pencil, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardHeader } from '../../components/common/Card';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { PageHeader } from '../../components/common/PageHeader';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState, ErrorState, ListSkeleton, QueryState } from '../../components/common/States';
import { AdjustmentSheet } from '../../components/inventory/AdjustmentSheet';
import { LedgerList } from '../../components/inventory/LedgerList';
import { StockBadge } from '../../components/inventory/StockBadge';
import { StockMovementSheet } from '../../components/inventory/StockMovementSheet';
import { PERMISSIONS as P } from '../../constants/permissions';
import { useAuth } from '../../hooks/useAuth';
import { useLedger } from '../../hooks/useInventory';
import { useDeleteProduct, useProduct } from '../../hooks/useProducts';
import { getErrorMessage } from '../../utils/apiError';
import { formatCurrency, formatNumber, formatQty } from '../../utils/format';

const LEDGER_PAGE_SIZE = 10;

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-900">{value || '—'}</dd>
    </div>
  );
}

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const product = useProduct(id);
  const [ledgerPage, setLedgerPage] = useState(1);
  const ledger = useLedger(
    { productId: id, page: ledgerPage, limit: LEDGER_PAGE_SIZE },
    { enabled: can(P.INVENTORY_VIEW) },
  );
  const [action, setAction] = useState(null);
  const remove = useDeleteProduct();

  if (product.isPending) return <ListSkeleton rows={6} />;
  if (product.isError) {
    return <ErrorState error={product.error} onRetry={() => product.refetch()} />;
  }

  const p = product.data;

  async function onDelete() {
    try {
      await remove.mutateAsync(p.id);
      toast.success('Product deleted');
      navigate('/products', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
      setAction(null);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={p.name}
        subtitle={[p.sku, p.partNumber].filter(Boolean).join(' · ')}
        backTo="/products"
        actions={
          <>
            {can(P.PRODUCTS_UPDATE) && (
              <Button variant="secondary" to={`/products/${p.id}/edit`}>
                <Pencil className="size-4" aria-hidden />
                Edit
              </Button>
            )}
            {can(P.PRODUCTS_DELETE) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAction('delete')}
                aria-label="Delete product"
              >
                <Trash2 className="size-5 text-red-600" />
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-1">
          <div className="flex items-start justify-between">
            <p className="text-sm text-slate-500">Current stock</p>
            <div className="flex gap-1">
              {!p.isActive && <Badge>Inactive</Badge>}
              <StockBadge product={p} />
            </div>
          </div>
          <p className="tabular mt-1 text-4xl font-bold">
            {formatQty(p.stockQuantity, p.unitCode)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Minimum level {formatNumber(p.minStockLevel)}
          </p>

          {p.isActive && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {can(P.INVENTORY_IN) && (
                <Button variant="in" size="lg" onClick={() => setAction('IN')}>
                  <ArrowDownToLine className="size-5" aria-hidden /> IN
                </Button>
              )}
              {can(P.INVENTORY_OUT) && (
                <Button
                  variant="out"
                  size="lg"
                  onClick={() => setAction('OUT')}
                  disabled={p.stockQuantity <= 0}
                >
                  <ArrowUpFromLine className="size-5" aria-hidden /> OUT
                </Button>
              )}
            </div>
          )}
          {can(P.INVENTORY_ADJUST) && (
            <Button
              variant="secondary"
              fullWidth
              className="mt-3"
              onClick={() => setAction('adjust')}
            >
              <SlidersHorizontal className="size-4" aria-hidden />
              Adjust stock
            </Button>
          )}
        </Card>

        <Card className="p-4 lg:col-span-2">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
            <Detail label="Category" value={p.categoryName} />
            <Detail label="Brand" value={p.brandName} />
            <Detail label="Machine model" value={p.machineModel} />
            <Detail label="Unit" value={`${p.unitName} (${p.unitCode})`} />
            <Detail label="HSN code" value={p.hsnCode} />
            <Detail label="GST rate" value={p.gstRate != null ? `${p.gstRate}%` : null} />
            {can(P.REPORTS_VIEW) && (
              <Detail label="Purchase price" value={formatCurrency(p.purchasePrice)} />
            )}
            <Detail label="Selling price" value={formatCurrency(p.sellingPrice)} />
            <Detail label="MRP" value={formatCurrency(p.mrp)} />
          </dl>
          {p.description && (
            <p className="mt-4 text-sm whitespace-pre-line text-slate-600">{p.description}</p>
          )}
        </Card>
      </div>

      {can(P.INVENTORY_VIEW) && (
        <Card className="overflow-hidden">
          <CardHeader title="Stock history" subtitle="Ledger entries for this product" />
          <div className="mt-3">
            <QueryState
              query={ledger}
              isEmpty={(d) => d.items.length === 0}
              empty={<EmptyState title="No movements yet" />}
            >
              {(data) => (
                <>
                  <LedgerList items={data.items} />
                  <Pagination
                    meta={data.meta}
                    isFetching={ledger.isFetching}
                    onPageChange={setLedgerPage}
                  />
                </>
              )}
            </QueryState>
          </div>
        </Card>
      )}

      {(action === 'IN' || action === 'OUT') && (
        <StockMovementSheet
          key={action}
          product={p}
          mode={action}
          open
          onClose={() => setAction(null)}
        />
      )}
      {action === 'adjust' && <AdjustmentSheet product={p} open onClose={() => setAction(null)} />}
      <ConfirmDialog
        open={action === 'delete'}
        title="Delete product?"
        message="Products with stock or invoice history cannot be deleted; mark them inactive instead."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={onDelete}
        onClose={() => setAction(null)}
      />
    </div>
  );
}
