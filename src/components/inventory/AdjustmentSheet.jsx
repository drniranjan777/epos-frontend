import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { useStockAdjustment } from '../../hooks/useInventory';
import { useActiveMasterList } from '../../hooks/useMasters';
import { applyFieldErrors, getErrorMessage } from '../../utils/apiError';
import { cn } from '../../utils/cn';
import { formatQty, todayIso } from '../../utils/format';
import { Button } from '../common/Button';
import { Sheet } from '../common/Sheet';
import { SelectField, TextAreaField, TextField } from '../forms/Field';

const MODES = [
  { value: 'SET', label: 'Set count', hint: 'Enter the physical count; the difference is booked.' },
  { value: 'IN', label: 'Add', hint: 'Increase stock by the quantity.' },
  { value: 'OUT', label: 'Remove', hint: 'Decrease stock by the quantity.' },
];

/** Admin stock adjustment with a mandatory reason code and explanation. */
export function AdjustmentSheet({ product, open, onClose }) {
  const codes = useActiveMasterList('adjustmentCodes');
  const adjust = useStockAdjustment();
  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      mode: 'SET',
      quantity: String(product.stockQuantity),
      adjustmentCodeId: '',
      reason: '',
      date: todayIso(),
    },
  });
  const mode = useWatch({ control, name: 'mode' });
  const quantity = Number(useWatch({ control, name: 'quantity' }));
  const current = Number(product.stockQuantity);

  // Only offer reason codes that allow the resulting direction.
  const direction = mode === 'SET' ? (quantity >= current ? 'IN' : 'OUT') : mode;
  const allowedCodes = (codes.data ?? []).filter(
    (c) => c.direction === 'BOTH' || c.direction === direction,
  );
  const preview =
    mode === 'SET' ? quantity : mode === 'IN' ? current + quantity : current - quantity;

  async function onSubmit(values) {
    try {
      await adjust.mutateAsync({
        productId: product.id,
        mode: values.mode,
        quantity: Number(values.quantity),
        adjustmentCodeId: Number(values.adjustmentCodeId),
        reason: values.reason,
        date: values.date || undefined,
        notes: values.notes || undefined,
      });
      toast.success(`Stock adjusted to ${formatQty(preview, product.unitCode)}`);
      onClose();
    } catch (error) {
      if (!applyFieldErrors(error, setError)) toast.error(getErrorMessage(error));
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Adjust stock"
      description={`${product.name} · current ${formatQty(current, product.unitCode)}`}
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onClose} disabled={adjust.isPending}>
            Cancel
          </Button>
          <Button fullWidth loading={adjust.isPending} onClick={handleSubmit(onSubmit)}>
            Save adjustment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div role="radiogroup" aria-label="Adjustment type" className="grid grid-cols-3 gap-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={mode === m.value}
              onClick={() => {
                setValue('mode', m.value);
                setValue('quantity', m.value === 'SET' ? String(current) : '');
                setValue('adjustmentCodeId', '');
              }}
              className={cn(
                'h-11 rounded-lg text-sm font-semibold ring-1',
                mode === m.value
                  ? 'bg-slate-900 text-white ring-slate-900'
                  : 'bg-white text-slate-700 ring-slate-300',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-500">{MODES.find((m) => m.value === mode).hint}</p>

        <TextField
          label={mode === 'SET' ? 'Physical count' : 'Quantity'}
          inputMode={product.unitAllowDecimal ? 'decimal' : 'numeric'}
          register={register('quantity', {
            validate: (v) => {
              const n = Number(v);
              if (v === '' || Number.isNaN(n)) return 'Enter a quantity';
              if (n < 0 || (mode !== 'SET' && n === 0)) return 'Quantity must be greater than 0';
              if (!product.unitAllowDecimal && !Number.isInteger(n)) return 'Whole numbers only';
              if (mode === 'SET' && n === current) return 'Count matches current stock';
              if (mode === 'OUT' && n > current) return `Only ${current} in stock`;
              return true;
            },
          })}
          error={errors.quantity}
        />

        {!Number.isNaN(preview) && preview >= 0 && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
            New stock will be{' '}
            <span className="font-semibold">{formatQty(preview, product.unitCode)}</span>
          </p>
        )}

        <SelectField
          label="Reason code"
          required
          register={register('adjustmentCodeId', { required: 'Select a reason' })}
          error={errors.adjustmentCodeId}
        >
          <option value="">Select reason</option>
          {allowedCodes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Explanation"
          required
          placeholder="What happened?"
          register={register('reason', { required: 'Explain the adjustment', maxLength: 255 })}
          error={errors.reason}
        />
        <TextField
          label="Date"
          type="date"
          max={todayIso()}
          register={register('date')}
          error={errors.date}
        />
        <TextAreaField label="Notes" rows={2} register={register('notes')} />
      </form>
    </Sheet>
  );
}
