import { ChevronRight, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '../../utils/cn';
import { formatCurrency, formatQty } from '../../utils/format';
import { StockBadge } from '../inventory/StockBadge';

/** Asks about one part from a list ("its stock" with that part as context). */
function askAbout(onAsk, part) {
  onAsk('its stock', {
    display: part.name ?? part.part,
    context: { productId: part.id ?? part.productId },
  });
}

function PartCard({ part, canOpen, onNavigate }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{part.name}</p>
          <p className="truncate text-xs text-slate-500">
            {part.sku}
            {part.partNumber && ` · ${part.partNumber}`}
            {part.machineModel && ` · ${part.machineModel}`}
          </p>
        </div>
        <StockBadge product={part} />
      </div>

      <ul className="mt-3 divide-y divide-slate-100 rounded-lg bg-slate-50 text-sm">
        {part.branches.map((b) => (
          <li key={b.branchId} className="flex items-center justify-between gap-2 px-3 py-2">
            <span className={cn('flex items-center gap-1.5', b.isCurrent && 'font-semibold')}>
              <MapPin className="size-3.5 text-slate-400" aria-hidden />
              {b.branchName}
              {b.isCurrent && (
                <span className="text-xs font-normal text-slate-500">(this branch)</span>
              )}
            </span>
            <span
              className={cn(
                'font-semibold tabular-nums',
                Number(b.quantity) <= 0 ? 'text-red-600' : 'text-slate-900',
              )}
            >
              {formatQty(b.quantity, part.unitCode)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-slate-500">Price</dt>
          <dd className="font-semibold text-slate-900">{formatCurrency(part.sellingPrice)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">MRP</dt>
          <dd className="font-semibold text-slate-900">{formatCurrency(part.mrp)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Min level</dt>
          <dd className="font-semibold text-slate-900">{formatQty(part.minStockLevel)}</dd>
        </div>
        {part.purchasePrice !== undefined && (
          <div>
            <dt className="text-slate-500">Purchase</dt>
            <dd className="font-semibold text-slate-900">{formatCurrency(part.purchasePrice)}</dd>
          </div>
        )}
      </dl>

      {canOpen && (
        <Link
          to={`/products/${part.id}`}
          onClick={onNavigate}
          className="text-brand-700 mt-3 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
        >
          Open product <ChevronRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

function PartsCard({ title, parts, onAsk }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <p className="border-b border-slate-100 px-3 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {title}
      </p>
      <ul className="divide-y divide-slate-100">
        {parts.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => askAbout(onAsk, p)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-900">{p.name}</span>
                <span className="block truncate text-xs text-slate-500">
                  {p.sku}
                  {p.partNumber && ` · ${p.partNumber}`}
                </span>
              </span>
              <span className="flex flex-col items-end gap-0.5">
                <span className="text-sm font-semibold tabular-nums">
                  {formatQty(p.stockQuantity, p.unitCode)}
                </span>
                <StockBadge product={p} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TableCard({ title, columns, rows, onAsk }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <p className="border-b border-slate-100 px-3 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {title}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    'px-3 py-2 font-medium whitespace-nowrap',
                    c.align === 'right' ? 'text-right' : 'text-left',
                  )}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.productId}>
                {columns.map((c, index) => (
                  <td
                    key={c.key}
                    className={cn(
                      'px-3 py-2',
                      c.align === 'right'
                        ? 'text-right whitespace-nowrap tabular-nums'
                        : 'text-left',
                    )}
                  >
                    {index === 0 ? (
                      <button
                        type="button"
                        onClick={() => askAbout(onAsk, row)}
                        className="text-left font-medium text-slate-900 hover:underline"
                      >
                        {row[c.key]}
                        {row.sku && (
                          <span className="block text-xs font-normal text-slate-500">
                            {row.sku}
                          </span>
                        )}
                      </button>
                    ) : (
                      row[c.key]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Renders the cards of one Ask Stock answer. */
export function AskStockCards({ cards, onAsk, canOpenProducts, onNavigate }) {
  if (!cards?.length) return null;
  return (
    <div className="mt-2 space-y-2">
      {cards.map((card, index) => {
        if (card.type === 'part') {
          return (
            <PartCard
              key={index}
              part={card.part}
              canOpen={canOpenProducts}
              onNavigate={onNavigate}
            />
          );
        }
        if (card.type === 'parts') return <PartsCard key={index} {...card} onAsk={onAsk} />;
        if (card.type === 'table') return <TableCard key={index} {...card} onAsk={onAsk} />;
        return null;
      })}
    </div>
  );
}
