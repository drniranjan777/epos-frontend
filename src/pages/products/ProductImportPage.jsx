import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Download, FileSpreadsheet, TriangleAlert, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { PageHeader } from '../../components/common/PageHeader';
import { Spinner } from '../../components/common/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { productService } from '../../services/productService';
import { getErrorCode, getErrorMessage } from '../../utils/apiError';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/format';
import {
  IMPORT_SHEET,
  MAX_IMPORT_ROWS,
  importColumnLabel,
  pickImportSheet,
  rowsFromSheet,
} from '../../utils/stockImport';

const TEMPLATE_URL = '/Stock_Import_Template.xlsx';
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const SHOWN_PROBLEMS = 200;

/** Reads the workbook in the browser; the Excel library is only downloaded when needed. */
async function readRows(file) {
  if (!/\.xlsx$/i.test(file.name)) {
    throw new Error('Choose an Excel file saved as .xlsx (not .xls or .csv).');
  }
  if (file.size > MAX_FILE_BYTES) throw new Error('The file is larger than 10 MB.');

  const { default: readExcelFile } = await import('read-excel-file/browser');
  let sheets;
  try {
    sheets = await readExcelFile(file);
  } catch {
    throw new Error('This file could not be read. Save it again as .xlsx from Excel and retry.');
  }
  const sheet = pickImportSheet(sheets);
  if (!sheet) {
    throw new Error(`No “${IMPORT_SHEET}” sheet found. Use the template and keep its sheet names.`);
  }
  const { rows, missingColumns } = rowsFromSheet(sheet.data);
  if (missingColumns.length) {
    throw new Error(
      `Missing column${missingColumns.length > 1 ? 's' : ''}: ${missingColumns.join(', ')}. Use the template’s headings.`,
    );
  }
  if (!rows.length) throw new Error('The sheet has no parts. Enter them from row 2.');
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new Error(
      `The sheet has ${formatNumber(rows.length)} rows; a file can hold up to ${formatNumber(MAX_IMPORT_ROWS)}. Split it into smaller files.`,
    );
  }
  return rows;
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={cn(
          'text-xl font-bold tabular-nums',
          tone === 'danger' && value > 0 ? 'text-red-600' : 'text-slate-900',
        )}
      >
        {formatNumber(value)}
      </p>
    </div>
  );
}

