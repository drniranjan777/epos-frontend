import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/States';
import { Field, Input, Select, Textarea } from '../../components/forms/Field';
import { BranchSelect } from '../../components/layout/BranchSelect';
import { CartFooter } from '../../components/stock/CartFooter';
import { CartTable } from '../../components/stock/CartTable';
import { ProductResults } from '../../components/stock/ProductResults';
import { useAuth } from '../../hooks/useAuth';
import { useStockCart } from '../../hooks/useStockCart';
import { useBranchList, useRequestTransfer } from '../../hooks/useStockDocuments';
import { getErrorCode, getErrorMessage } from '../../utils/apiError';
import { formatNumber, partsSummary } from '../../utils/format';

function TransferForm({ branch }) {
  const navigate = useNavigate();
  const cart = useStockCart(`jcb-inventory:transfer:${branch.id}`, true);
  const branches = useBranchList({ isActive: true });
  const requestTransfer = useRequestTransfer();
  const [toId, setToId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [note, setNote] = useState('');
  const [toError, setToError] = useState(null);
  const [serverLineErrors, setServerLineErrors] = useState({});
  const [dialog, setDialog] = useState(null);

  const targets = (branches.data ?? []).filter((b) => b.id !== branch.id);
  const target = targets.find((b) => b.id === Number(toId));

  function resetAll() {
    cart.reset();
    setToId('');
    setInvoiceNumber('');
    setNote('');
    setToError(null);
    setServerLineErrors({});
    setDialog(null);
  }

  function requestSubmit() {
    if (!toId) {
      setToError('Select the branch to transfer to');
      return;
    }
    if (!cart.lines.length) {
      toast.error('Add at least one part');
      return;
    }
    if (!cart.isValid) {
      toast.error('Fix the highlighted quantities');
      return;
    }
    setDialog('confirm');
  }

  async function submit() {
    try {
      const transfer = await requestTransfer.mutateAsync({
        toWarehouseId: Number(toId),
        invoiceNumber: invoiceNumber.trim() || null,
        note: note.trim() || null,
        items: cart.lines.map((l) => ({ productId: l.productId, quantity: Number(l.quantity) })),
      });
      resetAll();
      toast.success(
        `Transfer ${transfer.transferNo} requested. It moves once an admin approves it.`,
      );
      navigate(`/transfers/${transfer.id}`);
    } catch (error) {
      setDialog(null);
      if (getErrorCode(error) === 'INSUFFICIENT_STOCK') {
        const lines = error.response.data.error.details?.lines ?? [];
        setServerLineErrors(
          Object.fromEntries(
            lines.map((l) => [
              l.productId,
              `Only ${formatNumber(l.available)} ${l.unitCode} available now`,
            ]),
          ),
        );
      }
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Stock transfer</h1>
          <Link
            to="/transfers"
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-200"
          >
            All transfers
          </Link>
        </div>
        <BranchSelect />
      </div>

      {branches.isSuccess && targets.length === 0 ? (
        <EmptyState
          title="No other branch"
          message="Ask an administrator to add another branch before transferring stock."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-[auto_1fr_1fr] sm:items-start">
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">From</p>
              <p className="flex h-11 items-center gap-2 font-semibold text-slate-900">
                {branch.name} <ArrowRight className="size-4 text-slate-400" aria-hidden />
              </p>
            </div>
            <Field label="Transfer to" required error={toError}>
              {(aria) => (
                <Select
                  {...aria}
                  value={toId}
                  invalid={Boolean(toError)}
                  onChange={(e) => {
                    setToId(e.target.value);
                    setToError(null);
                  }}
                >
                  <option value="">Select branch</option>
                  {targets.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Invoice / DC number" hint="Optional">
              {(aria) => (
                <Input
                  {...aria}
                  value={invoiceNumber}
                  maxLength={60}
                  placeholder="Enter invoice number"
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              )}
            </Field>
          </div>

          <div className="mt-4">
            <ProductResults
              branchName={branch.name}
              capped
              onAdd={(product) => cart.add(product)}
              cartQuantities={Object.fromEntries(cart.lines.map((l) => [l.productId, l.quantity]))}
            />
          </div>

          <div className="mt-4">
            <CartTable
              lines={cart.lines}
              errors={cart.errors}
              serverErrors={serverLineErrors}
              capped
              onQuantity={(productId, quantity) => {
                cart.setQuantity(productId, quantity);
                setServerLineErrors((e) => ({ ...e, [productId]: undefined }));
              }}
              onRemove={cart.remove}
            />
          </div>

          <Field label="Note (optional)" className="mt-4">
            {(aria) => (
              <Textarea
                {...aria}
                rows={2}
                maxLength={1000}
                value={note}
                placeholder="Anything worth remembering"
                onChange={(e) => setNote(e.target.value)}
              />
            )}
          </Field>

          <CartFooter
            totals={cart.totals}
            actionLabel="Transfer"
            actionVariant="primary"
            loading={requestTransfer.isPending}
            onReset={() => setDialog('reset')}
            onSubmit={requestSubmit}
          />
        </>
      )}

      <ConfirmDialog
        open={dialog === 'confirm'}
        title="Request transfer?"
        confirmLabel="Request transfer"
        variant="primary"
        loading={requestTransfer.isPending}
        onConfirm={submit}
        onClose={() => setDialog(null)}
      >
        <p className="text-slate-600">
          {partsSummary(cart.totals.parts, cart.totals.units)} from{' '}
          <span className="font-semibold text-slate-900">{branch.name}</span> to{' '}
          <span className="font-semibold text-slate-900">{target?.name}</span>.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Stock moves when an administrator approves the request, and arrives when {target?.name}{' '}
          confirms receipt.
        </p>
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === 'reset'}
        title="Clear this transfer?"
        message="All added parts and details will be removed."
        confirmLabel="Clear"
        onConfirm={resetAll}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}

export function TransferRequestPage() {
  const { branch } = useAuth();
  return <TransferForm key={branch.id} branch={branch} />;
}
