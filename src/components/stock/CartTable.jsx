import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';

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

/**
 * Parts in the entry: line number, part, quantity stepper and delete.
 * `serverErrors` holds per-product messages returned by the API (e.g. stock ran out).
 */
export function CartTable({ lines, errors, serverErrors = {}, capped, onQuantity, onRemove }) {
  if (!lines.length) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
        No parts added yet. Search above and tap a part to add it.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
      <div className="hidden grid-cols-[1fr_auto_auto_auto] items-center gap-3 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600 sm:grid">
        <span>Part</span>
        <span className="w-8 text-right">#</span>
        <span className="w-[7.5rem] text-center">Qty</span>
        <span className="w-10 text-center">Delete</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {lines.map((line, index) => {
          const error = serverErrors[line.productId] ?? errors[line.productId];
          return (
            <li key={line.productId} className="px-4 py-3">
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
                <div className="col-span-3 min-w-0 sm:col-span-1">
                  <p className="truncate text-sm font-medium text-slate-900">{line.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {[line.sku, line.partNumber].filter(Boolean).join(' · ')}
                    {capped && ` · ${line.available} ${line.unitCode} available`}
                  </p>
                </div>
                <span className="tabular w-8 text-right text-sm text-slate-500">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <Stepper
                  line={line}
                  capped={capped}
                  invalid={Boolean(error)}
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
