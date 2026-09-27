import { formatCurrency, formatDate, formatNumber } from '../../utils/format';
import { InvoiceTotals } from './InvoiceTotals';

function lines(...values) {
  return values.filter(Boolean).join('\n');
}

function Party({ title, name, company, address, extra }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</p>
      <p className="mt-1 font-semibold">{company || name}</p>
      {company && name !== company && <p className="text-sm">{name}</p>}
      {address && <p className="text-sm whitespace-pre-line text-slate-600">{address}</p>}
      {extra}
    </div>
  );
}

/**
 * Printable GST invoice. Stacks for phones on screen; always prints as an A4 table
 * (`print:` variants), so a phone and a desktop print the same document.
 */
export function InvoicePrintView({ invoice }) {
  const company = invoice.company ?? {};
  const isInter = invoice.supplyType === 'INTER';
  const bank = lines(
    company.bankName && `Bank: ${company.bankName}`,
    company.bankAccountName && `A/c Name: ${company.bankAccountName}`,
    company.bankAccountNumber && `A/c No: ${company.bankAccountNumber}`,
    company.bankIfsc && `IFSC: ${company.bankIfsc}`,
    company.bankBranch && `Branch: ${company.bankBranch}`,
  );

  return (
    <article className="print-area relative overflow-hidden rounded-xl bg-white p-4 text-slate-900 shadow-sm ring-1 ring-slate-200 sm:p-8 print:rounded-none print:p-0 print:text-[11px] print:shadow-none print:ring-0">
      {invoice.status !== 'FINAL' && (
        <p
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-7xl font-black tracking-widest opacity-10 select-none sm:text-9xl"
          aria-hidden
        >
          <span className="-rotate-30">{invoice.status}</span>
        </p>
      )}

      <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:justify-between print:flex-row print:justify-between">
        <div className="flex gap-3">
          {company.logoUrl && (
            <img src={company.logoUrl} alt="" className="size-16 object-contain" />
          )}
          <div>
            <p className="text-lg font-bold">{company.companyName}</p>
            <p className="text-sm whitespace-pre-line text-slate-600">
              {lines(company.address, [company.city, company.pincode].filter(Boolean).join(' - '))}
            </p>
            <p className="text-sm text-slate-600">
              {[company.phone, company.email].filter(Boolean).join(' · ')}
            </p>
            {company.gstin && <p className="text-sm font-semibold">GSTIN: {company.gstin}</p>}
            {company.state && (
              <p className="text-sm text-slate-600">
                State: {company.state} ({company.stateCode})
              </p>
            )}
          </div>
        </div>
        <div className="sm:text-right print:text-right">
          <p className="text-xl font-bold tracking-wide">TAX INVOICE</p>
          <p className="font-semibold">{invoice.invoiceNo ?? 'Draft'}</p>
          <p className="text-sm">Date: {formatDate(invoice.invoiceDate)}</p>
          <p className="text-sm text-slate-600">
            Place of supply: {invoice.placeOfSupplyState ?? '—'}
            {invoice.placeOfSupplyStateCode && ` (${invoice.placeOfSupplyStateCode})`}
          </p>
        </div>
      </header>

      <section className="grid gap-4 border-b border-slate-200 py-4 sm:grid-cols-2 print:grid-cols-2">
        <Party
          title="Bill to"
          name={invoice.customerName}
          company={invoice.customerCompanyName}
          address={invoice.billingAddress}
          extra={
            <div className="text-sm">
              {invoice.customerGstin && (
                <p className="font-semibold">GSTIN: {invoice.customerGstin}</p>
              )}
              {invoice.customerState && (
                <p className="text-slate-600">
                  State: {invoice.customerState} ({invoice.customerStateCode})
                </p>
              )}
              {invoice.customerMobile && (
                <p className="text-slate-600">Mobile: {invoice.customerMobile}</p>
              )}
            </div>
          }
        />
        <Party
          title="Ship to"
          name={invoice.customerName}
          company={invoice.customerCompanyName}
          address={invoice.shippingAddress}
        />
      </section>

      {/* Phones: stacked lines. */}
      <ul className="divide-y divide-slate-100 md:hidden print:hidden">
        {invoice.items.map((item) => (
          <li key={item.id} className="py-3">
            <div className="flex justify-between gap-3">
              <p className="font-medium">{item.productName}</p>
              <p className="tabular font-semibold">{formatCurrency(item.lineTotal)}</p>
            </div>
            <p className="text-sm text-slate-500">
              {formatNumber(item.quantity)} {item.unit} × {formatCurrency(item.rate)}
              {Number(item.discountPercent) > 0 && ` − ${formatNumber(item.discountPercent)}%`} ·
              GST {formatNumber(item.gstRate)}%
            </p>
            <p className="text-xs text-slate-400">
              {[item.sku, item.hsnCode && `HSN ${item.hsnCode}`].filter(Boolean).join(' · ')}
            </p>
          </li>
        ))}
      </ul>

      {/* Tablets, desktops and print: table. */}
      <table className="mt-4 hidden w-full text-sm md:table print:table print:text-[10px]">
        <thead>
          <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs text-slate-600">
            <th className="px-2 py-2">#</th>
            <th className="px-2 py-2">Description</th>
            <th className="px-2 py-2">HSN</th>
            <th className="px-2 py-2 text-right">Qty</th>
            <th className="px-2 py-2 text-right">Rate</th>
            <th className="px-2 py-2 text-right">Disc %</th>
            <th className="px-2 py-2 text-right">Taxable</th>
            <th className="px-2 py-2 text-right">GST %</th>
            <th className="px-2 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoice.items.map((item) => (
            <tr key={item.id} className="tabular align-top">
              <td className="px-2 py-2">{item.lineNo}</td>
              <td className="px-2 py-2">
                {item.productName}
                <span className="block text-xs text-slate-500">
                  {[item.sku, item.partNumber].filter(Boolean).join(' · ')}
                </span>
              </td>
              <td className="px-2 py-2">{item.hsnCode}</td>
              <td className="px-2 py-2 text-right">
                {formatNumber(item.quantity)} {item.unit}
              </td>
              <td className="px-2 py-2 text-right">{formatNumber(item.rate)}</td>
              <td className="px-2 py-2 text-right">
                {Number(item.discountPercent) ? formatNumber(item.discountPercent) : '—'}
              </td>
              <td className="px-2 py-2 text-right">{formatNumber(item.taxableValue)}</td>
              <td className="px-2 py-2 text-right">{formatNumber(item.gstRate)}</td>
              <td className="px-2 py-2 text-right font-medium">{formatNumber(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-4 grid gap-6 border-t border-slate-200 pt-4 sm:grid-cols-2 print:grid-cols-2">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Amount in words
            </p>
            <p className="font-medium">{invoice.amountInWords}</p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-1">HSN</th>
                <th className="py-1 text-right">GST %</th>
                <th className="py-1 text-right">Taxable</th>
                {isInter ? (
                  <th className="py-1 text-right">IGST</th>
                ) : (
                  <>
                    <th className="py-1 text-right">CGST</th>
                    <th className="py-1 text-right">SGST</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {invoice.hsnSummary.map((row) => (
                <tr key={`${row.hsnCode}-${row.gstRate}`} className="tabular">
                  <td className="py-1">{row.hsnCode ?? '—'}</td>
                  <td className="py-1 text-right">{formatNumber(row.gstRate)}</td>
                  <td className="py-1 text-right">{formatNumber(row.taxableValue)}</td>
                  {isInter ? (
                    <td className="py-1 text-right">{formatNumber(row.igstAmount)}</td>
                  ) : (
                    <>
                      <td className="py-1 text-right">{formatNumber(row.cgstAmount)}</td>
                      <td className="py-1 text-right">{formatNumber(row.sgstAmount)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <InvoiceTotals totals={invoice} supplyType={invoice.supplyType} />
      </section>

      <footer className="mt-6 grid gap-6 text-sm sm:grid-cols-2 print:grid-cols-2">
        <div className="space-y-3">
          {bank && (
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Bank details
              </p>
              <p className="whitespace-pre-line text-slate-700">{bank}</p>
            </div>
          )}
          {company.termsAndConditions && (
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Terms & conditions
              </p>
              <p className="whitespace-pre-line text-slate-700">{company.termsAndConditions}</p>
            </div>
          )}
          {invoice.notes && (
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Notes</p>
              <p className="whitespace-pre-line text-slate-700">{invoice.notes}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end justify-between gap-12">
          <p className="font-semibold">For {company.companyName}</p>
          <p className="text-slate-600">Authorised signatory</p>
        </div>
      </footer>
      {invoice.status === 'CANCELLED' && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Cancelled on {formatDate(invoice.cancelledAt?.slice(0, 10))}: {invoice.cancelReason}
        </p>
      )}
    </article>
  );
}
