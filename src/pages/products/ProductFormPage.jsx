import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorState, ListSkeleton } from '../../components/common/States';
import { StickyActionBar } from '../../components/common/StickyActionBar';
import { SelectField, Switch, TextAreaField, TextField } from '../../components/forms/Field';
import { useActiveMasterList } from '../../hooks/useMasters';
import { useProduct, useSaveProduct } from '../../hooks/useProducts';
import { applyFieldErrors, getErrorMessage } from '../../utils/apiError';
import {
  emptyToNull,
  numberField,
  optionalIdField,
  requiredIdField,
  toFormValues,
} from '../../utils/formHelpers';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Product name is required').max(200),
    sku: z
      .string()
      .trim()
      .min(1, 'SKU is required')
      .max(60)
      .regex(/^[A-Za-z0-9][A-Za-z0-9\-_/.]*$/, 'Letters, numbers and - _ / . only'),
    partNumber: z.string().max(80),
    categoryId: optionalIdField,
    brandId: optionalIdField,
    machineModel: z.string().max(120),
    unitId: requiredIdField('Select a unit'),
    hsnCode: z
      .string()
      .trim()
      .regex(/^([0-9]{4,8})?$/, 'HSN must be 4 to 8 digits'),
    gstRateId: optionalIdField,
    purchasePrice: numberField(),
    sellingPrice: numberField(),
    mrp: numberField(),
    minStockLevel: numberField(),
    openingStock: numberField(),
    description: z.string().max(2000),
    isActive: z.boolean(),
  })
  .refine((d) => !d.mrp || d.sellingPrice <= d.mrp, {
    path: ['sellingPrice'],
    message: 'Selling price cannot be higher than MRP',
  });

const FIELDS = [
  'name',
  'sku',
  'partNumber',
  'categoryId',
  'brandId',
  'machineModel',
  'unitId',
  'hsnCode',
  'gstRateId',
  'purchasePrice',
  'sellingPrice',
  'mrp',
  'minStockLevel',
  'description',
];

const EMPTY = { ...toFormValues({}, FIELDS), openingStock: '', isActive: true };

function Section({ title, children }) {
  return (
    <Card className="p-4">
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

export function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const product = useProduct(id);
  const save = useSaveProduct(id);
  const categories = useActiveMasterList('categories');
  const brands = useActiveMasterList('brands');
  const units = useActiveMasterList('units');
  const gstRates = useActiveMasterList('gstRates');

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (product.data) {
      reset({
        ...toFormValues(product.data, FIELDS),
        openingStock: '',
        isActive: product.data.isActive,
      });
    }
  }, [product.data, reset]);

  async function onSubmit(values) {
    const { openingStock, ...rest } = emptyToNull(values);
    const payload = isEdit ? rest : { ...rest, openingStock };
    try {
      const saved = await save.mutateAsync(payload);
      toast.success(isEdit ? 'Product updated' : 'Product created');
      navigate(`/products/${saved.id}`, { replace: true });
    } catch (error) {
      if (!applyFieldErrors(error, setError)) toast.error(getErrorMessage(error));
    }
  }

  // Selects must have their options before values are applied, or the wrong option shows.
  const listsLoading = [categories, brands, units, gstRates].some((q) => q.isPending);
  if (listsLoading || (isEdit && product.isPending)) return <ListSkeleton rows={8} />;
  if (isEdit && product.isError) {
    return <ErrorState error={product.error} onRetry={() => product.refetch()} />;
  }

  // Keep a now-inactive master visible when editing a product that still uses it.
  const withCurrent = (list, currentId, currentLabel) => {
    const items = list ?? [];
    if (!currentId || items.some((i) => i.id === currentId)) return items;
    return [...items, { id: currentId, name: `${currentLabel} (inactive)` }];
  };
  const p = product.data;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={isEdit ? 'Edit product' : 'New product'}
        backTo={isEdit ? `/products/${id}` : '/products'}
      />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Section title="Product">
          <TextField
            label="Product name"
            required
            className="sm:col-span-2"
            register={register('name')}
            error={errors.name}
          />
          <TextField
            label="SKU / Product code"
            required
            autoCapitalize="characters"
            register={register('sku')}
            error={errors.sku}
          />
          <TextField
            label="Part number"
            register={register('partNumber')}
            error={errors.partNumber}
          />
          <TextAreaField
            label="Description"
            className="sm:col-span-2"
            rows={2}
            register={register('description')}
            error={errors.description}
          />
        </Section>

        <Section title="Classification">
          <SelectField label="Category" register={register('categoryId')} error={errors.categoryId}>
            <option value="">No category</option>
            {withCurrent(categories.data, p?.categoryId, p?.categoryName).map((c) => (
              <option key={c.id} value={c.id}>
                {c.parentName ? `${c.parentName} › ${c.name}` : c.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Brand" register={register('brandId')} error={errors.brandId}>
            <option value="">No brand</option>
            {withCurrent(brands.data, p?.brandId, p?.brandName).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Machine model"
            placeholder="e.g. 3DX, PC200"
            register={register('machineModel')}
            error={errors.machineModel}
          />
          <SelectField label="Unit" required register={register('unitId')} error={errors.unitId}>
            <option value="">Select unit</option>
            {withCurrent(units.data, p?.unitId, p?.unitCode).map((u) => (
              <option key={u.id} value={u.id}>
                {u.code ? `${u.name} (${u.code})` : u.name}
              </option>
            ))}
          </SelectField>
        </Section>

        <Section title="Tax & pricing">
          <TextField
            label="HSN code"
            inputMode="numeric"
            register={register('hsnCode')}
            error={errors.hsnCode}
          />
          <SelectField label="GST rate" register={register('gstRateId')} error={errors.gstRateId}>
            <option value="">Not set (0%)</option>
            {withCurrent(gstRates.data, p?.gstRateId, `${p?.gstRate}%`).map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Purchase price (₹)"
            inputMode="decimal"
            register={register('purchasePrice')}
            error={errors.purchasePrice}
          />
          <TextField
            label="Selling price (₹)"
            inputMode="decimal"
            register={register('sellingPrice')}
            error={errors.sellingPrice}
          />
          <TextField
            label="MRP (₹)"
            inputMode="decimal"
            register={register('mrp')}
            error={errors.mrp}
          />
        </Section>

        <Section title="Stock">
          <TextField
            label="Minimum stock level"
            inputMode="decimal"
            hint="Low-stock alert below this quantity"
            register={register('minStockLevel')}
            error={errors.minStockLevel}
          />
          {isEdit ? (
            <p className="self-center text-sm text-slate-500">
              To change stock, use Stock IN / OUT or an adjustment from the product page.
            </p>
          ) : (
            <TextField
              label="Opening stock"
              inputMode="decimal"
              hint="Recorded in the ledger as an opening entry"
              register={register('openingStock')}
              error={errors.openingStock}
            />
          )}
          {isEdit && (
            <div className="sm:col-span-2">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    label="Active"
                    description="Inactive products are hidden from search and cannot be moved."
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          )}
        </Section>

        <StickyActionBar>
          <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 sm:flex-none"
            loading={isSubmitting}
            disabled={isEdit && !isDirty}
          >
            {isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </StickyActionBar>
      </form>
    </div>
  );
}
