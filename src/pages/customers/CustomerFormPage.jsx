import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorState, ListSkeleton } from '../../components/common/States';
import { StickyActionBar } from '../../components/common/StickyActionBar';
import { SelectField, Switch, TextAreaField, TextField } from '../../components/forms/Field';
import { useStates } from '../../hooks/useAdmin';
import { useCustomer, useSaveCustomer } from '../../hooks/useCustomers';
import { applyFieldErrors, getErrorMessage } from '../../utils/apiError';
import { emptyToNull, toFormValues } from '../../utils/formHelpers';

const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const schema = z
  .object({
    name: z.string().trim().min(1, 'Customer name is required').max(150),
    companyName: z.string().max(150),
    mobile: z
      .string()
      .trim()
      .transform((v) => v.replace(/[\s-]/g, ''))
      .refine(
        (v) => !v || /^(\+91)?[6-9][0-9]{9}$/.test(v),
        'Enter a valid 10-digit mobile number',
      ),
    email: z
      .string()
      .trim()
      .refine((v) => !v || z.string().email().safeParse(v).success, 'Enter a valid email'),
    gstin: z
      .string()
      .trim()
      .transform((v) => v.toUpperCase())
      .refine((v) => !v || GSTIN.test(v), 'Invalid GSTIN format'),
    billingAddress: z.string().max(1000),
    shippingAddress: z.string().max(1000),
    stateCode: z.string(),
    city: z.string().max(100),
    pincode: z
      .string()
      .trim()
      .refine((v) => !v || /^[1-9][0-9]{5}$/.test(v), 'Pincode must be 6 digits'),
    isActive: z.boolean(),
  })
  .refine((d) => !d.gstin || !d.stateCode || d.gstin.slice(0, 2) === d.stateCode, {
    path: ['stateCode'],
    message: 'State must match the first two digits of the GSTIN',
  });

const FIELDS = [
  'name',
  'companyName',
  'mobile',
  'email',
  'gstin',
  'billingAddress',
  'shippingAddress',
  'stateCode',
  'city',
  'pincode',
];

export function CustomerFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const customer = useCustomer(id);
  const save = useSaveCustomer(id);
  const states = useStates();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { ...toFormValues({}, FIELDS), isActive: true },
  });

  useEffect(() => {
    if (customer.data) {
      reset({ ...toFormValues(customer.data, FIELDS), isActive: customer.data.isActive });
    }
  }, [customer.data, reset]);

  // Pre-select the state from a newly typed GSTIN.
  const gstin = useWatch({ control, name: 'gstin' });
  useEffect(() => {
    const code = gstin?.trim().slice(0, 2);
    if (gstin?.trim().length >= 2 && /^[0-9]{2}$/.test(code) && !getValues('stateCode')) {
      setValue('stateCode', code, { shouldValidate: true });
    }
  }, [gstin, getValues, setValue]);

  async function onSubmit(values) {
    try {
      await save.mutateAsync(emptyToNull(values));
      toast.success(isEdit ? 'Customer updated' : 'Customer created');
      navigate('/customers', { replace: true });
    } catch (error) {
      if (!applyFieldErrors(error, setError)) toast.error(getErrorMessage(error));
    }
  }

  // The state select needs its options before values are applied.
  if (states.isPending || (isEdit && customer.isPending)) return <ListSkeleton rows={8} />;
  if (isEdit && customer.isError) {
    return <ErrorState error={customer.error} onRetry={() => customer.refetch()} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={isEdit ? 'Edit customer' : 'New customer'} backTo="/customers" />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Card className="grid gap-4 p-4 sm:grid-cols-2">
          <TextField
            label="Contact name"
            required
            register={register('name')}
            error={errors.name}
          />
          <TextField
            label="Company name"
            register={register('companyName')}
            error={errors.companyName}
          />
          <TextField
            label="Mobile"
            type="tel"
            inputMode="tel"
            register={register('mobile')}
            error={errors.mobile}
          />
          <TextField
            label="Email"
            type="email"
            inputMode="email"
            register={register('email')}
            error={errors.email}
          />
        </Card>

        <Card className="grid gap-4 p-4 sm:grid-cols-2">
          <TextField
            label="GSTIN"
            autoCapitalize="characters"
            hint="Leave empty for unregistered customers"
            register={register('gstin')}
            error={errors.gstin}
          />
          <SelectField label="State" register={register('stateCode')} error={errors.stateCode}>
            <option value="">Select state</option>
            {(states.data ?? []).map((s) => (
              <option key={s.code} value={s.code}>
                {s.name} ({s.code})
              </option>
            ))}
          </SelectField>
          <TextField label="City" register={register('city')} error={errors.city} />
          <TextField
            label="Pincode"
            inputMode="numeric"
            register={register('pincode')}
            error={errors.pincode}
          />
          <TextAreaField
            label="Billing address"
            className="sm:col-span-2"
            rows={2}
            register={register('billingAddress')}
            error={errors.billingAddress}
          />
          <div className="sm:col-span-2">
            <TextAreaField
              label="Shipping address"
              rows={2}
              register={register('shippingAddress')}
              error={errors.shippingAddress}
            />
            <button
              type="button"
              className="text-brand-700 mt-1 text-sm font-medium"
              onClick={() =>
                setValue('shippingAddress', getValues('billingAddress'), { shouldDirty: true })
              }
            >
              Same as billing address
            </button>
          </div>
          {isEdit && (
            <div className="sm:col-span-2">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    label="Active"
                    description="Inactive customers cannot be selected for new sales."
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          )}
        </Card>

        <StickyActionBar>
          <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1 sm:flex-none" loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create customer'}
          </Button>
        </StickyActionBar>
      </form>
    </div>
  );
}
