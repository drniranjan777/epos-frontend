import { RotateCcw } from 'lucide-react';
import { formatCurrency, partsSummary } from '../../utils/format';
import { Button } from '../common/Button';

/**
 * "4 parts · 5 units" with Reset and the primary action, sticky at the bottom.
 * `showAmount` adds the value of the entry before tax (Stock IN with purchase prices).
 */
export function CartFooter({
  totals,
  showAmount = false,
  actionLabel,
  actionVariant,
  onReset,
  onSubmit,
  loading,
  disabled,
}) {
  return (
    <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mx-4 mt-6 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:mx-0 lg:rounded-xl lg:border">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-slate-900 sm:text-lg">
            {partsSummary(totals.parts, totals.units)}
          </p>
          {showAmount && totals.parts > 0 && (
            <p className="tabular text-sm text-slate-500">
              {formatCurrency(totals.amount)} before tax
            </p>
          )}
        </div>
        <Button variant="secondary" onClick={onReset} disabled={loading || totals.parts === 0}>
          <RotateCcw className="size-4" aria-hidden />
          Reset
        </Button>
        <Button
          variant={actionVariant}
          className="min-w-28 sm:min-w-40"
          onClick={onSubmit}
          loading={loading}
          disabled={disabled}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
