import { describe, expect, it } from 'vitest';
import { cartReducer, cartTotals, lineAmount, lineError, priceChange } from './useStockCart';

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

  it('adds a spoken quantity, and adds it on top when the part is already in the entry', () => {
    let lines = cartReducer([], { type: 'add', product: oil, quantity: 20 });
    expect(lines[0].quantity).toBe('20');
    lines = cartReducer(lines, { type: 'add', product: oil, quantity: 5 });
    expect(lines[0].quantity).toBe('25');
  });

  it('updates and removes lines', () => {
    let lines = cartReducer([], { type: 'add', product: oil });
    lines = cartReducer(lines, { type: 'quantity', productId: 11, quantity: '2.5' });
    expect(lines[0].quantity).toBe('2.5');
    expect(cartReducer(lines, { type: 'remove', productId: 11 })).toEqual([]);
  });

  it('totals parts and units', () => {
    const lines = [{ quantity: '2' }, { quantity: '2.5' }, { quantity: '' }];
    expect(cartTotals(lines)).toEqual({ parts: 3, units: 4.5, amount: 0 });
  });

  it('validates quantities against unit and stock', () => {
    const [line] = cartReducer([], { type: 'add', product: filter });
    expect(lineError({ ...line, quantity: '' }, true)).toBe('Enter a quantity');
    expect(lineError({ ...line, quantity: '1.5' }, true)).toBe('Whole PCS only');
    expect(lineError({ ...line, quantity: '3' }, true)).toBe('Only 2 available');
    // Stock IN is not limited by current stock.
    expect(lineError({ ...line, quantity: '3' }, false)).toBeNull();
  });

  it('keeps the current purchase price on Stock IN lines and tracks changes to it', () => {
    let lines = cartReducer([], { type: 'add', product: { ...filter, purchasePrice: 100 } });
    expect(lines[0]).toMatchObject({ previousPrice: 100, purchasePrice: '100' });
    expect(priceChange(lines[0])).toBe(0);

    lines = cartReducer(lines, { type: 'quantity', productId: 1, quantity: '50' });
    lines = cartReducer(lines, { type: 'price', productId: 1, price: '115' });
    expect(priceChange(lines[0])).toBe(15);
    expect(lineAmount(lines[0])).toBe(5750);
    expect(cartTotals(lines)).toEqual({ parts: 1, units: 50, amount: 5750 });

    lines = cartReducer(lines, { type: 'price', productId: 1, price: '89.5' });
    expect(priceChange(lines[0])).toBe(-10.5);
  });

  it('requires a price only on priced entries', () => {
    const [line] = cartReducer([], { type: 'add', product: { ...filter, purchasePrice: 100 } });
    expect(lineError({ ...line, purchasePrice: '' }, false, true)).toBe('Enter the purchase price');
    expect(lineError({ ...line, purchasePrice: '.' }, false, true)).toBe(
      'Enter the purchase price',
    );
    // Free supplies are allowed.
    expect(lineError({ ...line, purchasePrice: '0' }, false, true)).toBeNull();
    expect(lineError({ ...line, purchasePrice: '99.5' }, false, true)).toBeNull();
    // Users who cannot change prices get lines without one.
    const [plain] = cartReducer([], { type: 'add', product: filter });
    expect(plain).toMatchObject({ previousPrice: null, purchasePrice: '' });
    expect(lineError(plain, false, false)).toBeNull();
  });
});
