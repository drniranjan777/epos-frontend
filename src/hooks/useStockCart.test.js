import { describe, expect, it } from 'vitest';
import { cartReducer, cartTotals, lineError } from './useStockCart';

const filter = {
  id: 1,
  name: 'Hydraulic Filter',
  sku: 'JCB-HF-001',
  unitCode: 'PCS',
  stockQuantity: 2,
};
const oil = {
  id: 11,
  name: 'Hydraulic Oil 68',
  sku: 'GEN-HO-011',
  unitCode: 'LTR',
  unitAllowDecimal: true,
  stockQuantity: 420,
};

describe('stock cart', () => {
  it('adds parts and bumps the quantity when the same part is added again', () => {
    let lines = cartReducer([], { type: 'add', product: filter });
    lines = cartReducer(lines, { type: 'add', product: oil });
    lines = cartReducer(lines, { type: 'add', product: filter });
    expect(lines.map((l) => [l.productId, l.quantity])).toEqual([
      [1, '2'],
      [11, '1'],
    ]);
  });

  it('updates and removes lines', () => {
    let lines = cartReducer([], { type: 'add', product: oil });
    lines = cartReducer(lines, { type: 'quantity', productId: 11, quantity: '2.5' });
    expect(lines[0].quantity).toBe('2.5');
    expect(cartReducer(lines, { type: 'remove', productId: 11 })).toEqual([]);
  });

  it('totals parts and units', () => {
    const lines = [{ quantity: '2' }, { quantity: '2.5' }, { quantity: '' }];
    expect(cartTotals(lines)).toEqual({ parts: 3, units: 4.5 });
  });

  it('validates quantities against unit and stock', () => {
    const [line] = cartReducer([], { type: 'add', product: filter });
    expect(lineError({ ...line, quantity: '' }, true)).toBe('Enter a quantity');
    expect(lineError({ ...line, quantity: '1.5' }, true)).toBe('Whole PCS only');
    expect(lineError({ ...line, quantity: '3' }, true)).toBe('Only 2 available');
    // Stock IN is not limited by current stock.
    expect(lineError({ ...line, quantity: '3' }, false)).toBeNull();
  });
});
