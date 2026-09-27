import { formatCurrency } from '../../utils/format';

/** Tax breakup and grand total. Works for both live previews and saved invoices. */
export function InvoiceTotals({ totals, supplyType }) {
  const rows = [['Taxable amount', totals.taxableAmount]];
  if (Number(totals.totalDiscount) > 0) rows.unshift(['Discount', -totals.totalDiscount]);
  if (supplyType === 'INTER') rows.push(['IGST', totals.igstAmount]);
  else rows.push(['CGST', totals.cgstAmount], ['SGST', totals.sgstAmount]);
  if (Number(totals.roundOff) !== 0) rows.push(['Round off', totals.roundOff]);

  return (
    <dl className="space-y-1.5 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4">
          <dt className="text-slate-600">{label}</dt>
          <dd className="tabular">{formatCurrency(value)}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 text-base font-bold">
        <dt>Grand total</dt>
        <dd className="tabular">{formatCurrency(totals.grandTotal)}</dd>
      </div>
    </dl>
  );
}
