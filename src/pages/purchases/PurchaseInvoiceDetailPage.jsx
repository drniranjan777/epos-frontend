import { ArrowDownToLine, IndianRupee, Printer } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorState, ListSkeleton } from '../../components/common/States';
import { Field, Input } from '../../components/forms/Field';
import { InvoiceTotals } from '../../components/invoice/InvoiceTotals';
import { PERMISSIONS as P } from '../../constants/permissions';
import { useAuth } from '../../hooks/useAuth';
import { usePurchaseInvoice, useRecordPurchasePayment } from '../../hooks/usePurchaseInvoices';
import { getErrorMessage } from '../../utils/apiError';
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '../../utils/format';
import { PaymentBadge } from './PurchaseInvoiceListPage';

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium">{children || '—'}</dd>
    </div>
  );
}

const lineTax = (item) =>
  Number(item.cgstAmount) + Number(item.sgstAmount) + Number(item.igstAmount);

/** One billing (purchase) invoice with its lines, tax breakup and payment; printable. */
export function PurchaseInvoiceDetailPage() {
  const { id } = useParams();
  const { can } = useAuth();
  const invoice = usePurchaseInvoice(id);
  const pay = useRecordPurchasePayment();
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState('');
  const [payError, setPayError] = useState(null);

  if (invoice.isPending) return <ListSkeleton rows={8} />;
  if (invoice.isError) {
    return <ErrorState error={invoice.error} onRetry={() => invoice.refetch()} />;
  }
  const inv = invoice.data;

  function openPayment() {
    setPaid(String(inv.paidAmount));
    setPayError(null);
    setPaying(true);
  }

  async function savePayment() {
    const amount = Number(paid);
    if (paid === '' || Number.isNaN(amount) || amount < 0) {
      return setPayError('Enter the amount paid');
    }
    if (amount > Number(inv.grandTotal)) {
      return setPayError(`Cannot be more than the total of ${formatCurrency(inv.grandTotal)}`);
    }
    try {
      await pay.mutateAsync({ id: inv.id, paidAmount: amount });
      toast.success('Payment saved');
      return setPaying(false);
    } catch (error) {
      return setPayError(getErrorMessage(error));
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print">
        <PageHeader
          title={inv.invoiceNo}
          subtitle={`Purchase invoice · ${inv.branchName} · ${formatDate(inv.invoiceDate)}`}
          backTo="/billing-invoices"
          actions={
            <>
              <PaymentBadge status={inv.paymentStatus} />
              <Button variant="secondary" to={`/stock/entries/${inv.movementId}`}>
                <ArrowDownToLine className="size-4" aria-hidden /> {inv.movementNo}
              </Button>
              {can(P.PURCHASE_PAY) && (
                <Button variant="secondary" onClick={openPayment}>
                  <IndianRupee className="size-4" aria-hidden /> Record payment
                </Button>
              )}
              <Button onClick={() => window.print()}>
                <Printer className="size-4" aria-hidden /> Print / PDF
              </Button>
            </>
          }
        />
      </div>

      <Card className="print-area p-4 sm:p-6 print:p-0 print:shadow-none print:ring-0">
        <div className="mb-4 hidden print:block">
          <p className="text-lg font-bold">Purchase Invoice · {inv.invoiceNo}</p>
          <p className="text-sm">
            {inv.branchName} · {formatDate(inv.invoiceDate)}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Detail label="Supplier">
            {inv.supplierName}
            {inv.supplierGstin && (
              <span className="block font-mono text-xs font-normal text-slate-500">
                {inv.supplierGstin}
              </span>
            )}
          </Detail>
          <Detail label="Supplier invoice number">
            {inv.noBill ? <Badge>No bill</Badge> : inv.supplierInvoiceNumber}
          </Detail>
          <Detail label="Stock IN reference">{inv.movementNo}</Detail>
          <Detail label="Invoice date">{formatDate(inv.invoiceDate)}</Detail>
          <Detail label="Branch">{inv.branchName}</Detail>
          <Detail label="Invoice status">{inv.status === 'POSTED' ? 'Posted' : 'Cancelled'}</Detail>
          <Detail label="Created by">{inv.createdByName}</Detail>
          <Detail label="Created at">{formatDateTime(inv.createdAt)}</Detail>
        </dl>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-2">Part</th>
                <th className="py-2 pr-2 text-right">Qty</th>
                <th className="py-2 pr-2 text-right">Previous price</th>
                <th className="py-2 pr-2 text-right">Purchase price</th>
                <th className="py-2 pr-2 text-right">Taxable</th>
                <th className="py-2 pr-2 text-right">GST</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inv.items.map((item) => {
                const changed = Number(item.previousRate) !== Number(item.rate);
                return (
                  <tr key={item.lineNo} className="align-top">
                    <td className="tabular py-2 pr-2 text-slate-500">
                      {String(item.lineNo).padStart(2, '0')}
                    </td>
                    <td className="py-2 pr-2">
                      {item.productName}
                      <span className="block text-xs text-slate-500">
                        {[item.sku, item.partNumber, item.hsnCode && `HSN ${item.hsnCode}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </td>
                    <td className="tabular py-2 pr-2 text-right">
                      {formatNumber(item.quantity)} {item.unit}
                    </td>
                    <td className="tabular py-2 pr-2 text-right text-slate-500">
                      {formatCurrency(item.previousRate)}
                    </td>
                    <td
                      className={`tabular py-2 pr-2 text-right font-semibold ${changed ? 'text-brand-700' : ''}`}
                    >
                      {formatCurrency(item.rate)}
                    </td>
                    <td className="tabular py-2 pr-2 text-right">
                      {formatCurrency(item.taxableValue)}
                    </td>
                    <td className="tabular py-2 pr-2 text-right">
                      {formatCurrency(lineTax(item))}
                      <span className="block text-xs text-slate-500">
                        {formatNumber(item.gstRate)}%
                      </span>
                    </td>
                    <td className="tabular py-2 text-right font-semibold">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-6 border-t border-slate-200 pt-4">
          <div className="min-w-0 flex-1 text-sm text-slate-600">
            {inv.noBill && (
              <p>Stock received without a supplier bill: an internal record with no tax.</p>
            )}
            {inv.notes && <p className="mt-1 whitespace-pre-line">Note: {inv.notes}</p>}
          </div>
          <div className="w-full sm:w-72">
            <InvoiceTotals totals={inv} supplyType={inv.supplyType} />
            <dl className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-600">Paid</dt>
                <dd className="tabular">{formatCurrency(inv.paidAmount)}</dd>
              </div>
              <div className="flex justify-between gap-4 font-semibold">
                <dt>Outstanding</dt>
                <dd className="tabular">{formatCurrency(inv.outstandingAmount)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={paying}
        title="Record payment"
        confirmLabel="Save payment"
        variant="primary"
        loading={pay.isPending}
        onConfirm={savePayment}
        onClose={() => setPaying(false)}
      >
        <p className="mb-3 text-slate-600">
          Invoice total {formatCurrency(inv.grandTotal)}. Enter the total paid to the supplier so
          far.
        </p>
        <Field label="Amount paid (₹)" error={payError}>
          {(aria) => (
            <Input
              {...aria}
              inputMode="decimal"
              value={paid}
              invalid={Boolean(payError)}
              onChange={(e) => {
                setPaid(e.target.value.replace(/[^0-9.]/g, ''));
                setPayError(null);
              }}
            />
          )}
        </Field>
      </ConfirmDialog>
    </div>
  );
}
