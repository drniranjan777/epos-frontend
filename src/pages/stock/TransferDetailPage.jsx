import { ArrowRight, Check, PackageCheck, Send, X } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorState, ListSkeleton } from '../../components/common/States';
import { TextField } from '../../components/forms/Field';
import { TransferStatusBadge } from '../../components/stock/TransferStatusBadge';
import { PERMISSIONS as P } from '../../constants/permissions';
import { useAuth } from '../../hooks/useAuth';
import {
  useApproveTransfer,
  useCancelTransfer,
  useReceiveTransfer,
  useRejectTransfer,
  useTransfer,
} from '../../hooks/useStockDocuments';
import { getErrorMessage } from '../../utils/apiError';
import { cn } from '../../utils/cn';
import { formatDateTime, formatNumber, partsSummary } from '../../utils/format';

function Timeline({ transfer }) {
  const steps = [
    { label: 'Requested', by: transfer.requestedByName, at: transfer.requestedAt },
    { label: 'Approved · in transit', by: transfer.approvedByName, at: transfer.approvedAt },
    {
      label: `Received at ${transfer.toBranchName}`,
      by: transfer.receivedByName,
      at: transfer.receivedAt,
    },
  ];
  const closed = ['REJECTED', 'CANCELLED'].includes(transfer.status);
  return (
    <ol className="space-y-3">
      {steps.map((step) => (
        <li key={step.label} className="flex gap-3">
          <span
            className={cn(
              'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full',
              step.at ? 'bg-emerald-600 text-white' : 'bg-slate-200',
            )}
          >
            {step.at && <Check className="size-3" aria-hidden />}
          </span>
          <div>
            <p className={cn('text-sm font-medium', !step.at && 'text-slate-400')}>{step.label}</p>
            {step.at && (
              <p className="text-xs text-slate-500">
                {step.by} · {formatDateTime(step.at)}
              </p>
            )}
          </div>
        </li>
      ))}
      {closed && (
        <li className="flex gap-3">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
            <X className="size-3" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium">
              {transfer.status === 'REJECTED' ? 'Rejected' : 'Cancelled'}: {transfer.closeReason}
            </p>
            <p className="text-xs text-slate-500">
              {transfer.closedByName} · {formatDateTime(transfer.closedAt)}
            </p>
          </div>
        </li>
      )}
    </ol>
  );
}

