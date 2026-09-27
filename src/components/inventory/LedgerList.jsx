import { Link } from 'react-router';
import { TXN_TYPES } from '../../constants/app';
import { cn } from '../../utils/cn';
import { formatDate, formatNumber, formatSignedQty } from '../../utils/format';
import { Badge } from '../common/Badge';
import { DataView } from '../common/DataView';

function TypeBadge({ type }) {
  const meta = TXN_TYPES[type] ?? { label: type, direction: 'in' };
  return <Badge tone={meta.direction === 'in' ? 'success' : 'danger'}>{meta.label}</Badge>;
}

function Qty({ value }) {
  return (
    <span className={cn('tabular font-semibold', value > 0 ? 'text-stock-in' : 'text-stock-out')}>
      {formatSignedQty(value)}
    </span>
  );
}

/** Details column: party, reference, reason — whatever the entry has. */
function describe(txn) {
  return [txn.customerName, txn.partyName, txn.referenceNo, txn.reason].filter(Boolean).join(' · ');
}

/**
 * Inventory ledger entries. `showProduct` adds the product column (global ledger);
 * it is hidden on a single product's page.
 */
export function LedgerList({ items, showProduct = false }) {
  const columns = [
    {
      header: 'Date',
      cell: (t) => <span className="whitespace-nowrap">{formatDate(t.txnDate)}</span>,
    },
    ...(showProduct
      ? [
          {
            header: 'Product',
            cell: (t) => (
              <Link
                to={`/products/${t.productId}`}
                className="relative z-10 font-medium hover:underline"
              >
                {t.productName}
                <span className="block text-xs font-normal text-slate-500">{t.sku}</span>
              </Link>
            ),
          },
        ]
      : []),
    { header: 'Type', cell: (t) => <TypeBadge type={t.type} /> },
    { header: 'Qty', align: 'right', cell: (t) => <Qty value={t.quantity} /> },
    { header: 'Previous', align: 'right', cell: (t) => formatNumber(t.previousBalance) },
    {
      header: 'New balance',
      align: 'right',
      cell: (t) => <span className="font-semibold">{formatNumber(t.newBalance)}</span>,
    },
    {
      header: 'Details',
      cell: (t) => <span className="text-slate-600">{describe(t) || '—'}</span>,
      className: 'max-w-xs',
    },
    { header: 'User', cell: (t) => t.userName },
  ];

  return (
    <DataView
      items={items}
      columns={columns}
      renderCard={(t) => (
        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <TypeBadge type={t.type} />
              <span className="text-xs text-slate-500">{formatDate(t.txnDate)}</span>
            </div>
            <Qty value={t.quantity} />
          </div>
          {showProduct && <p className="mt-1.5 truncate font-medium">{t.productName}</p>}
          <div className="mt-1 flex items-center justify-between gap-3 text-sm text-slate-500">
            <span className="truncate">{describe(t) || t.userName}</span>
            <span className="tabular shrink-0">
              {formatNumber(t.previousBalance)} →{' '}
              <span className="font-semibold text-slate-800">
                {formatNumber(t.newBalance)} {t.unitCode}
              </span>
            </span>
          </div>
          {describe(t) && <p className="mt-0.5 text-xs text-slate-400">by {t.userName}</p>}
        </div>
      )}
    />
  );
}
