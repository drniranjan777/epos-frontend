import { describe, expect, it } from 'vitest';
import { bottomNavItems, visibleSections } from './navigation';
import { PERMISSIONS as P } from './permissions';

const canAnyOf =
  (granted) =>
  (...codes) =>
    codes.some((code) => granted.includes(code));

const WAREHOUSE = [
  P.DASHBOARD_VIEW,
  P.PRODUCTS_VIEW,
  P.INVENTORY_VIEW,
  P.INVENTORY_IN,
  P.INVENTORY_OUT,
];
const SALESMAN = [
  P.DASHBOARD_VIEW,
  P.PRODUCTS_VIEW,
  P.INVENTORY_VIEW,
  P.INVENTORY_OUT,
  P.CUSTOMERS_VIEW,
  P.INVOICE_VIEW,
  P.INVOICE_CREATE,
];

describe('navigation by permission', () => {
  it('hides administration from warehouse users', () => {
    const sections = visibleSections(canAnyOf(WAREHOUSE));
    expect(sections.map((s) => s.title)).toEqual(['Operations']);
    const labels = sections[0].items.map((i) => i.label);
    expect(labels).toContain('Stock IN / OUT');
    expect(labels).not.toContain('Invoices');
  });

  it('puts search-first stock handling in the bottom bar', () => {
    const items = bottomNavItems(canAnyOf(WAREHOUSE));
    expect(items.map((i) => i.to)).toEqual(['/', '/stock', '/products', '/inventory/ledger']);
  });

  it('gives salesmen invoices in the bottom bar and caps it at four items', () => {
    const items = bottomNavItems(canAnyOf(SALESMAN));
    expect(items).toHaveLength(4);
    expect(items.map((i) => i.to)).toEqual(['/', '/stock', '/invoices', '/products']);
  });

  it('shows nothing for a user without permissions', () => {
    expect(visibleSections(canAnyOf([]))).toEqual([]);
  });
});
