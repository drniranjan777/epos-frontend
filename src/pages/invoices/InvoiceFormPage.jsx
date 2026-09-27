import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorState, ListSkeleton } from '../../components/common/States';
import { StickyActionBar } from '../../components/common/StickyActionBar';
import { CustomerPicker } from '../../components/forms/CustomerPicker';
import { TextAreaField, TextField } from '../../components/forms/Field';
import { InvoiceItemsEditor } from '../../components/invoice/InvoiceItemsEditor';
import { InvoiceTotals } from '../../components/invoice/InvoiceTotals';
import { useCompanySettings } from '../../hooks/useAdmin';
import { useFinalizeInvoice, useInvoice, useSaveInvoice } from '../../hooks/useInvoices';
import { getErrorMessage } from '../../utils/apiError';
import { todayIso } from '../../utils/format';
import { calculateTotals, supplyTypeFor } from '../../utils/gst';

const EMPTY = { customer: null, invoiceDate: todayIso(), notes: '', items: [] };

function fromInvoice(invoice) {
  return {
    customer: {
      id: invoice.customerId,
      name: invoice.customerName,
      companyName: invoice.customerCompanyName,
      gstin: invoice.customerGstin,
      state: invoice.customerState,
      stateCode: invoice.customerStateCode,
    },
    invoiceDate: invoice.invoiceDate,
    notes: invoice.notes ?? '',
    items: invoice.items.map((item) => ({
      productId: item.productId,
      name: item.productName,
      sku: item.sku,
      unitCode: item.unit,
      // Unknown for saved lines; the server enforces whole-number units.
      allowDecimal: true,
      stock: Infinity,
      gstRate: Number(item.gstRate),
      quantity: String(item.quantity),
      rate: String(item.rate),
      discountPercent: String(item.discountPercent),
    })),
  };
}

function toPayload(values) {
  return {
    customerId: values.customer.id,
    invoiceDate: values.invoiceDate,
    notes: values.notes.trim() || null,
    items: values.items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      rate: Number(item.rate),
      discountPercent: Number(item.discountPercent || 0),
    })),
  };
}

export function InvoiceFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const invoice = useInvoice(id);
  const company = useCompanySettings();
  const save = useSaveInvoice(id);
  const finalizeInvoice = useFinalizeInvoice();
  const [pending, setPending] = useState(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({ defaultValues: EMPTY });

  useEffect(() => {
    if (invoice.data) reset(fromInvoice(invoice.data));
  }, [invoice.data, reset]);

  const customer = useWatch({ control, name: 'customer' });
  const items = useWatch({ control, name: 'items' });
  const supplyType = supplyTypeFor(
    company.data?.stateCode,
    customer?.stateCode ?? company.data?.stateCode,
  );
  const totals = calculateTotals(items, supplyType);

  async function submit(values, finalize) {
    if (!values.customer) {
      setError('customer', { message: 'Select a customer' });
      return;
    }
    if (!values.items.length) {
      setError('items.root', { message: 'Add at least one item' });
      return;
    }
    setPending(finalize ? 'final' : 'draft');
    try {
      const payload = toPayload(values);
      let saved = await save.mutateAsync(isEdit ? payload : { ...payload, finalize });
      if (isEdit && finalize) saved = await finalizeInvoice.mutateAsync(saved.id);
      toast.success(finalize ? `Invoice ${saved.invoiceNo} created` : 'Draft saved');
      navigate(`/invoices/${saved.id}`, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPending(null);
    }
  }

  if (isEdit && invoice.isPending) return <ListSkeleton rows={8} />;
  if (isEdit && invoice.isError) {
    return <ErrorState error={invoice.error} onRetry={() => invoice.refetch()} />;
  }
  if (isEdit && invoice.data.status !== 'DRAFT') {
    return <ErrorState error={new Error('Only draft invoices can be edited.')} />;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={isEdit ? 'Edit draft invoice' : 'New invoice'}
        backTo={isEdit ? `/invoices/${id}` : '/invoices'}
      />
      <form noValidate onSubmit={(e) => e.preventDefault()} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="space-y-4 p-4">
            <Controller
              name="customer"
              control={control}
              render={({ field }) => (
                <CustomerPicker
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    clearErrors('customer');
                  }}
                  error={errors.customer?.message}
                />
              )}
            />
            <TextField
              label="Invoice date"
              type="date"
              max={todayIso()}
              register={register('invoiceDate', { required: 'Select a date' })}
              error={errors.invoiceDate}
            />
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 font-semibold">Items</h2>
            <InvoiceItemsEditor
              control={control}
              register={register}
              errors={errors}
              supplyType={supplyType}
            />
          </Card>

          <Card className="p-4">
            <TextAreaField
              label="Notes (printed on invoice)"
              rows={2}
              register={register('notes')}
            />
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="p-4 lg:sticky lg:top-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Summary</h2>
              <Badge tone="info">
                {supplyType === 'INTER' ? 'Inter-state · IGST' : 'Intra-state · CGST+SGST'}
              </Badge>
            </div>
            <InvoiceTotals totals={totals} supplyType={supplyType} />
            <p className="mt-3 text-xs text-slate-500">
              Final amounts are calculated by the server. Creating the invoice deducts stock.
            </p>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <StickyActionBar>
            <Button
              variant="secondary"
              className="flex-1 sm:flex-none"
              loading={pending === 'draft'}
              disabled={Boolean(pending)}
              onClick={handleSubmit((v) => submit(v, false))}
            >
              Save draft
            </Button>
            <Button
              variant="brand"
              className="flex-1 sm:flex-none"
              loading={pending === 'final'}
              disabled={Boolean(pending)}
              onClick={handleSubmit((v) => submit(v, true))}
            >
              Create invoice
            </Button>
          </StickyActionBar>
        </div>
      </form>
    </div>
  );
}
