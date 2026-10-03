import { History } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Field, Input, Switch, Textarea } from '../../components/forms/Field';
import { PartyInput } from '../../components/forms/PartyInput';
import { BranchSelect } from '../../components/layout/BranchSelect';
import { CartFooter } from '../../components/stock/CartFooter';
import { CartTable } from '../../components/stock/CartTable';
import { ProductResults } from '../../components/stock/ProductResults';
import { useAuth } from '../../hooks/useAuth';
import { useStockCart } from '../../hooks/useStockCart';
import { useCreateMovement } from '../../hooks/useStockDocuments';
import { getErrorCode, getErrorMessage } from '../../utils/apiError';
import { cn } from '../../utils/cn';
import { formatNumber, partsSummary } from '../../utils/format';

const MODES = {
  OUT: {
    title: 'Stock OUT',
    action: 'OUT',
    variant: 'out',
    partyLabel: 'Customer',
    partyPlaceholder: 'Enter customer name',
    accent: 'text-stock-out',
  },
  IN: {
    title: 'Stock IN',
    action: 'IN',
    variant: 'in',
    partyLabel: 'Supplier',
    partyPlaceholder: 'Enter supplier name',
    accent: 'text-stock-in',
  },
};

const EMPTY_DETAILS = {
  invoiceNumber: '',
  party: { name: '', customerId: null },
  noBill: false,
  note: '',
};

/** Server stock errors per product, e.g. when someone else issued the last units. */
function shortageMessages(error) {
  const lines = error?.response?.data?.error?.details?.lines ?? [];
  return Object.fromEntries(
    lines.map((l) => [
      l.productId,
      `Only ${formatNumber(l.available)} ${l.unitCode} available now`,
    ]),
  );
}

function StockEntryForm({ mode, branch }) {
  const config = MODES[mode];
  const isOut = mode === 'OUT';
  const navigate = useNavigate();
  const cart = useStockCart(`jcb-inventory:stock-${mode}:${branch.id}`, isOut);
  const create = useCreateMovement();
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const [invoiceError, setInvoiceError] = useState(null);
  const [serverLineErrors, setServerLineErrors] = useState({});
  const [dialog, setDialog] = useState(null);

  const update = (changes) => setDetails((d) => ({ ...d, ...changes }));

  function resetAll() {
    cart.reset();
    setDetails(EMPTY_DETAILS);
    setInvoiceError(null);
    setServerLineErrors({});
    setDialog(null);
  }

  function requestSubmit() {
    if (!cart.lines.length) return toast.error('Add at least one part');
    if (!cart.isValid) return toast.error('Fix the highlighted quantities');
    if (!details.noBill && !details.invoiceNumber.trim()) {
      setInvoiceError('Enter the invoice number, or switch on "No bill"');
      return undefined;
    }
    return setDialog('confirm');
  }

  async function submit() {
    try {
      const movement = await create.mutateAsync({
        type: mode,
        noBill: details.noBill,
        invoiceNumber: details.noBill ? null : details.invoiceNumber.trim(),
        partyName: details.noBill ? null : details.party.name.trim() || null,
        customerId: !details.noBill && isOut ? details.party.customerId : null,
        note: details.note.trim() || null,
        items: cart.lines.map((l) => ({ productId: l.productId, quantity: Number(l.quantity) })),
      });
      resetAll();
      toast.success(`${config.title} saved · ${movement.movementNo}`, {
        action: { label: 'View', onClick: () => navigate(`/stock/entries/${movement.id}`) },
      });
    } catch (error) {
      setDialog(null);
      if (getErrorCode(error) === 'INSUFFICIENT_STOCK') {
        setServerLineErrors(shortageMessages(error));
      }
      const invoiceIssue = error?.response?.data?.error?.details?.find?.(
        (d) => d.field === 'invoiceNumber',
      );
      if (invoiceIssue) setInvoiceError(invoiceIssue.message);
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <h1 className={cn('text-xl font-bold sm:text-2xl', config.accent)}>{config.title}</h1>
          <Link
            to={`/stock/entries?type=${mode}`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-200"
          >
            <History className="size-4" aria-hidden /> History
          </Link>
        </div>
        <BranchSelect />
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Field label="Invoice Number" error={invoiceError}>
          {(aria) => (
            <Input
              {...aria}
              value={details.invoiceNumber}
              disabled={details.noBill}
              placeholder="Enter invoice number"
              invalid={Boolean(invoiceError)}
              onChange={(e) => {
                update({ invoiceNumber: e.target.value });
                setInvoiceError(null);
              }}
            />
          )}
        </Field>
        <PartyInput
          label={config.partyLabel}
          placeholder={config.partyPlaceholder}
          value={details.party}
          disabled={details.noBill}
          suggestCustomers={isOut}
          onChange={(party) => update({ party })}
        />
        <div className="sm:pt-1">
          <p className="mb-1.5 text-sm font-medium text-slate-700 max-sm:hidden">No bill</p>
          <Switch
            label={<span className="sm:sr-only">No bill</span>}
            checked={details.noBill}
            onChange={(noBill) => {
              update({ noBill });
              setInvoiceError(null);
            }}
          />
        </div>
      </div>

      <div className="mt-4">
        <ProductResults
          branchName={branch.name}
          capped={isOut}
          onAdd={(product, quantity) => {
            cart.add(product, quantity);
            setServerLineErrors((e) => ({ ...e, [product.id]: undefined }));
          }}
          cartQuantities={Object.fromEntries(cart.lines.map((l) => [l.productId, l.quantity]))}
        />
      </div>

      <div className="mt-4">
        <CartTable
          lines={cart.lines}
          errors={cart.errors}
          serverErrors={serverLineErrors}
          capped={isOut}
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
            value={details.note}
            placeholder="Anything worth remembering"
            onChange={(e) => update({ note: e.target.value })}
          />
        )}
      </Field>

      <CartFooter
        totals={cart.totals}
        actionLabel={config.action}
        actionVariant={config.variant}
        loading={create.isPending}
        onReset={() => setDialog('reset')}
        onSubmit={requestSubmit}
      />

      <ConfirmDialog
        open={dialog === 'confirm'}
        title={`Confirm ${config.title}`}
        confirmLabel={`Confirm ${config.action}`}
        variant={config.variant}
        loading={create.isPending}
        onConfirm={submit}
        onClose={() => setDialog(null)}
      >
        <p className="text-slate-600">
          {partsSummary(cart.totals.parts, cart.totals.units)} at{' '}
          <span className="font-semibold text-slate-900">{branch.name}</span>
          {details.noBill ? ' (no bill)' : ` · invoice ${details.invoiceNumber.trim()}`}
        </p>
        <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-sm">
          {cart.lines.map((l) => (
            <li key={l.productId} className="flex justify-between gap-3">
              <span className="truncate">{l.name}</span>
              <span className="tabular shrink-0 font-medium">
                {isOut ? '−' : '+'}
                {formatNumber(l.quantity)} {l.unitCode}
              </span>
            </li>
          ))}
        </ul>
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === 'reset'}
        title="Clear this entry?"
        message="All added parts and details will be removed."
        confirmLabel="Clear"
        onConfirm={resetAll}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}

/** Stock IN / OUT screen; remounts per branch so carts never mix branches. */
export function StockEntryPage({ mode }) {
  const { branch } = useAuth();
  return <StockEntryForm key={`${mode}-${branch.id}`} mode={mode} branch={branch} />;
}
