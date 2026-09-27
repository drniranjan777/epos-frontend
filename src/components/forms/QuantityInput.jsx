import { Minus, Plus } from 'lucide-react';
import { useId } from 'react';
import { cn } from '../../utils/cn';

/**
 * Large quantity input with − / + steppers for gloved or one-handed use.
 * Value is kept as a string so partially typed decimals ("2.") are not lost.
 */
export function QuantityInput({
  value,
  onChange,
  allowDecimal,
  unit,
  label = 'Quantity',
  error,
  max,
  autoFocus,
}) {
  const id = useId();
  const numeric = Number(value) || 0;
  const step = (delta) => {
    const next = Math.max(0, Math.round((numeric + delta) * 1000) / 1000);
    onChange(String(max !== undefined ? Math.min(next, max) : next));
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div
        className={cn(
          'focus-within:ring-brand-500 flex items-stretch overflow-hidden rounded-xl ring-1 ring-slate-300 focus-within:ring-2',
          error && 'ring-red-400',
        )}
      >
        <button
          type="button"
          onClick={() => step(-1)}
          className="flex w-14 items-center justify-center bg-slate-50 text-slate-700 active:bg-slate-200"
          aria-label="Decrease quantity"
        >
          <Minus className="size-5" />
        </button>
        <div className="relative flex-1">
          <input
            id={id}
            type="text"
            inputMode={allowDecimal ? 'decimal' : 'numeric'}
            autoComplete="off"
            value={value}
            autoFocus={autoFocus}
            data-autofocus={autoFocus || undefined}
            onChange={(e) =>
              onChange(e.target.value.replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, ''))
            }
            onFocus={(e) => e.target.select()}
            aria-invalid={error ? true : undefined}
            className="tabular h-14 w-full border-0 bg-white text-center text-2xl font-bold text-slate-900 focus:outline-none"
          />
          {unit && (
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm font-medium text-slate-400">
              {unit}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => step(1)}
          className="flex w-14 items-center justify-center bg-slate-50 text-slate-700 active:bg-slate-200"
          aria-label="Increase quantity"
        >
          <Plus className="size-5" />
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