export function TransferDetailPage() {
  const { id } = useParams();
  const { user, can, branches } = useAuth();
  const transfer = useTransfer(id);
  const approve = useApproveTransfer();
  const reject = useRejectTransfer();
  const receive = useReceiveTransfer();
  const cancel = useCancelTransfer();
  const [dialog, setDialog] = useState(null);
  const [reason, setReason] = useState('');

  if (transfer.isPending) return <ListSkeleton rows={6} />;
  if (transfer.isError) {
    return <ErrorState error={transfer.error} onRetry={() => transfer.refetch()} />;
  }
  const t = transfer.data;

  const isApprover = can(P.TRANSFER_APPROVE);
  const atDestination = branches.some((b) => b.id === t.toWarehouseId);
  const actions = {
    approve: t.status === 'REQUESTED' && isApprover,
    reject: t.status === 'REQUESTED' && isApprover,
    receive: t.status === 'IN_TRANSIT' && can(P.TRANSFER_RECEIVE) && atDestination,
    cancel:
      (t.status === 'REQUESTED' && (isApprover || t.requestedBy === user.id)) ||
      (t.status === 'IN_TRANSIT' && isApprover),
  };
  const shortLines =
    t.status === 'REQUESTED' ? t.items.filter((i) => i.sourceStock < i.quantity) : [];

  async function run(mutation, args, message) {
    try {
      await mutation.mutateAsync(args);
      toast.success(message);
      setDialog(null);
      setReason('');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function withReason(mutation, message) {
    if (!reason.trim()) {
      toast.error('Enter a reason');
      return;
    }
    run(mutation, { id: t.id, reason: reason.trim() }, message);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title={t.transferNo}
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            {t.fromBranchName} <ArrowRight className="size-3.5" aria-hidden /> {t.toBranchName}
          </span>
        }
        backTo="/transfers"
        actions={<TransferStatusBadge status={t.status} />}
      />

      {Object.values(actions).some(Boolean) && (
        <div className="flex flex-wrap gap-2">
          {actions.approve && (
            <Button
              variant="brand"
              onClick={() => setDialog('approve')}
              disabled={shortLines.length > 0}
            >
              <Send className="size-4" aria-hidden /> Approve &amp; send
            </Button>
          )}
          {actions.receive && (
            <Button variant="in" onClick={() => setDialog('receive')}>
              <PackageCheck className="size-4" aria-hidden /> Mark received
            </Button>
          )}
          {actions.reject && (
            <Button variant="secondary" onClick={() => setDialog('reject')}>
              Reject
            </Button>
          )}
          {actions.cancel && (
            <Button variant="ghost" className="text-red-600" onClick={() => setDialog('cancel')}>
              Cancel transfer
            </Button>
          )}
        </div>
      )}
      {shortLines.length > 0 && isApprover && (
        <p
          role="alert"
          className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800 ring-1 ring-amber-200"
        >
          {t.fromBranchName} no longer has enough stock for{' '}
          {shortLines.map((l) => l.productName).join(', ')}. Reject the request or ask for a new
          one.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[1fr_auto] gap-3 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600">
            <span>Part</span>
            <span>Qty</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {t.items.map((item) => (
              <li
                key={item.productId}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.productName}</p>
                  <p className="truncate text-xs text-slate-500">
                    {[item.sku, item.partNumber].filter(Boolean).join(' · ')}
                    {t.status === 'REQUESTED' &&
                      ` · ${formatNumber(item.sourceStock)} in ${t.fromBranchName}`}
                  </p>
                </div>
                <span className="tabular text-sm font-semibold">
                  {formatNumber(item.quantity)} {item.unitCode}
                </span>
              </li>
            ))}
          </ul>
          <p className="border-t border-slate-100 px-4 py-3 text-sm font-semibold">
            {partsSummary(t.lineCount, t.totalQuantity)}
          </p>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <Timeline transfer={t} />
          </Card>
          {(t.invoiceNumber || t.note) && (
            <Card className="space-y-2 p-4 text-sm">
              {t.invoiceNumber && (
                <p>
                  <span className="text-slate-500">Invoice / DC: </span>
                  <span className="font-medium">{t.invoiceNumber}</span>
                </p>
              )}
              {t.note && <p className="whitespace-pre-line text-slate-700">{t.note}</p>}
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={dialog === 'approve'}
        title="Approve and send?"
        message={`Stock leaves ${t.fromBranchName} now and is in transit until ${t.toBranchName} receives it.`}
        confirmLabel="Approve & send"
        variant="brand"
        loading={approve.isPending}
        onConfirm={() => run(approve, t.id, `${t.transferNo} approved and sent`)}
        onClose={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === 'receive'}
        title="Mark as received?"
        message={`Confirm all parts arrived at ${t.toBranchName}. Stock is added there.`}
        confirmLabel="Mark received"
        variant="in"
        loading={receive.isPending}
        onConfirm={() => run(receive, t.id, `${t.transferNo} received`)}
        onClose={() => setDialog(null)}
      />
      {['reject', 'cancel'].map((kind) => (
        <ConfirmDialog
          key={kind}
          open={dialog === kind}
          title={kind === 'reject' ? 'Reject transfer?' : 'Cancel transfer?'}
          message={
            kind === 'cancel' && t.status === 'IN_TRANSIT'
              ? `The stock returns to ${t.fromBranchName}.`
              : 'No stock has moved yet.'
          }
          confirmLabel={kind === 'reject' ? 'Reject' : 'Cancel transfer'}
          loading={(kind === 'reject' ? reject : cancel).isPending}
          onConfirm={() =>
            withReason(
              kind === 'reject' ? reject : cancel,
              `${t.transferNo} ${kind === 'reject' ? 'rejected' : 'cancelled'}`,
            )
          }
          onClose={() => setDialog(null)}
        >
          <TextField
            label="Reason"
            required
            className="mt-4"
            value={reason}
            maxLength={255}
            onChange={(e) => setReason(e.target.value)}
          />
        </ConfirmDialog>
      ))}
    </div>
  );
}
