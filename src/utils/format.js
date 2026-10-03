const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 });
const compactFormatter = new Intl.NumberFormat('en-IN', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value ?? 0));
}

export function formatNumber(value) {
  return numberFormatter.format(Number(value ?? 0));
}

export function formatCompact(value) {
  return compactFormatter.format(Number(value ?? 0));
}

/** "42 PCS" */
export function formatQty(value, unit) {
  return unit ? `${formatNumber(value)} ${unit}` : formatNumber(value);
}

/** Signed quantity for ledger rows: "+50" / "−5". */
export function formatSignedQty(value) {
  const n = Number(value);
  return `${n > 0 ? '+' : n < 0 ? '−' : ''}${formatNumber(Math.abs(n))}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 'YYYY-MM-DD' -> '27 Sep 2026' without timezone conversion. */
export function formatDate(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = String(isoDate).slice(0, 10).split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Today's date as 'YYYY-MM-DD' in the browser's local timezone. */
export function todayIso() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/** "1 part · 5 units" style summary of a stock document. */
export function partsSummary(parts, units) {
  const unitCount = Number(units);
  return `${parts} ${parts === 1 ? 'part' : 'parts'} · ${formatNumber(unitCount)} ${unitCount === 1 ? 'unit' : 'units'}`;
}
