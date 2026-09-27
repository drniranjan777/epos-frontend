import { FileText, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DataView } from '../../components/common/DataView';
import { PageHeader } from '../../components/common/PageHeader';
import { Pagination } from '../../components/common/Pagination';
import { SearchInput } from '../../components/common/SearchInput';
import { EmptyState, QueryState } from '../../components/common/States';
import { Input, Select } from '../../components/forms/Field';
import { StatusBadge } from '../../components/invoice/StatusBadge';
import { INVOICE_STATUS, PAGE_SIZE } from '../../constants/app';
import { PERMISSIONS as P } from '../../constants/permissions';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { useInvoices } from '../../hooks/useInvoices';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { formatCurrency, formatDate } from '../../utils/format';

export function InvoiceListPage() {
  const { can } = useAuth();
  const [filters, setFilters] = useUrlFilters({ page: '1' });
  const [search, setSearch] = useState(filters.search ?? '');
  const debounced = useDebounce(search.trim());
  const invoices = useInvoices({
    page: filters.page,
    limit: PAGE_SIZE,
    search: debounced || undefined,
    status: filters.status,
    from: filters.from,
    to: filters.to,
  });

  const columns = [
    {
      header: 'Invoice',
      cell: (i) => <span className="font-medium">{i.invoiceNo ?? `Draft #${i.id}`}</span>,
    },
    { header: 'Date', cell: (i) => formatDate(i.invoiceDate) },
    {
      header: 'Customer',
      cell: (i) => (
        <>
          {i.customerCompanyName || i.customerName}
          {i.customerGstin && (
            <span className="block font-mono text-xs text-slate-500">{i.customerGstin}</span>
          )}
        </>
      ),
    },
    { header: 'Items', align: 'right', cell: (i) => i.itemCount },
    {
      header: 'Amount',
      align: 'right',
      cell: (i) => <span className="font-semibold">{formatCurrency(i.grandTotal)}</span>,
    },
    { header: 'Status', cell: (i) => <StatusBadge status={i.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Invoices"
        actions={
          can(P.INVOICE_CREATE) && (
            <Button to="/invoices/new" variant="brand">
              <Plus className="size-5" aria-hidden />
              New invoice
            </Button>
          )
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SearchInput
          className="sm:col-span-2 lg:col-span-1"
          value={search}
          onChange={(value) => {
            setSearch(value);
            setFilters({ search: value.trim() });
          }}
          placeholder="Invoice no., customer, GSTIN"
        />
        <Select
          value={filters.status ?? ''}
          onChange={(e) => setFilters({ status: e.target.value })}
          aria-label="Status"
        >
          <option value="">All statuses</option>
          {Object.entries(INVOICE_STATUS).map(([value, { label }]) => (
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
          empty={<EmptyState icon={FileText} title="No invoices found" />}
        >
          {(data) => (
            <>
              <DataView
                items={data.items}
                columns={columns}
                getLink={(i) => `/invoices/${i.id}`}
                renderCard={(i) => (
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-medium">{i.invoiceNo ?? `Draft #${i.id}`}</p>
                      <p className="tabular font-semibold">{formatCurrency(i.grandTotal)}</p>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-3 text-sm text-slate-500">
                      <span className="truncate">
                        {i.customerCompanyName || i.customerName} · {formatDate(i.invoiceDate)}
                      </span>
                      <StatusBadge status={i.status} />
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
