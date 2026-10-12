/**
 * Turns the "Stock Data" sheet of the import template into the rows the server expects.
 * Only reads and labels cells: every rule (required fields, units, prices…) is checked by
 * the server, which reports problems by Excel row.
 */

/** Template heading → field sent to the server. Headings are matched without case, spaces or "*". */
export const IMPORT_COLUMNS = [
  { header: 'Part Name', field: 'name', required: true },
  { header: 'SKU', field: 'sku', required: true },
  { header: 'Part Number', field: 'partNumber' },
  { header: 'Category', field: 'category' },
  { header: 'Brand', field: 'brand' },
  { header: 'Machine Model', field: 'machineModel' },
  { header: 'Unit', field: 'unit', required: true },
  { header: 'HSN Code', field: 'hsnCode' },
  { header: 'Purchase Price', field: 'purchasePrice' },
  { header: 'Selling Price', field: 'sellingPrice' },
  { header: 'MRP', field: 'mrp' },
  { header: 'GST %', field: 'gstRate' },
  { header: 'Min Stock Level', field: 'minStockLevel' },
  { header: 'Opening Stock', field: 'openingStock' },
  { header: 'Branch', field: 'branch' },
  { header: 'Description', field: 'description' },
];

export const IMPORT_SHEET = 'Stock Data';
export const MAX_IMPORT_ROWS = 5000;

const FIELD_LABELS = Object.fromEntries(IMPORT_COLUMNS.map((c) => [c.field, c.header]));

/** Column heading for a field name in a server error ("sellingPrice" → "Selling Price"). */
export const importColumnLabel = (field) => FIELD_LABELS[field] ?? field;

const normalise = (heading) =>
  String(heading ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9%]/g, '');

const HEADER_FIELDS = new Map(IMPORT_COLUMNS.map((c) => [normalise(c.header), c.field]));

function cellValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  // Dates, booleans and anything else are sent as text for the server to judge.
  const text = (value instanceof Date ? value.toISOString().slice(0, 10) : String(value)).trim();
  return text === '' ? null : text;
}

/** The sheet to read: the one named "Stock Data", else the first sheet with an SKU heading. */
export function pickImportSheet(sheets) {
  return (
    sheets.find((s) => normalise(s.sheet) === normalise(IMPORT_SHEET)) ??
    sheets.find((s) => (s.data[0] ?? []).some((h) => normalise(h) === 'sku')) ??
    null
  );
}

/**
 * @param {unknown[][]} data  sheet cells, first row = headings
 * @returns {{ rows: object[], missingColumns: string[], unknownColumns: string[] }}
 *   rows carry `rowNumber`, the row in Excel, so errors can point at it. Empty rows are left out.
 */
export function rowsFromSheet(data) {
  const [headings = [], ...body] = data;
  const fields = headings.map((h) => HEADER_FIELDS.get(normalise(h)) ?? null);
  const missingColumns = IMPORT_COLUMNS.filter((c) => c.required && !fields.includes(c.field)).map(
    (c) => c.header,
  );
  const unknownColumns = headings
    .filter((h, i) => !fields[i] && String(h ?? '').trim())
    .map((h) => String(h).trim());

  const rows = [];
  body.forEach((cells, index) => {
    const row = { rowNumber: index + 2 };
    let filled = false;
    fields.forEach((field, column) => {
      if (!field) return;
      const value = cellValue(cells[column]);
      if (value !== null) {
        row[field] = value;
        filled = true;
      }
    });
    if (filled) rows.push(row);
  });
  return { rows, missingColumns, unknownColumns };
}
