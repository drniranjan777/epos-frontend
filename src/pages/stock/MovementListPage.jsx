import { ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { DataView } from '../../components/common/DataView';
import { PageHeader } from '../../components/common/PageHeader';
import { Pagination } from '../../components/common/Pagination';
import { SearchInput } from '../../components/common/SearchInput';
import { EmptyState, QueryState } from '../../components/common/States';
import { Input, Select } from '../../components/forms/Field';
import { BranchSelect } from '../../components/layout/BranchSelect';
import { MovementTypeBadge } from '../../components/stock/MovementTypeBadge';
import { PAGE_SIZE } from '../../constants/app';
import { useDebounce } from '../../hooks/useDebounce';
import { useMovements } from '../../hooks/useStockDocuments';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { formatDate, formatNumber, partsSummary } from '../../utils/format';

/** History of multi-item Stock IN / OUT entries in the current branch. */
export function MovementListPage() {
  const [filters, setFilters] = useUrlFilters({ page: '1' });
  const [search, setSearch] = useState(filters.search ?? '');
  const debounced = useDebounce(search.trim());
  const movements = useMovements({
    page: filters.page,
    limit: PAGE_SIZE,
    type: filters.type,
    from: filters.from,
    to: filters.to,
    search: debounced || undefined,
  });

  const columns = [
    { header: 'Entry', cell: (m) => <span className="font-medium">{m.movementNo}</span> },
    { header: 'Type', cell: (m) => <MovementTypeBadge type={m.type} /> },
    { header: 'Date', cell: (m) => formatDate(m.movementDate) },
    { header: 'Invoice', cell: (m) => (m.noBill ? <Badge>No bill</Badge> : m.invoiceNumber) },
    { header: 'Customer', cell: (m) => m.partyName ?? '—' },
    {
      header: 'Parts',
      align: 'right',
      cell: (m) => `${m.lineCount} · ${formatNumber(m.totalQuantity)} units`,
    },
    { header: 'By', cell: (m) => m.createdByName },
  ];

  return (
    <div>
      <PageHeader
        title="Stock entries"
        subtitle="Multi-part Stock IN and OUT"
        actions={<BranchSelect />}
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SearchInput
          className="sm:col-span-2 lg:col-span-1"
          value={search}
          onChange={(value) => {
            setSearch(value);
            setFilters({ search: value.trim() });
          }}
          placeholder="Entry no., invoice, party"
        />
        <Select
          value={filters.type ?? ''}
          onChange={(e) => setFilters({ type: e.target.value })}
          aria-label="Type"
        >
          <option value="">IN and OUT</option>
          <option value="IN">Stock IN</option>
          <option value="OUT">Stock OUT</option>
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
          query={movements}
          isEmpty={(d) => d.items.length === 0}
          empty={<EmptyState icon={ClipboardList} title="No stock entries yet" />}
        >
          {(data) => (
            <>
              <DataView
                items={data.items}
                columns={columns}
                getLink={(m) => `/stock/entries/${m.id}`}
                renderCard={(m) => (
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-medium">{m.movementNo}</p>
                      <MovementTypeBadge type={m.type} />
                    </div>
                    <p className="truncate text-sm text-slate-500">
                      {formatDate(m.movementDate)} · {m.noBill ? 'No bill' : m.invoiceNumber}
                      {m.partyName && ` · ${m.partyName}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {partsSummary(m.lineCount, m.totalQuantity)} · {m.createdByName}
                    </p>
                  </div>
                )}
              />
              <Pagination
                meta={data.meta}
                isFetching={movements.isFetching}
                onPageChange={(page) => setFilters({ page })}
              />
            </>
          )}
        </QueryState>
      </Card>
    </div>
  );
}
