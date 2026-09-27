import { describe, expect, it } from 'vitest';
import { calculateTotals, lineTotal, supplyTypeFor } from './gst';

// The same scenarios as backend/tests/unit/gstCalculator.test.js: the live preview
// must show exactly what the server will save.
describe('invoice preview maths', () => {
  it('matches the server for intra-state supply', () => {
    const totals = calculateTotals(
      [
        { quantity: 1, rate: 99.99, gstRate: 18 },
        { quantity: 3, rate: 245, gstRate: 5 },
      ],
      'INTRA',
    );
    expect(totals).toEqual({
      subtotal: 834.99,
      totalDiscount: 0,
      taxableAmount: 834.99,
      cgstAmount: 27.38,
      sgstAmount: 27.38,
      igstAmount: 0,
      totalTax: 54.76,
      roundOff: 0.25,
      grandTotal: 890,
    });
  });

  it('matches the server for inter-state supply with discount', () => {
    const totals = calculateTotals(
      [{ quantity: 1, rate: 800, discountPercent: 5, gstRate: 18 }],
      'INTER',
    );
    expect(totals).toMatchObject({
      taxableAmount: 760,
      igstAmount: 136.8,
      roundOff: 0.2,
      grandTotal: 897,
    });
  });

  it('rounds tax half-up per line like the server', () => {
    expect(lineTotal({ quantity: 2.25, rate: 195, gstRate: 18 }, 'INTRA')).toBe(517.73);
  });

  it('treats empty inputs as zero while the user is typing', () => {
    expect(lineTotal({ quantity: '', rate: '', discountPercent: '', gstRate: 18 }, 'INTRA')).toBe(
      0,
    );
  });

  it('decides intra/inter-state from state codes', () => {
    expect(supplyTypeFor('27', '27')).toBe('INTRA');
    expect(supplyTypeFor('27', '29')).toBe('INTER');
    expect(supplyTypeFor(null, '29')).toBe('INTRA');
  });
});
