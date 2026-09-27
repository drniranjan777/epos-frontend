import { Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DataView } from '../../components/common/DataView';
import { PageHeader } from '../../components/common/PageHeader';
import { Pagination } from '../../components/common/Pagination';
import { SearchInput } from '../../components/common/SearchInput';
import { EmptyState, QueryState } from '../../components/common/States';
import { PAGE_SIZE } from '../../constants/app';
import { PERMISSIONS as P } from '../../constants/permissions';
import { useAuth } from '../../hooks/useAuth';
import { useCustomers } from '../../hooks/useCustomers';
import { useDebounce } from '../../hooks/useDebounce';
import { useUrlFilters } from '../../hooks/useUrlFilters';

export function CustomerListPage() {
  const { can } = useAuth();
  const canManage = can(P.CUSTOMERS_MANAGE);
  const [filters, setFilters] = useUrlFilters({ page: '1' });
  const [search, setSearch] = useState(filters.search ?? '');
  const debounced = useDebounce(search.trim());
  const customers = useCustomers({
    page: filters.page,
    limit: PAGE_SIZE,
    search: debounced || undefined,
  });

  const columns = [
    {
      header: 'Customer',
      cell: (c) => (
        <>
          <span className="font-medium">{c.companyName || c.name}</span>
          {c.companyName && <span className="block text-xs text-slate-500">{c.name}</span>}
        </>
      ),
    },
    { header: 'Mobile', cell: (c) => c.mobile ?? '—' },
    { header: 'GSTIN', cell: (c) => <span className="font-mono text-xs">{c.gstin ?? '—'}</span> },
    { header: 'City / State', cell: (c) => [c.city, c.state].filter(Boolean).join(', ') || '—' },
    {
      header: 'Status',
      cell: (c) => (c.isActive ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        actions={
          canManage && (
            <Button to="/customers/new">
              <Plus className="size-5" aria-hidden />
              New customer
            </Button>
          )
        }
      />
      <SearchInput
        className="mb-4 max-w-md"
        value={search}
        onChange={(value) => {
          setSearch(value);
          setFilters({ search: value.trim() });
        }}
        placeholder="Name, company, mobile, GSTIN or city"
      />
      <Card className="overflow-hidden">
        <QueryState
          query={customers}
          isEmpty={(d) => d.items.length === 0}
          empty={<EmptyState icon={Users} title="No customers found" />}
        >
          {(data) => (
            <>
              <DataView
                items={data.items}
                columns={columns}
                getLink={canManage ? (c) => `/customers/${c.id}/edit` : undefined}
                renderCard={(c) => (
                  <div>
                    <p className="truncate font-medium">
                      {c.companyName || c.name} {!c.isActive && <Badge>Inactive</Badge>}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {[c.companyName && c.name, c.mobile, c.city].filter(Boolean).join(' · ')}
                    </p>
                    {c.gstin && <p className="font-mono text-xs text-slate-500">{c.gstin}</p>}
                  </div>
                )}
              />
              <Pagination
                meta={data.meta}
                isFetching={customers.isFetching}
                onPageChange={(page) => setFilters({ page })}
              />
            </>
          )}
        </QueryState>
      </Card>
    </div>
  );
}
