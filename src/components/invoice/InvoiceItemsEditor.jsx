import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';
import { formatCurrency, formatQty } from '../../utils/format';
import { lineTotal } from '../../utils/gst';
import { Button } from '../common/Button';
import { Input } from '../forms/Field';
import { ProductPickerSheet } from './ProductPickerSheet';

function NumberBox({ label, register, error, inputMode = 'decimal', className }) {
  return (
    <label className={className}>
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      <Input
        inputMode={inputMode}
        className="tabular h-11 text-right"
        invalid={Boolean(error)}
        {...register}
      />
      {error && <span className="mt-0.5 block text-xs text-red-600">{error.message}</span>}
    </label>
  );
}

/**
 * Invoice line items. Each line keeps a snapshot of product info for display;
 * only productId, quantity, rate and discount are sent to the API.
 */
export function InvoiceItemsEditor({ control, register, errors, supplyType }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'items', keyName: 'key' });
  const items = useWatch({ control, name: 'items' });
  const [pickerOpen, setPickerOpen] = useState(false);

  function addProduct(product) {
    const index = items.findIndex((i) => i.productId === product.id);
    if (index === -1) {
      append({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        unitCode: product.unitCode,
        allowDecimal: product.unitAllowDecimal,
        stock: Number(product.stockQuantity),
        gstRate: Number(product.gstRate ?? 0),
        quantity: '1',
        rate: String(product.sellingPrice),
        discountPercent: '0',
      });
    }
    setPickerOpen(false);
  }

  const qtyRules = (item) => ({
    validate: (v) => {
      const n = Number(v);
      if (v === '' || Number.isNaN(n) || n <= 0) return 'Enter quantity';
      if (!item?.allowDecimal && !Number.isInteger(n)) return 'Whole numbers';
      return true;
    },
  });

  return (
    <div>
      {errors?.items?.root?.message && (
        <p className="mb-2 text-sm text-red-600" role="alert">
          {errors.items.root.message}
        </p>
      )}
      {fields.length === 0 ? (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex w-full flex-col items-center rounded-xl border-2 border-dashed border-slate-300 px-4 py-8 text-slate-500 hover:border-slate-400"
        >
          <Plus className="mb-1 size-6" aria-hidden />
          <span className="font-medium">Add the first item</span>
        </button>
      ) : (
        <ul className="space-y-3">
          {fields.map((field, index) => {
            const item = items[index] ?? field;
            const itemErrors = errors?.items?.[index];
            const overStock = Number(item.quantity) > item.stock;
            return (
              <li key={field.key} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.sku} · GST {item.gstRate}% · in stock{' '}
                      {formatQty(item.stock, item.unitCode)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="-mt-1 -mr-1 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="size-5" />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <NumberBox
                    label={`Qty (${item.unitCode})`}
                    inputMode={item.allowDecimal ? 'decimal' : 'numeric'}
                    register={register(`items.${index}.quantity`, qtyRules(item))}
                    error={itemErrors?.quantity}
                  />
                  <NumberBox
                    label="Rate (₹)"
                    register={register(`items.${index}.rate`, {
                      validate: (v) => (v !== '' && Number(v) >= 0) || 'Enter rate',
                    })}
                    error={itemErrors?.rate}
                  />
                  <NumberBox
                    label="Disc %"
                    register={register(`items.${index}.discountPercent`, {
                      validate: (v) => v === '' || (Number(v) >= 0 && Number(v) <= 100) || '0–100',
                    })}
                    error={itemErrors?.discountPercent}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  {overStock ? (
                    <span className="font-medium text-amber-700">More than available stock</span>
                  ) : (
                    <span />
                  )}
                  <span className="tabular font-semibold">
                    {formatCurrency(lineTotal(item, supplyType))}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {fields.length > 0 && (
        <Button variant="secondary" fullWidth className="mt-3" onClick={() => setPickerOpen(true)}>
          <Plus className="size-5" aria-hidden />
          Add item
        </Button>
      )}

      {pickerOpen && (
        <ProductPickerSheet
          open
          onClose={() => setPickerOpen(false)}
          onPick={addProduct}
          selectedIds={items.map((i) => i.productId)}
        />
      )}
    </div>
  );
}
