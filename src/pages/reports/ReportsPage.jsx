import { Download } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DataView } from '../../components/common/DataView';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { EmptyState, QueryState } from '../../components/common/States';
import { Input } from '../../components/forms/Field';
import { useMovementReport, useStockValuation } from '../../hooks/useAdmin';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '../../utils/cn';
import { formatCurrency, formatNumber, todayIso } from '../../utils/format';

// Byte-order mark so Excel opens the UTF-8 CSV with the right encoding.
const BOM = '﻿';

/** Builds a CSV file from rows and downloads it. */
function downloadCsv(fileName, headers, rows) {
  const escape = (value) => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function firstOfMonth() {
  return `${todayIso().slice(0, 8)}01`;
}

function ProductCell({ row }) {
  return (
    <>
      <span className="font-medium">{row.name}</span>
      <span className="block text-xs text-slate-500">{row.sku}</span>
    </>
  );
}

function StockValuationReport() {
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search.trim());
  const report = useStockValuation({ search: debounced || undefined });

  const columns = [
    { header: 'Product', cell: (r) => <ProductCell row={r} /> },
    { header: 'Category', cell: (r) => r.categoryName ?? '—' },
    {
      header: 'Stock',
      align: 'right',
      cell: (r) => `${formatNumber(r.stockQuantity)} ${r.unitCode}`,
    },
    { header: 'Purchase price', align: 'right', cell: (r) => formatCurrency(r.purchasePrice) },
    { header: 'Purchase value', align: 'right', cell: (r) => formatCurrency(r.purchaseValue) },
    { header: 'Selling value', align: 'right', cell: (r) => formatCurrency(r.sellingValue) },
  ];

  function exportCsv() {
    downloadCsv(
      `stock-valuation-${todayIso()}.csv`,
      [
        'Product',
        'SKU',
        'Category',
        'Stock',
        'Unit',
        'Purchase price',
        'Selling price',
        'Purchase value',
        'Selling value',
      ],
      report.data.rows.map((r) => [
        r.name,
        r.sku,
        r.categoryName,
        r.stockQuantity,
        r.unitCode,
        r.purchasePrice,
        r.sellingPrice,
        r.purchaseValue,
        r.sellingValue,
      ]),
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          className="min-w-0 flex-1 sm:max-w-sm"
          value={search}
          onChange={setSearch}
          placeholder="Search product"
        />
        <Button variant="secondary" disabled={!report.data?.rows.length} onClick={exportCsv}>
          <Download className="size-4" aria-hidden /> Export CSV
        </Button>
      </div>
      <QueryState
        query={report}
        isEmpty={(d) => d.rows.length === 0}
        empty={<EmptyState title="No products" />}
      >
        {(data) => (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <Card className="p-4">
                <p className="text-sm text-slate-500">Stock value at purchase price</p>
                <p className="tabular mt-1 text-xl font-bold">
                  {formatCurrency(data.totals.purchaseValue)}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-slate-500">Stock value at selling price</p>
                <p className="tabular mt-1 text-xl font-bold">
                  {formatCurrency(data.totals.sellingValue)}
                </p>
              </Card>
            </div>
            <Card className="overflow-hidden">
              <DataView
                items={data.rows}
                columns={columns}
                getLink={(r) => `/products/${r.id}`}
                renderCard={(r) => (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.name}</p>
                      <p className="text-sm text-slate-500">
                        {formatNumber(r.stockQuantity)} {r.unitCode} ×{' '}
                        {formatCurrency(r.purchasePrice)}
                      </p>
                    </div>
                    <p className="tabular shrink-0 font-semibold">
                      {formatCurrency(r.purchaseValue)}
                    </p>
                  </div>
                )}
              />
            </Card>
          </>
        )}
      </QueryState>
    </>
  );
}

