import { Minus, Plus, Trash2 } from 'lucide-react';
import { lineAmount, priceChange } from '../../hooks/useStockCart';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/format';

function step(line, delta, capped) {
  const next = Math.max(0, Math.round(((Number(line.quantity) || 0) + delta) * 1000) / 1000);
  return String(capped ? Math.min(next, line.available) : next);
}

function Stepper({ line, capped, onChange, invalid }) {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-stretch overflow-hidden rounded-lg bg-white ring-1',
        invalid ? 'ring-red-400' : 'ring-slate-300',
      )}
    >
      <button
        type="button"
        onClick={() => onChange(step(line, -1, capped))}
        className="flex w-9 items-center justify-center text-slate-600 active:bg-slate-100"
        aria-label={`Decrease ${line.name}`}
      >
        <Minus className="size-4" />
      </button>
      <input
        type="text"
        inputMode={line.allowDecimal ? 'decimal' : 'numeric'}
        value={line.quantity}
        onChange={(e) =>
          onChange(e.target.value.replace(line.allowDecimal ? /[^0-9.]/g : /[^0-9]/g, ''))
        }
        onFocus={(e) => e.target.select()}
        aria-label={`Quantity of ${line.name}`}
        aria-invalid={invalid || undefined}
        className="tabular w-12 border-0 p-0 text-center text-sm font-semibold focus:ring-0 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(step(line, 1, capped))}
        className="flex w-9 items-center justify-center text-slate-600 active:bg-slate-100"
        aria-label={`Increase ${line.name}`}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

/** Digits with at most one decimal point and two decimals, as typed. */
function cleanPrice(value) {
  const [whole, ...rest] = value.replace(/[^0-9.]/g, '').split('.');
  return rest.length ? `${whole}.${rest.join('').slice(0, 2)}` : whole;
}

/** Purchase price of a Stock IN line; highlighted when it differs from the current price. */
function PriceInput({ line, onChange, invalid }) {
  const change = priceChange(line);
  return (
    <div
      className={cn(
        'flex h-10 w-full items-center rounded-lg bg-white px-2.5 ring-1 sm:w-28',
        invalid ? 'ring-red-400' : change ? 'ring-brand-400' : 'ring-slate-300',
      )}
    >
      <span className="text-sm text-slate-500" aria-hidden>
        ₹
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={line.purchasePrice ?? ''}
        onChange={(e) => onChange(cleanPrice(e.target.value))}
        onFocus={(e) => e.target.select()}
        aria-label={`Purchase price of ${line.name}`}
        aria-invalid={invalid || undefined}
        className="tabular w-full min-w-0 border-0 p-0 pl-1 text-right text-sm font-semibold focus:ring-0 focus:outline-none"
      />
    </div>
  );
}

/** "Was ₹100.00 · ₹15.00 more" under a changed price, plus the line amount. */
function PriceNote({ line }) {
  const change = priceChange(line);
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
      {change !== 0 && (
        <span className="text-brand-700 font-semibold">
          Was {formatCurrency(line.previousPrice)} · {formatCurrency(Math.abs(change))}{' '}
          {change > 0 ? 'more' : 'less'}
        </span>
      )}
      <span className="tabular">Amount {formatCurrency(lineAmount(line))}</span>
    </p>
  );
}

/**
 * Parts in the entry: line number, part, quantity stepper and delete. With `priced`
 * (Stock IN) each line also has its purchase price.
 * `serverErrors` holds per-product messages returned by the API (e.g. stock ran out).
 */
export function CartTable({
  lines,
  errors,
  serverErrors = {},
  capped,
  priced = false,
  onQuantity,
  onPrice,
  onRemove,
}) {
  if (!lines.length) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
        No parts added yet. Search above and tap a part to add it.
      </div>
    );
  }

  const columns = priced
    ? 'sm:grid-cols-[1fr_auto_auto_auto_auto]'
    : 'sm:grid-cols-[1fr_auto_auto_auto]';

  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
      <div
        className={cn(
          'hidden items-center gap-3 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600 sm:grid',
          columns,
        )}
      >
        <span>Part</span>
        {priced && <span className="w-28 text-right">Purchase price</span>}
        <span className="w-8 text-right">#</span>
        <span className="w-[7.5rem] text-center">Qty</span>
        <span className="w-10 text-center">Delete</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {lines.map((line, index) => {
          const error = serverErrors[line.productId] ?? errors[line.productId];
          const priceInvalid = priced && error === 'Enter the purchase price';
          return (
            <li key={line.productId} className="px-4 py-3">
              <div className={cn('grid grid-cols-[1fr_auto_auto] items-center gap-3', columns)}>
                <div className="col-span-3 min-w-0 sm:col-span-1">
                  <p className="truncate text-sm font-medium text-slate-900">{line.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {[line.sku, line.partNumber].filter(Boolean).join(' · ')}
                    {capped && ` · ${line.available} ${line.unitCode} available`}
                  </p>
                </div>
                {priced && (
                  <PriceInput
                    line={line}
                    invalid={priceInvalid}
                    onChange={(price) => onPrice(line.productId, price)}
                  />
                )}
                {/* On phones the price takes the place of the line number. */}
                <span
                  className={cn(
                    'tabular w-8 text-right text-sm text-slate-500',
                    priced && 'max-sm:hidden',
                  )}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <Stepper
                  line={line}
                  capped={capped}
                  invalid={Boolean(error) && !priceInvalid}
                  onChange={(quantity) => onQuantity(line.productId, quantity)}
                />
                <button
                  type="button"
                  onClick={() => onRemove(line.productId)}
                  className="flex size-10 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remove ${line.name}`}
                >
                  <Trash2 className="size-5" />
                </button>
              </div>
              {priced && <PriceNote line={line} />}
              {error && (
                <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                  {error}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
