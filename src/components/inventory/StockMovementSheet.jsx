import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useStockIn, useStockOut } from '../../hooks/useInventory';
import { applyFieldErrors, getErrorMessage } from '../../utils/apiError';
import { cn } from '../../utils/cn';
import { formatQty, todayIso } from '../../utils/format';
import { Button } from '../common/Button';
import { Sheet } from '../common/Sheet';
import { CustomerPicker } from '../forms/CustomerPicker';
import { TextAreaField, TextField } from '../forms/Field';
import { QuantityInput } from '../forms/QuantityInput';

function validateQuantity(raw, { allowDecimal, max }) {
  const value = Number(raw);
  if (raw === '' || Number.isNaN(value)) return 'Enter a quantity';
  if (value <= 0) return 'Quantity must be greater than 0';
  if (!allowDecimal && !Number.isInteger(value)) return 'Whole numbers only for this unit';
  if (max !== undefined && value > max) return `Only ${max} available`;
  return true;
}

const optional = (value) => (value === '' ? undefined : value);

/**
 * Stock IN / OUT form in a bottom sheet. Quantity and Confirm come first; the rest
 * (price, party, reference, date, notes) is tucked under "More details" to keep
 * the common case to a couple of taps.
 */
export function StockMovementSheet({ product, mode, open, onClose, onDone }) {
  const isIn = mode === 'IN';
  const available = Number(product?.stockQuantity ?? 0);
  const [showMore, setShowMore] = useState(false);
  const stockIn = useStockIn();
  const stockOut = useStockOut();
  const mutation = isIn ? stockIn : stockOut;

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: { quantity: '1', customer: null, date: todayIso() },
  });

  async function onSubmit(values) {
    const common = {
      productId: product.id,
      quantity: Number(values.quantity),
      reference: optional(values.reference),
      date: values.date || undefined,
      notes: optional(values.notes),
    };
    const payload = isIn
      ? {
          ...common,
          purchasePrice: optional(values.purchasePrice),
          supplier: optional(values.supplier),
        }
      : { ...common, customerId: values.customer?.id, reason: optional(values.reason) };

    try {
      const txn = await mutation.mutateAsync(payload);
      toast.success(
        `${isIn ? 'Stock IN' : 'Stock OUT'} saved · ${product.name}: ${formatQty(txn.previousBalance, product.unitCode)} → ${formatQty(txn.newBalance, product.unitCode)}`,
      );
      onDone?.(txn);
      onClose();
    } catch (error) {
      if (!applyFieldErrors(error, setError)) toast.error(getErrorMessage(error));
    }
  }

  if (!product) return null;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isIn ? 'Stock IN' : 'Stock OUT'}
      description={`${product.name} · ${product.sku}`}
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            variant={isIn ? 'in' : 'out'}
            fullWidth
            size="lg"
            loading={mutation.isPending}
            onClick={handleSubmit(onSubmit)}
            disabled={!isIn && available <= 0}
          >
            Confirm {isIn ? 'IN' : 'OUT'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div
          className={cn(
            'flex items-center justify-between rounded-xl px-4 py-3',
            isIn ? 'bg-stock-in-soft' : 'bg-stock-out-soft',
          )}
        >
          <span className="text-sm font-medium text-slate-700">Available now</span>
          <span className="tabular text-lg font-bold">
            {formatQty(available, product.unitCode)}
          </span>
        </div>

        {!isIn && available <= 0 ? (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
          >
            This product is out of stock. Record a Stock IN first.
          </p>
        ) : (
          <Controller
            name="quantity"
            control={control}
            rules={{
              validate: (v) =>
                validateQuantity(v, {
                  allowDecimal: product.unitAllowDecimal,
                  max: isIn ? undefined : available,
                }),
            }}
            render={({ field, fieldState }) => (
              <QuantityInput
                value={field.value}
                onChange={field.onChange}
                allowDecimal={product.unitAllowDecimal}
                unit={product.unitCode}
                max={isIn ? undefined : available}
                error={fieldState.error?.message}
                autoFocus
              />
            )}
          />
        )}

        {!isIn && (
          <Controller
            name="customer"
            control={control}
            render={({ field }) => (
              <CustomerPicker value={field.value} onChange={field.onChange} optional />
            )}
          />
        )}

        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg py-2 text-sm font-medium text-slate-600"
          aria-expanded={showMore}
        >
          More details
          <ChevronDown className={cn('size-5 transition', showMore && 'rotate-180')} aria-hidden />
        </button>

        {showMore && (
          <div className="space-y-4">
            {isIn ? (
              <>
                <TextField
                  label="Purchase price (per unit)"
                  inputMode="decimal"
                  register={register('purchasePrice')}
                  error={errors.purchasePrice}
                />
                <TextField
                  label="Supplier"
                  register={register('supplier')}
                  error={errors.supplier}
                />
              </>
            ) : (
              <TextField
                label="Reason"
                placeholder="e.g. Counter sale, Service job"
                register={register('reason')}
                error={errors.reason}
              />
            )}
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Reference"
                placeholder={isIn ? 'Bill / PO no.' : 'Job / DC no.'}
                register={register('reference')}
                error={errors.reference}
              />
              <TextField
                label="Date"
                type="date"
                max={todayIso()}
                register={register('date')}
                error={errors.date}
              />
            </div>
            <TextAreaField
              label="Notes"
              rows={2}
              register={register('notes')}
              error={errors.notes}
            />
          </div>
        )}
        {/* Enables submit with the keyboard's Go/Enter key. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Sheet>
  );
}