function ProblemTable({ problems }) {
  return (
    <div className="overflow-x-auto rounded-lg ring-1 ring-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">
              Excel row
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              SKU
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Column
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Problem
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {problems.slice(0, SHOWN_PROBLEMS).map((p, index) => (
            <tr key={index}>
              <td className="px-3 py-2 font-semibold tabular-nums">{p.row}</td>
              <td className="px-3 py-2 whitespace-nowrap text-slate-600">{p.sku || '—'}</td>
              <td className="px-3 py-2 whitespace-nowrap">{importColumnLabel(p.field)}</td>
              <td className="px-3 py-2 text-red-700">{p.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {problems.length > SHOWN_PROBLEMS && (
        <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
          Showing the first {SHOWN_PROBLEMS} of {formatNumber(problems.length)} problems.
        </p>
      )}
    </div>
  );
}

/**
 * Import parts and their opening stock from the Excel template. The file is checked first
 * and every problem is listed by Excel row; nothing is saved until the file is clean and
 * the user confirms.
 */
export function ProductImportPage() {
  const { branch } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState(null);
  const [check, setCheck] = useState(null);
  const [problem, setProblem] = useState(null);
  const [busy, setBusy] = useState(null); // 'checking' | 'importing'
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(null);
  const [dragging, setDragging] = useState(false);

  function reset() {
    setFile(null);
    setRows(null);
    setCheck(null);
    setProblem(null);
    setDone(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function choose(chosen) {
    if (!chosen || busy) return;
    reset();
    setFile(chosen);
    setBusy('checking');
    try {
      const read = await readRows(chosen);
      setRows(read);
      setCheck(await productService.importFromExcel(read, true));
    } catch (error) {
      setProblem(error.response ? getErrorMessage(error) : error.message);
    } finally {
      setBusy(null);
    }
  }

  async function runImport() {
    setBusy('importing');
    try {
      const result = await productService.importFromExcel(rows, false);
      setDone(result);
      // Parts, stock levels and the dashboard all changed.
      await queryClient.invalidateQueries();
      toast.success(`${formatNumber(result.partsToCreate)} parts imported`);
    } catch (error) {
      // Someone may have added a part since the check; show what the server found.
      if (getErrorCode(error) === 'IMPORT_INVALID') {
        setCheck((c) => ({ ...c, errors: error.response.data.error.details }));
      }
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(null);
      setConfirming(false);
    }
  }

  const errors = check?.errors ?? [];
  const canImport = check && !errors.length && check.partsToCreate > 0;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Import parts from Excel"
        subtitle="Add many parts with their opening stock in one go."
        backTo="/products"
      />

      {done ? (
        <Card className="p-6 text-center">
          <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden />
          <h2 className="mt-3 text-lg font-semibold text-slate-900">
            {formatNumber(done.partsToCreate)} parts imported
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {formatNumber(done.partsWithStock)} with opening stock
            {done.skipped.length > 0 &&
              ` · ${formatNumber(done.skipped.length)} skipped (already existed)`}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button to="/products">View products</Button>
            <Button variant="secondary" onClick={reset}>
              Import another file
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-900">1. Fill in the template</h2>
              <p className="mt-0.5 text-sm text-slate-600">
                One part per row on the “{IMPORT_SHEET}” sheet. Part Name, SKU and Unit are
                required; keep the column headings as they are.
              </p>
            </div>
            <a
              href={TEMPLATE_URL}
              download
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50"
            >
              <Download className="size-5" aria-hidden /> Download template
            </a>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold text-slate-900">2. Upload the filled file</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              The file is checked first. Nothing is saved until you confirm. Rows with a blank
              Branch go to <span className="font-semibold text-slate-900">{branch.name}</span>.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              id="stock-import-file"
              onChange={(e) => choose(e.target.files?.[0])}
            />
            <label
              htmlFor="stock-import-file"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                choose(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                'mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition',
                dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:bg-slate-50',
                busy && 'pointer-events-none opacity-60',
              )}
            >
              {busy === 'checking' ? (
                <Spinner />
              ) : file ? (
                <FileSpreadsheet className="size-8 text-emerald-600" aria-hidden />
              ) : (
                <Upload className="size-8 text-slate-400" aria-hidden />
              )}
              <span className="text-sm font-semibold text-slate-900">
                {busy === 'checking'
                  ? 'Checking the file…'
                  : file
                    ? file.name
                    : 'Choose an Excel file, or drop it here'}
              </span>
              <span className="text-xs text-slate-500">
                {file && !busy
                  ? 'Choose another file to replace it'
                  : `.xlsx, up to ${formatNumber(MAX_IMPORT_ROWS)} rows`}
              </span>
            </label>

            {problem && (
              <p
                role="alert"
                className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {problem}
              </p>
            )}
          </Card>

          {check && (
            <Card className="space-y-4 p-4">
              <h2 className="font-semibold text-slate-900">3. Check and import</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <Stat label="Rows read" value={check.totalRows} />
                <Stat label="New parts" value={check.partsToCreate} />
                <Stat label="With opening stock" value={check.partsWithStock} />
                <Stat label="Already exist" value={check.skipped.length} />
                <Stat label="Problems" value={errors.length} tone="danger" />
              </div>

              {(check.newCategories.length > 0 || check.newBrands.length > 0) && (
                <p className="text-sm text-slate-600">
                  Will be added:{' '}
                  {[
                    check.newCategories.length &&
                      `categories ${check.newCategories.map((n) => `“${n}”`).join(', ')}`,
                    check.newBrands.length &&
                      `brands ${check.newBrands.map((n) => `“${n}”`).join(', ')}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  . Check for spelling differences before importing.
                </p>
              )}

              {errors.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-red-700">
                    Fix these in Excel, save, and upload the file again. Nothing has been saved.
                  </p>
                  <ProblemTable problems={errors} />
                </div>
              )}

              {check.skipped.length > 0 && (
                <details className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <summary className="cursor-pointer font-medium text-slate-700">
                    {formatNumber(check.skipped.length)}{' '}
                    {check.skipped.length === 1 ? 'row' : 'rows'} will be skipped because the SKU
                    already exists
                  </summary>
                  <p className="mt-2 text-slate-600">
                    Existing parts are not changed. Use Stock IN or an adjustment to change their
                    stock.
                  </p>
                  <p className="mt-1 text-slate-600">
                    {check.skipped
                      .slice(0, 50)
                      .map((s) => `${s.sku} (row ${s.row})`)
                      .join(', ')}
                    {check.skipped.length > 50 && ' …'}
                  </p>
                </details>
              )}

              {!errors.length && check.partsToCreate === 0 && (
                <p className="text-sm text-slate-600">
                  There is nothing new to import: every SKU in this file already exists.
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <Button disabled={!canImport} onClick={() => setConfirming(true)}>
                  <Upload className="size-5" aria-hidden />
                  Import {canImport ? formatNumber(check.partsToCreate) : ''} parts
                </Button>
                <Button variant="secondary" onClick={reset}>
                  Start over
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        title="Import these parts?"
        confirmLabel="Import"
        loading={busy === 'importing'}
        onConfirm={runImport}
        onClose={() => setConfirming(false)}
      >
        {check && (
          <p className="text-slate-600">
            {formatNumber(check.partsToCreate)} new parts will be created,{' '}
            {formatNumber(check.partsWithStock)} of them with opening stock. Opening stock cannot be
            edited afterwards, only corrected with a stock adjustment.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
