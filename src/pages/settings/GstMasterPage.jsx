import { PageHeader } from '../../components/common/PageHeader';
import { MasterManager } from '../../components/forms/MasterManager';

const FIELDS = [
  { name: 'name', label: 'Name', required: true, hint: 'e.g. GST 18%' },
  {
    name: 'rate',
    label: 'GST rate (%)',
    type: 'number',
    required: true,
    lockedOnEdit: true,
    parse: Number,
  },
];

const COLUMNS = [
  { header: 'Name', cell: (g) => <span className="font-medium">{g.name}</span> },
  { header: 'GST', align: 'right', cell: (g) => `${g.rate}%` },
  { header: 'CGST', align: 'right', cell: (g) => `${g.cgstRate}%` },
  { header: 'SGST', align: 'right', cell: (g) => `${g.sgstRate}%` },
  { header: 'IGST', align: 'right', cell: (g) => `${g.igstRate}%` },
];

export function GstMasterPage() {
  return (
    <div>
      <PageHeader
        title="GST Master"
        subtitle="Intra-state sales use CGST + SGST; inter-state sales use IGST. Confirm tax treatment with your accountant."
      />
      <MasterManager
        name="gstRates"
        entity="GST rate"
        fields={FIELDS}
        columns={COLUMNS}
        renderCard={(g) => (
          <>
            <p className="font-medium">{g.name}</p>
            <p className="text-sm text-slate-500">
              CGST {g.cgstRate}% + SGST {g.sgstRate}% · IGST {g.igstRate}%
            </p>
          </>
        )}
      />
    </div>
  );
}
