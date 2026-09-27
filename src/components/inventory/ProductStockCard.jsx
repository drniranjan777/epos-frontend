import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Link } from 'react-router';
import { PERMISSIONS as P } from '../../constants/permissions';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';
import { formatQty } from '../../utils/format';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { stockStatus } from '../../utils/stock';
import { StockBadge } from './StockBadge';

/** Search result card: identity, available stock and large IN / OUT actions. */
export function ProductStockCard({ product, onMove }) {
  const { can } = useAuth();
  const status = stockStatus(product);
  const canIn = can(P.INVENTORY_IN);
  const canOut = can(P.INVENTORY_OUT);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {can(P.PRODUCTS_VIEW) ? (
            <Link
              to={`/products/${product.id}`}
              className="font-semibold text-slate-900 hover:underline"
            >
              {product.name}
            </Link>
          ) : (
            <p className="font-semibold text-slate-900">{product.name}</p>
          )}
          <p className="mt-0.5 truncate text-sm text-slate-500">
            {[product.sku, product.partNumber].filter(Boolean).join(' · ')}
          </p>
          {(product.brandName || product.machineModel) && (
            <p className="truncate text-xs text-slate-400">
              {[product.brandName, product.machineModel].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-slate-500">Available</p>
          <p
            className={cn(
              'tabular text-xl font-bold',
              status === 'out' && 'text-red-600',
              status === 'low' && 'text-amber-600',
            )}
          >
            {formatQty(product.stockQuantity, product.unitCode)}
          </p>
          <StockBadge product={product} />
        </div>
      </div>

      {(canIn || canOut) && (
        <div className={cn('mt-4 grid gap-3', canIn && canOut ? 'grid-cols-2' : 'grid-cols-1')}>
          {canIn && (
            <Button variant="in" size="lg" onClick={() => onMove(product, 'IN')}>
              <ArrowDownToLine className="size-5" aria-hidden />
              IN
            </Button>
          )}
          {canOut && (
            <Button
              variant="out"
              size="lg"
              onClick={() => onMove(product, 'OUT')}
              disabled={Number(product.stockQuantity) <= 0}
            >
              <ArrowUpFromLine className="size-5" aria-hidden />
              OUT
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
