import { ArrowRight, Plus, Truck } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DataView } from '../../components/common/DataView';
import { PageHeader } from '../../components/common/PageHeader';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState, QueryState } from '../../components/common/States';
import { BranchSelect } from '../../components/layout/BranchSelect';
import { TransferStatusBadge } from '../../components/stock/TransferStatusBadge';
import { PAGE_SIZE } from '../../constants/app';
import { PERMISSIONS as P } from '../../constants/permissions';
import { useAuth } from '../../hooks/useAuth';
import { useTransfers } from '../../hooks/useStockDocuments';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { cn } from '../../utils/cn';
import { formatDateTime, formatNumber, partsSummary } from '../../utils/format';

/** Tabs: what needs my attention first, then everything. */
function tabsFor(can) {
  return [
    can(P.TRANSFER_APPROVE) && {
      key: 'approval',
      label: 'Needs approval',
      params: { status: 'REQUESTED', scope: 'everywhere' },
    },
    { key: 'incoming', label: 'Incoming', params: { direction: 'incoming', status: 'IN_TRANSIT' } },
    { key: 'outgoing', label: 'Outgoing', params: { direction: 'outgoing' } },
    { key: 'all', label: 'All', params: {} },
  ].filter(Boolean);
}

export function TransferListPage() {
  const { can } = useAuth();
  const tabs = tabsFor(can);
  const [filters, setFilters] = useUrlFilters({ page: '1' });
  const tab = tabs.find((t) => t.key === filters.tab) ?? tabs[0];
  const transfers = useTransfers({ page: filters.page, limit: PAGE_SIZE, ...tab.params });

  const columns = [
    { header: 'Transfer', cell: (t) => <span className="font-medium">{t.transferNo}</span> },
    {
      header: 'Route',
      cell: (t) => (
        <span className="inline-flex items-center gap-1.5">
          {t.fromBranchName} <ArrowRight className="size-3.5 text-slate-400" aria-hidden />{' '}
          {t.toBranchName}
        </span>
      ),
    },
    {
      header: 'Parts',
      align: 'right',
      cell: (t) => `${t.lineCount} · ${formatNumber(t.totalQuantity)} units`,
    },
    { header: 'Requested', cell: (t) => `${t.requestedByName} · ${formatDateTime(t.requestedAt)}` },
    { header: 'Status', cell: (t) => <TransferStatusBadge status={t.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Stock transfers"
        actions={
          <>
            <BranchSelect />
            {can(P.TRANSFER_REQUEST) && (
              <Button to="/transfers/new">
                <Plus className="size-5" aria-hidden /> New transfer
              </Button>
            )}
          </>
        }
      />
      <div
        role="tablist"
        className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={t.key === tab.key}
            onClick={() => setFilters({ tab: t.key })}
            className={cn(
              'h-10 shrink-0 rounded-full px-4 text-sm font-semibold ring-1',
              t.key === tab.key
                ? 'bg-slate-900 text-white ring-slate-900'
                : 'bg-white text-slate-700 ring-slate-300',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Card className="overflow-hidden">
        <QueryState
          query={transfers}
          isEmpty={(d) => d.items.length === 0}
          empty={<EmptyState icon={Truck} title="No transfers here" />}
        >
          {(data) => (
            <>
              <DataView
                items={data.items}
                columns={columns}
                getLink={(t) => `/transfers/${t.id}`}
                renderCard={(t) => (
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-medium">{t.transferNo}</p>
                      <TransferStatusBadge status={t.status} />
                    </div>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-600">
                      {t.fromBranchName}{' '}
                      <ArrowRight className="size-3.5 text-slate-400" aria-hidden />{' '}
                      {t.toBranchName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {partsSummary(t.lineCount, t.totalQuantity)} · {t.requestedByName}
                    </p>
                  </div>
                )}
              />
              <Pagination
                meta={data.meta}
                isFetching={transfers.isFetching}
                onPageChange={(page) => setFilters({ page })}
              />
            </>
          )}
        </QueryState>
      </Card>
    </div>
  );
}
