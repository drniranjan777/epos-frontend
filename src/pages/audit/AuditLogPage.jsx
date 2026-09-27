import { ChevronDown, ScrollText } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { PageHeader } from '../../components/common/PageHeader';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState, QueryState } from '../../components/common/States';
import { Input, Select } from '../../components/forms/Field';
import { PAGE_SIZE } from '../../constants/app';
import { useAuditLogs } from '../../hooks/useAdmin';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { cn } from '../../utils/cn';
import { formatDateTime } from '../../utils/format';

const MODULES = [
  'auth',
  'users',
  'roles',
  'products',
  'categories',
  'brands',
  'units',
  'gst_rates',
  'adjustment_codes',
  'inventory',
  'customers',
  'invoices',
  'settings',
];

const ACTION_TONES = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
  CANCEL: 'danger',
  STOCK_IN: 'success',
  STOCK_OUT: 'warning',
  STOCK_ADJUST: 'warning',
  FINALIZE: 'success',
};

const label = (text) =>
  text
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());

/** Lists only the fields that changed between old and new values. */
function changedFields(oldValue, newValue) {
  if (!oldValue || !newValue || typeof oldValue !== 'object' || typeof newValue !== 'object') {
    return null;
  }
  const ignored = new Set(['updatedAt', 'createdAt']);
  return Object.keys({ ...oldValue, ...newValue })
    .filter(
      (key) => !ignored.has(key) && JSON.stringify(oldValue[key]) !== JSON.stringify(newValue[key]),
    )
    .map((key) => ({ key, from: oldValue[key], to: newValue[key] }));
}

const show = (value) =>
  value === null || value === undefined || value === ''
    ? '—'
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);

function AuditEntry({ entry }) {
  const [open, setOpen] = useState(false);
  const changes = changedFields(entry.oldValue, entry.newValue);
  const hasDetails = entry.oldValue || entry.newValue;

  return (
    <li className="px-4 py-3">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 text-left disabled:cursor-default"
        onClick={() => setOpen((v) => !v)}
        disabled={!hasDetails}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={ACTION_TONES[entry.action] ?? 'neutral'}>{label(entry.action)}</Badge>
            <span className="text-sm font-medium">{label(entry.module)}</span>
            {entry.recordId && <span className="text-sm text-slate-500">#{entry.recordId}</span>}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {entry.userName ?? 'System'} · {formatDateTime(entry.createdAt)}
            {entry.ip && ` · ${entry.ip}`}
          </p>
        </div>
        {hasDetails && (
          <ChevronDown
            className={cn('mt-1 size-5 shrink-0 text-slate-400 transition', open && 'rotate-180')}
            aria-hidden
          />
        )}
      </button>
      {open && (
        <div className="mt-3 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs">
          {changes ? (
            changes.length === 0 ? (
              <p className="text-slate-500">No field changes.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-1 pr-3 font-medium">Field</th>
                    <th className="py-1 pr-3 font-medium">Old</th>
                    <th className="py-1 font-medium">New</th>
                  </tr>
                </thead>
                <tbody>
                  {changes.map((c) => (
                    <tr key={c.key} className="align-top">
                      <td className="py-1 pr-3 font-medium">{c.key}</td>
                      <td className="py-1 pr-3 break-all text-red-700">{show(c.from)}</td>
                      <td className="py-1 break-all text-emerald-700">{show(c.to)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            <pre className="break-all whitespace-pre-wrap">
              {JSON.stringify(entry.newValue ?? entry.oldValue, null, 2)}
            </pre>
          )}
        </div>
      )}
    </li>
  );
}

export function AuditLogPage() {
  const [filters, setFilters] = useUrlFilters({ page: '1' });
  const logs = useAuditLogs({
    page: filters.page,
    limit: PAGE_SIZE,
    module: filters.module,
    from: filters.from,
    to: filters.to,
  });

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Who changed what, and when" />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Select
          value={filters.module ?? ''}
          onChange={(e) => setFilters({ module: e.target.value })}
          aria-label="Module"
        >
          <option value="">All modules</option>
          {MODULES.map((m) => (
            <option key={m} value={m}>
              {label(m)}
            </option>
          ))}
        </Select>
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
      <Card className="overflow-hidden">
        <QueryState
          query={logs}
          isEmpty={(d) => d.items.length === 0}
          empty={<EmptyState icon={ScrollText} title="No audit entries" />}
        >
          {(data) => (
            <>
              <ul className="divide-y divide-slate-100">
                {data.items.map((entry) => (
                  <AuditEntry key={entry.id} entry={entry} />
                ))}
              </ul>
              <Pagination
                meta={data.meta}
                isFetching={logs.isFetching}
                onPageChange={(page) => setFilters({ page })}
              />
            </>
          )}
        </QueryState>
      </Card>
    </div>
  );
}
