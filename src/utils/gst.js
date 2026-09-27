/**
 * Live invoice preview while editing. Mirrors backend/src/utils/gstCalculator.js;
 * the server always recalculates and its figures are the ones saved and printed.
 * Amounts are handled in integer paise to avoid floating point drift.
 */
const toPaise = (value) => Math.round(Number(value || 0) * 100);
const roundPaise = (value) => Math.round(value + Number.EPSILON);

export function supplyTypeFor(companyStateCode, placeOfSupplyStateCode) {
  if (!companyStateCode || !placeOfSupplyStateCode) return 'INTRA';
  return companyStateCode === placeOfSupplyStateCode ? 'INTRA' : 'INTER';
}

export function calculateLine({ quantity, rate, discountPercent, gstRate }, supplyType) {
  const gross = roundPaise(Number(quantity || 0) * toPaise(rate));
  const discount = roundPaise((gross * Number(discountPercent || 0)) / 100);
  const taxable = gross - discount;
  const rateValue = Number(gstRate || 0);
  const half = roundPaise((taxable * rateValue) / 2 / 100);
  const cgst = supplyType === 'INTRA' ? half : 0;
  const sgst = supplyType === 'INTRA' ? half : 0;
  const igst = supplyType === 'INTER' ? roundPaise((taxable * rateValue) / 100) : 0;
  return { gross, discount, taxable, cgst, sgst, igst, total: taxable + cgst + sgst + igst };
}

/** Returns rupee amounts for display. */
export function calculateTotals(items, supplyType) {
  const sum = { gross: 0, discount: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
  for (const item of items) {
    const line = calculateLine(item, supplyType);
    for (const key of Object.keys(sum)) sum[key] += line[key];
  }
  const exact = sum.taxable + sum.cgst + sum.sgst + sum.igst;
  const grand = Math.round(exact / 100) * 100;
  const rupees = (paise) => paise / 100;
  return {
    subtotal: rupees(sum.gross),
    totalDiscount: rupees(sum.discount),
    taxableAmount: rupees(sum.taxable),
    cgstAmount: rupees(sum.cgst),
    sgstAmount: rupees(sum.sgst),
    igstAmount: rupees(sum.igst),
    totalTax: rupees(sum.cgst + sum.sgst + sum.igst),
    roundOff: rupees(grand - exact),
    grandTotal: rupees(grand),
  };
}

export const lineTotal = (item, supplyType) => calculateLine(item, supplyType).total / 100;
