import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  FileText,
  IndianRupee,
  Package,
  PackageX,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/common/Button';
import { Card, CardHeader } from '../../components/common/Card';
import { EmptyState, ErrorState, Skeleton } from '../../components/common/States';
import { MovementChart } from '../../components/dashboard/MovementChart';
import { StatCard } from '../../components/dashboard/StatCard';
import { PERMISSIONS as P } from '../../constants/permissions';
import { useDashboardMovement, useDashboardSummary } from '../../hooks/useAdmin';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';
import {
  formatCompact,
  formatCurrency,
  formatDate,
  formatNumber,
  formatQty,
} from '../../utils/format';

const RANGES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}

export function DashboardPage() {
  const { user, can, canAny } = useAuth();
  const [range, setRange] = useState('daily');
  const summary = useDashboardSummary();
  const movement = useDashboardMovement(range);

  const s = summary.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{s ? formatDate(s.date) : ' '}</p>
          <h1 className="text-xl font-bold sm:text-2xl">
            {greeting()}, {user.name.split(' ')[0]}
          </h1>
        </div>
        {canAny(P.INVENTORY_IN, P.INVENTORY_OUT) && (
          <Button to="/stock" variant="brand">
            Stock IN / OUT
          </Button>
        )}
      </div>

      {summary.isPending && <DashboardSkeleton />}
      {summary.isError && <ErrorState error={summary.error} onRetry={() => summary.refetch()} />}

      {s && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Today's Stock IN"
              value={formatNumber(s.today.stockIn)}
              hint={`${s.today.inCount} entries`}
              icon={ArrowDownToLine}
              accent="in"
              to="/inventory/ledger?types=IN%2COPENING"
            />
            <StatCard
              label="Today's Stock OUT"
              value={formatNumber(s.today.stockOut)}
              hint={`${s.today.outCount} entries`}
              icon={ArrowUpFromLine}
              accent="out"
              to="/inventory/ledger?types=OUT%2CINVOICE_OUT"
            />
            {'salesValue' in s.today && (
              <>
                <StatCard
                  label="Today's Invoices"
                  value={formatNumber(s.today.invoiceCount)}
                  icon={FileText}
                  accent="brand"
                  to="/invoices"
                />
                <StatCard
                  label="Today's Sales"
                  value={formatCurrency(s.today.salesValue)}
                  icon={IndianRupee}
                  accent="brand"
                />
              </>
            )}
            <StatCard
              label="Total Products"
              value={formatNumber(s.totalProducts)}
              icon={Package}
              to={can(P.PRODUCTS_VIEW) ? '/products' : undefined}
            />
            <StatCard
              label="Total Stock Qty"
              value={formatCompact(s.totalStockQuantity)}
              hint={'stockValue' in s ? `Value ${formatCurrency(s.stockValue)}` : undefined}
              icon={Boxes}
            />
            <StatCard
              label="Low Stock"
              value={formatNumber(s.lowStockCount)}
              icon={AlertTriangle}
              accent="warning"
              to={can(P.INVENTORY_VIEW) ? '/inventory?stockStatus=low' : undefined}
            />
            <StatCard
              label="Out of Stock"
              value={formatNumber(s.outOfStockCount)}
              icon={PackageX}
              accent="out"
              to={can(P.INVENTORY_VIEW) ? '/inventory?stockStatus=out' : undefined}
            />
          </div>

          <Card>
            <CardHeader
              title="Stock IN vs OUT"
              action={
                <div
                  role="tablist"
                  aria-label="Chart range"
                  className="flex rounded-lg bg-slate-100 p-1"
                >
                  {RANGES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      role="tab"
                      aria-selected={range === r.value}
                      onClick={() => setRange(r.value)}
                      className={cn(
                        'rounded-md px-2.5 py-1.5 text-xs font-semibold',
                        range === r.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500',
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              }
            />
            <div className="p-4">
              {movement.isError ? (
                <ErrorState error={movement.error} onRetry={() => movement.refetch()} />
              ) : movement.data ? (
                <MovementChart data={movement.data} range={range} />
              ) : (
                <Skeleton className="h-64" />
              )}
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Low stock" subtitle="At or below minimum level" />
              {s.lowStock.length === 0 ? (
                <EmptyState
                  title="All stocked up"
                  message="No products are below their minimum level."
                />
              ) : (
                <ul className="mt-2 divide-y divide-slate-100">
                  {s.lowStock.map((p) => (
                    <li key={p.id}>
                      <Link
                        to={`/products/${p.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="truncate text-xs text-slate-500">
                            {p.sku} · min {formatNumber(p.minStockLevel)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'tabular shrink-0 font-bold',
                            Number(p.stockQuantity) <= 0 ? 'text-red-600' : 'text-amber-600',
                          )}
                        >
                          {formatQty(p.stockQuantity, p.unitCode)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Top moving products"
                subtitle={`Most issued in the last ${s.topProductsDays} days`}
              />
              {s.topProducts.length === 0 ? (
                <EmptyState title="No stock issued yet" />
              ) : (
                <ol className="mt-2 divide-y divide-slate-100">
                  {s.topProducts.map((p, index) => (
                    <li key={p.id}>
                      <Link
                        to={`/products/${p.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="truncate text-xs text-slate-500">
                            {p.sku} · {p.movements} issues
                          </p>
                        </div>
                        <span className="tabular shrink-0 font-semibold">
                          {formatQty(p.quantityOut, p.unitCode)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
