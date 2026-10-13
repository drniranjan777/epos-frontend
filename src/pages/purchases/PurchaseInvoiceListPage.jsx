import { ReceiptText } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { DataView } from '../../components/common/DataView';
import { PageHeader } from '../../components/common/PageHeader';
import { Pagination } from '../../components/common/Pagination';
import { SearchInput } from '../../components/common/SearchInput';
import { EmptyState, QueryState } from '../../components/common/States';
import { Input, Select } from '../../components/forms/Field';
import { PAGE_SIZE, PAYMENT_STATUS } from '../../constants/app';
import { useDebounce } from '../../hooks/useDebounce';
import { usePurchaseInvoices } from '../../hooks/usePurchaseInvoices';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { formatCurrency, formatDate } from '../../utils/format';

export function PaymentBadge({ status }) {
  const meta = PAYMENT_STATUS[status] ?? { label: status, tone: 'neutral' };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

const supplierOf = (i) => i.supplierName || (i.noBill ? 'No bill' : '—');

/** Billing (purchase) invoices of the branch. Each one was created by a Stock IN. */
export function PurchaseInvoiceListPage() {
  const [filters, setFilters] = useUrlFilters({ page: '1' });
  const [search, setSearch] = useState(filters.search ?? '');
  const debounced = useDebounce(search.trim());
  const invoices = usePurchaseInvoices({
    page: filters.page,
    limit: PAGE_SIZE,
    search: debounced || undefined,
    paymentStatus: filters.paymentStatus,
    from: filters.from,
    to: filters.to,
  });

  const columns = [
    { header: 'Invoice', cell: (i) => <span className="font-medium">{i.invoiceNo}</span> },
    { header: 'Date', cell: (i) => formatDate(i.invoiceDate) },
    {
      header: 'Supplier',
      cell: (i) => (
        <>
          {supplierOf(i)}
          {i.supplierInvoiceNumber && (
            <span className="block text-xs text-slate-500">Bill {i.supplierInvoiceNumber}</span>
          )}
        </>
      ),
    },
    { header: 'Stock IN', cell: (i) => i.movementNo },
    {
      header: 'Total',
      align: 'right',
      cell: (i) => <span className="font-semibold">{formatCurrency(i.grandTotal)}</span>,
    },
    { header: 'Paid', align: 'right', cell: (i) => formatCurrency(i.paidAmount) },
    { header: 'Outstanding', align: 'right', cell: (i) => formatCurrency(i.outstandingAmount) },
    { header: 'Payment', cell: (i) => <PaymentBadge status={i.paymentStatus} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Billing Invoices"
        subtitle="Purchase invoices, created automatically by every Stock IN"
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SearchInput
          className="sm:col-span-2 lg:col-span-1"
          value={search}
          onChange={(value) => {
            setSearch(value);
            setFilters({ search: value.trim() });
          }}
          placeholder="Invoice, supplier, bill or Stock IN no."
        />
        <Select
          value={filters.paymentStatus ?? ''}
          onChange={(e) => setFilters({ paymentStatus: e.target.value })}
          aria-label="Payment status"
        >
          <option value="">All payments</option>
          {Object.entries(PAYMENT_STATUS).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-2">
          <Input
            type="date"
            aria-label="From date"
            value={filters.from ?? ''}
            onChange={(e) => setFilters({ from: e.target.value })}
          />
          <Input
            type="date"
            aria-label="To date"
            value={filters.to ?? ''}
            onChange={(e) => setFilters({ to: e.target.value })}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <QueryState
          query={invoices}
          isEmpty={(d) => d.items.length === 0}
          empty={
            <EmptyState
              icon={ReceiptText}
              title="No billing invoices found"
              message="An invoice appears here each time stock is received with Stock IN."
            />
          }
        >
          {(data) => (
            <>
              <DataView
                items={data.items}
                columns={columns}
                getLink={(i) => `/billing-invoices/${i.id}`}
                renderCard={(i) => (
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-medium">{i.invoiceNo}</p>
                      <p className="tabular font-semibold">{formatCurrency(i.grandTotal)}</p>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-3 text-sm text-slate-500">
                      <span className="truncate">
                        {supplierOf(i)} · {formatDate(i.invoiceDate)}
                      </span>
                      <PaymentBadge status={i.paymentStatus} />
                    </div>
                  </div>
                )}
              />
              <Pagination
                meta={data.meta}
                isFetching={invoices.isFetching}
                onPageChange={(page) => setFilters({ page })}
              />
            </>
          )}
        </QueryState>
      </Card>
    </div>
  );
}
