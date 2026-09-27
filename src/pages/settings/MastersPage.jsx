import { useSearchParams } from 'react-router';
import { PageHeader } from '../../components/common/PageHeader';
import { MasterManager } from '../../components/forms/MasterManager';
import { cn } from '../../utils/cn';

const toIdOrNull = (v) => (v === '' || v == null ? null : Number(v));

const DIRECTION_LABELS = { IN: 'Adds stock', OUT: 'Removes stock', BOTH: 'Both directions' };

const TABS = [
  {
    key: 'categories',
    label: 'Categories',
    entity: 'Category',
    fields: [
      { name: 'name', label: 'Name', required: true },
      {
        name: 'parentId',
        label: 'Parent category',
        type: 'select',
        placeholder: 'None (top level)',
        parse: toIdOrNull,
        // Only top-level categories can be parents, and never the category itself.
        options: (records, editing) =>
          records
            .filter((c) => !c.parentId && c.id !== editing?.id)
            .map((c) => ({ value: c.id, label: c.name })),
      },
      { name: 'description', label: 'Description' },
    ],
    columns: [
      { header: 'Name', cell: (c) => <span className="font-medium">{c.name}</span> },
      { header: 'Parent', cell: (c) => c.parentName ?? '—' },
      { header: 'Description', cell: (c) => c.description ?? '—' },
    ],
    renderCard: (c) => (
      <>
        <p className="truncate font-medium">
          {c.parentName ? `${c.parentName} › ${c.name}` : c.name}
        </p>
        {c.description && <p className="truncate text-sm text-slate-500">{c.description}</p>}
      </>
    ),
  },
  {
    key: 'brands',
    label: 'Brands',
    entity: 'Brand',
    fields: [{ name: 'name', label: 'Name', required: true }],
    columns: [{ header: 'Name', cell: (b) => <span className="font-medium">{b.name}</span> }],
    renderCard: (b) => <p className="font-medium">{b.name}</p>,
  },
  {
    key: 'units',
    label: 'Units',
    entity: 'Unit',
    fields: [
      { name: 'name', label: 'Name', required: true },
      {
        name: 'code',
        label: 'Code',
        required: true,
        uppercase: true,
        hint: 'Printed on invoices, e.g. PCS',
      },
      {
        name: 'allowDecimal',
        label: 'Allow decimal quantities',
        type: 'switch',
        hint: 'For litres, kilograms, metres…',
      },
    ],
    columns: [
      { header: 'Code', cell: (u) => <span className="font-medium">{u.code}</span> },
      { header: 'Name', cell: (u) => u.name },
      { header: 'Decimals', cell: (u) => (u.allowDecimal ? 'Allowed' : 'Whole numbers') },
    ],
    renderCard: (u) => (
      <>
        <p className="font-medium">
          {u.code} · {u.name}
        </p>
        <p className="text-sm text-slate-500">
          {u.allowDecimal ? 'Decimals allowed' : 'Whole numbers only'}
        </p>
      </>
    ),
  },
  {
    key: 'adjustmentCodes',
    label: 'Adjustment reasons',
    entity: 'Adjustment reason',
    fields: [
      { name: 'code', label: 'Code', required: true, uppercase: true, lockedOnEdit: true },
      { name: 'name', label: 'Name', required: true },
      {
        name: 'direction',
        label: 'Direction',
        type: 'select',
        required: true,
        options: () => Object.entries(DIRECTION_LABELS).map(([value, label]) => ({ value, label })),
      },
    ],
    columns: [
      { header: 'Name', cell: (a) => <span className="font-medium">{a.name}</span> },
      { header: 'Code', cell: (a) => <span className="font-mono text-xs">{a.code}</span> },
      { header: 'Direction', cell: (a) => DIRECTION_LABELS[a.direction] },
    ],
    renderCard: (a) => (
      <>
        <p className="font-medium">{a.name}</p>
        <p className="text-sm text-slate-500">{DIRECTION_LABELS[a.direction]}</p>
      </>
    ),
  },
];

export function MastersPage() {
  const [params, setParams] = useSearchParams();
  const active = TABS.find((t) => t.key === params.get('tab')) ?? TABS[0];

  return (
    <div>
      <PageHeader title="Masters" subtitle="Lists used across products and stock" />
      <div
        role="tablist"
        className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === active.key}
            onClick={() => setParams({ tab: tab.key }, { replace: true })}
            className={cn(
              'h-10 shrink-0 rounded-full px-4 text-sm font-semibold ring-1',
              tab.key === active.key
                ? 'bg-slate-900 text-white ring-slate-900'
                : 'bg-white text-slate-700 ring-slate-300',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <MasterManager
        key={active.key}
        name={active.key}
        entity={active.entity}
        fields={active.fields}
        columns={active.columns}
        renderCard={active.renderCard}
      />
    </div>
  );
}
