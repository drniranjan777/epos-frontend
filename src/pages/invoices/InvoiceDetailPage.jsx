import { Ban, CheckCircle2, Download, Pencil, Printer, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorState, ListSkeleton } from '../../components/common/States';
import { TextField } from '../../components/forms/Field';
import { InvoicePrintView } from '../../components/invoice/InvoicePrintView';
import { StatusBadge } from '../../components/invoice/StatusBadge';
import { PERMISSIONS as P } from '../../constants/permissions';
import { useAuth } from '../../hooks/useAuth';
import {
  useCancelInvoice,
  useDeleteInvoice,
  useFinalizeInvoice,
  useInvoice,
} from '../../hooks/useInvoices';
import { invoiceService } from '../../services/invoiceService';
import { getErrorMessage } from '../../utils/apiError';

export function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const invoice = useInvoice(id);
  const finalize = useFinalizeInvoice();
  const cancel = useCancelInvoice();
  const remove = useDeleteInvoice();
  const [dialog, setDialog] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [downloading, setDownloading] = useState(false);

  if (invoice.isPending) return <ListSkeleton rows={8} />;
  if (invoice.isError) {
    return <ErrorState error={invoice.error} onRetry={() => invoice.refetch()} />;
  }
  const inv = invoice.data;
  const isDraft = inv.status === 'DRAFT';
  const isFinal = inv.status === 'FINAL';

  async function run(action, successMessage, after) {
    try {
      const result = await action();
      toast.success(typeof successMessage === 'function' ? successMessage(result) : successMessage);
      setDialog(null);
      after?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function downloadPdf() {
    setDownloading(true);
    try {
      const blob = await invoiceService.pdf(inv.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(inv.invoiceNo ?? `draft-${inv.id}`).replaceAll('/', '-')}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not download the PDF'));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print">
        <PageHeader
          title={inv.invoiceNo ?? `Draft invoice #${inv.id}`}
          subtitle={inv.customerCompanyName || inv.customerName}
          backTo="/invoices"
          actions={<StatusBadge status={inv.status} />}
        />

        <div className="mb-4 flex flex-wrap gap-2">
          {isDraft && can(P.INVOICE_CREATE) && (
            <Button variant="brand" onClick={() => setDialog('finalize')}>
              <CheckCircle2 className="size-4" aria-hidden /> Finalize
            </Button>
          )}
          {isDraft && can(P.INVOICE_UPDATE) && (
            <Button variant="secondary" to={`/invoices/${inv.id}/edit`}>
              <Pencil className="size-4" aria-hidden /> Edit
            </Button>
          )}
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden /> Print
          </Button>
          <Button variant="secondary" onClick={downloadPdf} loading={downloading}>
            <Download className="size-4" aria-hidden /> PDF
          </Button>
          {isFinal && can(P.INVOICE_CANCEL) && (
            <Button variant="ghost" className="text-red-600" onClick={() => setDialog('cancel')}>
              <Ban className="size-4" aria-hidden /> Cancel invoice
            </Button>
          )}
          {isDraft && can(P.INVOICE_UPDATE) && (
            <Button variant="ghost" className="text-red-600" onClick={() => setDialog('delete')}>
              <Trash2 className="size-4" aria-hidden /> Delete draft
            </Button>
          )}
        </div>
      </div>

      <InvoicePrintView invoice={inv} />

      <ConfirmDialog
        open={dialog === 'finalize'}
        title="Finalize invoice?"
        message="An invoice number will be assigned and stock will be deducted. Finalized invoices cannot be edited."
        confirmLabel="Finalize"
        variant="brand"
        loading={finalize.isPending}
        onClose={() => setDialog(null)}
        onConfirm={() =>
          run(
            () => finalize.mutateAsync(inv.id),
            (r) => `Invoice ${r.invoiceNo} created`,
          )
        }
      />
      <ConfirmDialog
        open={dialog === 'cancel'}
        title="Cancel invoice?"
        message="Stock for all items will be returned. The invoice number is kept and cannot be reused."
        confirmLabel="Cancel invoice"
        loading={cancel.isPending}
        onClose={() => setDialog(null)}
        onConfirm={() => {
          if (!cancelReason.trim()) {
            toast.error('Enter a reason for cancelling');
            return;
          }
          run(
            () => cancel.mutateAsync({ id: inv.id, reason: cancelReason.trim() }),
            'Invoice cancelled and stock restored',
          );
        }}
      >
        <TextField
          label="Reason"
          required
          className="mt-4"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          maxLength={255}
        />
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === 'delete'}
        title="Delete draft?"
        message="This draft will be permanently removed."
        confirmLabel="Delete"
        loading={remove.isPending}
        onClose={() => setDialog(null)}
        onConfirm={() =>
          run(
            () => remove.mutateAsync(inv.id),
            'Draft deleted',
            () => navigate('/invoices', { replace: true }),
          )
        }
      />
    </div>
  );
}