function MovementReport() {
  const [range, setRange] = useState({ from: firstOfMonth(), to: todayIso() });
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search.trim());
  const report = useMovementReport({ ...range, search: debounced || undefined });

  const columns = [
    { header: 'Product', cell: (r) => <ProductCell row={r} /> },
    { header: 'Opening', align: 'right', cell: (r) => formatNumber(r.openingBalance) },
    {
      header: 'IN',
      align: 'right',
      cell: (r) => <span className="text-stock-in">{formatNumber(r.stockIn)}</span>,
    },
    {
      header: 'OUT',
      align: 'right',
      cell: (r) => <span className="text-stock-out">{formatNumber(r.stockOut)}</span>,
    },
    { header: 'Adjustments', align: 'right', cell: (r) => formatNumber(r.adjustments) },
    {
      header: 'Closing',
      align: 'right',
      cell: (r) => (
        <span className="font-semibold">
          {formatNumber(r.closingBalance)} {r.unitCode}
        </span>
      ),
    },
  ];

  function exportCsv() {
    downloadCsv(
      `stock-movement-${range.from}-to-${range.to}.csv`,
      ['Product', 'SKU', 'Unit', 'Opening', 'IN', 'OUT', 'Adjustments', 'Closing'],
      report.data.map((r) => [
        r.name,
        r.sku,
        r.unitCode,
        r.openingBalance,
        r.stockIn,
        r.stockOut,
        r.adjustments,
        r.closingBalance,
      ]),
    );
  }

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <SearchInput value={search} onChange={setSearch} placeholder="Search product" />
        <Input
          type="date"
          aria-label="From"
          value={range.from}
          max={range.to}
          onChange={(e) => e.target.value && setRange((r) => ({ ...r, from: e.target.value }))}
        />
        <Input
          type="date"
          aria-label="To"
          value={range.to}
          min={range.from}
          max={todayIso()}
          onChange={(e) => e.target.value && setRange((r) => ({ ...r, to: e.target.value }))}
        />
        <Button variant="secondary" disabled={!report.data?.length} onClick={exportCsv}>
          <Download className="size-4" aria-hidden /> CSV
        </Button>
      </div>
      <Card className="overflow-hidden">
        <QueryState
          query={report}
          isEmpty={(d) => d.length === 0}
          empty={<EmptyState title="No movements in this period" />}
        >
          {(rows) => (
            <DataView
              items={rows}
              columns={columns}
              getLink={(r) => `/products/${r.id}`}
              renderCard={(r) => (
                <div>
                  <p className="truncate font-medium">{r.name}</p>
                  <p className="tabular text-sm text-slate-500">
                    {formatNumber(r.openingBalance)}{' '}
                    <span className="text-stock-in">+{formatNumber(r.stockIn)}</span>{' '}
                    <span className="text-stock-out">−{formatNumber(r.stockOut)}</span>
                    {Number(r.adjustments) !== 0 &&
                      ` ${Number(r.adjustments) > 0 ? '+' : ''}${formatNumber(r.adjustments)} adj`}{' '}
                    ={' '}
                    <span className="font-semibold text-slate-900">
                      {formatNumber(r.closingBalance)} {r.unitCode}
                    </span>
                  </p>
                </div>
              )}
            />
          )}
        </QueryState>
      </Card>
    </>
  );
}

const REPORTS = [
  { key: 'valuation', label: 'Stock valuation', component: StockValuationReport },
  { key: 'movement', label: 'Stock movement', component: MovementReport },
];

export function ReportsPage() {
  const [params, setParams] = useSearchParams();
  const active = REPORTS.find((r) => r.key === params.get('report')) ?? REPORTS[0];
  const Report = active.component;

  return (
    <div>
      <PageHeader title="Reports" />
      <div role="tablist" className="mb-4 flex gap-2">
        {REPORTS.map((r) => (
          <button
            key={r.key}
            type="button"
            role="tab"
            aria-selected={r.key === active.key}
            onClick={() => setParams({ report: r.key }, { replace: true })}
            className={cn(
              'h-10 rounded-full px-4 text-sm font-semibold ring-1',
              r.key === active.key
                ? 'bg-slate-900 text-white ring-slate-900'
                : 'bg-white text-slate-700 ring-slate-300',
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
      <Report />
    </div>
  );
}
