import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate, formatQty, formatSignedQty } from './format';
import { stockStatus } from './stock';

describe('formatters', () => {
  it('formats rupees with Indian grouping', () => {
    expect(formatCurrency(125000.5)).toBe('₹1,25,000.50');
  });

  it('formats quantities with units and signs', () => {
    expect(formatQty(42, 'PCS')).toBe('42 PCS');
    expect(formatQty(2.25, 'LTR')).toBe('2.25 LTR');
    expect(formatSignedQty(50)).toBe('+50');
    expect(formatSignedQty(-5)).toBe('−5');
  });

  it('formats ISO dates without timezone shifts', () => {
    expect(formatDate('2026-09-27')).toBe('27 Sep 2026');
    expect(formatDate(null)).toBe('');
  });
});

describe('stockStatus', () => {
  it('classifies out, low and ok stock', () => {
    expect(stockStatus({ stockQuantity: 0, minStockLevel: 5 })).toBe('out');
    expect(stockStatus({ stockQuantity: 5, minStockLevel: 5 })).toBe('low');
    expect(stockStatus({ stockQuantity: 6, minStockLevel: 5 })).toBe('ok');
  });
});
