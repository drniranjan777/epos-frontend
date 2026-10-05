import { Printer } from 'lucide-react';
import { useParams } from 'react-router';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorState, ListSkeleton } from '../../components/common/States';
import { MovementTypeBadge } from '../../components/stock/MovementTypeBadge';
import { useMovement } from '../../hooks/useStockDocuments';
import { formatDate, formatDateTime, formatNumber, partsSummary } from '../../utils/format';

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium">{children || '—'}</dd>
    </div>
  );
}

/** One Stock IN / OUT entry with its lines and the resulting balances; printable. */
export function MovementDetailPage() {
  const { id } = useParams();
  const movement = useMovement(id);

  if (movement.isPending) return <ListSkeleton rows={6} />;
  if (movement.isError) {
    return <ErrorState error={movement.error} onRetry={() => movement.refetch()} />;
  }
  const m = movement.data;
  const sign = m.type === 'IN' ? '+' : '−';

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print">
        <PageHeader
          title={m.movementNo}
          subtitle={`${m.branchName} · ${formatDate(m.movementDate)}`}
          backTo={`/stock/entries?type=${m.type}`}
          actions={
            <>
              <MovementTypeBadge type={m.type} />
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer className="size-4" aria-hidden /> Print
              </Button>
            </>
          }
        />
      </div>

      <Card className="print-area p-4 sm:p-6 print:p-0 print:shadow-none print:ring-0">
        <div className="mb-4 hidden print:block">
          <p className="text-lg font-bold">
            {m.type === 'IN' ? 'Stock IN' : 'Stock OUT'} · {m.movementNo}
          </p>
          <p className="text-sm">
            {m.branchName} · {formatDate(m.movementDate)}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Detail label="Invoice number">
            {m.noBill ? <Badge>No bill</Badge> : m.invoiceNumber}
          </Detail>
          <Detail label="Customer">{m.partyName}</Detail>
          <Detail label="Recorded by">{m.createdByName}</Detail>
          <Detail label="Recorded at">{formatDateTime(m.createdAt)}</Detail>
        </dl>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Part</th>
              <th className="py-2 pr-2 text-right">Qty</th>
              <th className="py-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {m.items.map((item) => (
              <tr key={item.lineNo} className="align-top">
                <td className="tabular py-2 pr-2 text-slate-500">
                  {String(item.lineNo).padStart(2, '0')}
                </td>
                <td className="py-2 pr-2">
                  {item.productName}
                  <span className="block text-xs text-slate-500">
                    {[item.sku, item.partNumber].filter(Boolean).join(' · ')}
                  </span>
                </td>
                <td className="tabular py-2 pr-2 text-right font-semibold">
                  {sign}
                  {formatNumber(item.quantity)} {item.unitCode}
                </td>
                <td className="tabular py-2 text-right text-slate-600">
                  {formatNumber(item.previousBalance)} → {formatNumber(item.newBalance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 border-t border-slate-200 pt-3 font-semibold">
          {partsSummary(m.lineCount, m.totalQuantity)}
        </p>
        {m.note && (
          <p className="mt-3 text-sm whitespace-pre-line text-slate-700">Note: {m.note}</p>
        )}
      </Card>
    </div>
  );
}
