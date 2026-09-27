import { ImageUp, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorState, ListSkeleton } from '../../components/common/States';
import { StickyActionBar } from '../../components/common/StickyActionBar';
import { SelectField, TextAreaField, TextField } from '../../components/forms/Field';
import {
  useCompanySettings,
  useRemoveLogo,
  useStates,
  useUpdateSettings,
  useUploadLogo,
} from '../../hooks/useAdmin';
import { applyFieldErrors, getErrorMessage } from '../../utils/apiError';
import { emptyToNull, toFormValues } from '../../utils/formHelpers';

const FIELDS = [
  'companyName',
  'address',
  'city',
  'pincode',
  'phone',
  'email',
  'gstin',
  'pan',
  'stateCode',
  'bankName',
  'bankAccountName',
  'bankAccountNumber',
  'bankIfsc',
  'bankBranch',
  'termsAndConditions',
  'invoicePrefix',
  'invoiceNumberPadding',
];
const MAX_LOGO_BYTES = 1024 * 1024;

function Section({ title, description, children }) {
  return (
    <Card className="p-4">
      <h2 className="font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

function LogoCard({ settings }) {
  const inputRef = useRef(null);
  const upload = useUploadLogo();
  const remove = useRemoveLogo();

  async function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      return toast.error('Use a PNG or JPG image');
    }
    if (file.size > MAX_LOGO_BYTES) return toast.error('Logo must be smaller than 1 MB');
    try {
      await upload.mutateAsync(file);
      toast.success('Logo updated');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200">
        {settings.logoUrl ? (
          <img src={settings.logoUrl} alt="Company logo" className="size-full object-contain" />
        ) : (
          <ImageUp className="size-7 text-slate-300" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Logo</p>
        <p className="text-sm text-slate-500">PNG or JPG, up to 1 MB. Printed on invoices.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            loading={upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            {settings.logoUrl ? 'Replace' : 'Upload'}
          </Button>
          {settings.logoUrl && (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600"
              loading={remove.isPending}
              onClick={() =>
                remove.mutateAsync().then(
                  () => toast.success('Logo removed'),
                  (e) => toast.error(getErrorMessage(e)),
                )
              }
            >
              <Trash2 className="size-4" aria-hidden /> Remove
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={onFile}
        />
      </div>
    </Card>
  );
}

export function CompanySettingsPage() {
  const settings = useCompanySettings();
  const states = useStates();
  const update = useUpdateSettings();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ defaultValues: toFormValues({}, FIELDS) });

  useEffect(() => {
    if (settings.data) reset(toFormValues(settings.data, FIELDS));
  }, [settings.data, reset]);

  async function onSubmit(values) {
    const payload = emptyToNull(values);
    payload.invoiceNumberPadding = Number(values.invoiceNumberPadding);
    try {
      const saved = await update.mutateAsync(payload);
      reset(toFormValues(saved, FIELDS));
      toast.success('Settings saved');
    } catch (error) {
      if (!applyFieldErrors(error, setError)) toast.error(getErrorMessage(error));
    }
  }

  if (settings.isPending || states.isPending) return <ListSkeleton rows={8} />;
  if (settings.isError) {
    return <ErrorState error={settings.error} onRetry={() => settings.refetch()} />;
  }

  const required = (label) => ({ required: `${label} is required` });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Company Settings" subtitle="Details printed on invoices" />
      <LogoCard settings={settings.data} />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Section title="Company">
          <TextField
            label="Company name"
            required
            className="sm:col-span-2"
            register={register('companyName', required('Company name'))}
            error={errors.companyName}
          />
          <TextAreaField
            label="Address"
            className="sm:col-span-2"
            rows={2}
            register={register('address')}
            error={errors.address}
          />
          <TextField label="City" register={register('city')} error={errors.city} />
          <TextField
            label="Pincode"
            inputMode="numeric"
            register={register('pincode')}
            error={errors.pincode}
          />
          <TextField label="Phone" type="tel" register={register('phone')} error={errors.phone} />
          <TextField label="Email" type="email" register={register('email')} error={errors.email} />
        </Section>

        <Section
          title="Tax registration"
          description="The state decides CGST+SGST vs IGST on invoices."
        >
          <TextField
            label="GSTIN"
            autoCapitalize="characters"
            register={register('gstin')}
            error={errors.gstin}
          />
          <TextField
            label="PAN"
            autoCapitalize="characters"
            register={register('pan')}
            error={errors.pan}
          />
          <SelectField
            label="State"
            required
            className="sm:col-span-2"
            register={register('stateCode', required('State'))}
            error={errors.stateCode}
          >
            <option value="">Select state</option>
            {(states.data ?? []).map((s) => (
              <option key={s.code} value={s.code}>
                {s.name} ({s.code})
              </option>
            ))}
          </SelectField>
        </Section>

        <Section title="Bank details">
          <TextField label="Bank name" register={register('bankName')} error={errors.bankName} />
          <TextField
            label="Account holder name"
            register={register('bankAccountName')}
            error={errors.bankAccountName}
          />
          <TextField
            label="Account number"
            inputMode="numeric"
            register={register('bankAccountNumber')}
            error={errors.bankAccountNumber}
          />
          <TextField
            label="IFSC"
            autoCapitalize="characters"
            register={register('bankIfsc')}
            error={errors.bankIfsc}
          />
          <TextField
            label="Branch"
            className="sm:col-span-2"
            register={register('bankBranch')}
            error={errors.bankBranch}
          />
        </Section>

        <Section
          title="Invoice"
          description="Numbers look like PREFIX/2026-27/0001 and restart every financial year."
        >
          <TextField
            label="Invoice prefix"
            required
            autoCapitalize="characters"
            register={register('invoicePrefix', required('Invoice prefix'))}
            error={errors.invoicePrefix}
          />
          <SelectField
            label="Number digits"
            register={register('invoiceNumberPadding')}
            error={errors.invoiceNumberPadding}
          >
            {[3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} digits ({'0'.repeat(n - 1)}1)
              </option>
            ))}
          </SelectField>
          <TextAreaField
            label="Terms & conditions"
            className="sm:col-span-2"
            rows={4}
            register={register('termsAndConditions')}
            error={errors.termsAndConditions}
          />
        </Section>

        <StickyActionBar>
          <Button
            type="submit"
            className="flex-1 sm:flex-none"
            loading={isSubmitting}
            disabled={!isDirty}
          >
            Save settings
          </Button>
        </StickyActionBar>
      </form>
    </div>
  );
}
