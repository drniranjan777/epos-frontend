import { describe, expect, it } from 'vitest';
import { bottomNavItems, visibleSections } from './navigation';
import { PERMISSIONS as P } from './permissions';

const canAnyOf =
  (granted) =>
  (...codes) =>
    codes.some((code) => granted.includes(code));

// Default role permissions (see backend/src/constants/permissions.js).
const WAREHOUSE = [
  P.DASHBOARD_VIEW,
  P.PRODUCTS_VIEW,
  P.INVENTORY_VIEW,
  P.INVENTORY_IN,
  P.INVENTORY_OUT,
  P.TRANSFER_REQUEST,
  P.TRANSFER_RECEIVE,
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
  it('hides administration and invoices from warehouse users', () => {
    const sections = visibleSections(canAnyOf(WAREHOUSE));
    expect(sections.map((s) => s.title)).toEqual(['Operations']);
    const labels = sections[0].items.map((i) => i.label);
    expect(labels).toEqual(expect.arrayContaining(['Stock OUT', 'Stock IN', 'Stock Transfers']));
    expect(labels).not.toContain('Invoices');
  });

  it('puts Stock OUT, Stock IN and transfers in the warehouse bottom bar', () => {
    const items = bottomNavItems(canAnyOf(WAREHOUSE));
    expect(items.map((i) => i.to)).toEqual(['/', '/stock/out', '/stock/in', '/transfers']);
  });

  it('gives salesmen invoices in the bottom bar and caps it at four items', () => {
    const items = bottomNavItems(canAnyOf(SALESMAN));
    expect(items).toHaveLength(4);
    expect(items.map((i) => i.to)).toEqual(['/', '/stock/out', '/invoices', '/products']);
  });

  it('shows branch administration only with branches.manage', () => {
    const labels = (granted) =>
      visibleSections(canAnyOf(granted)).flatMap((s) => s.items.map((i) => i.label));
    expect(labels([P.BRANCHES_MANAGE])).toContain('Branches');
    expect(labels(WAREHOUSE)).not.toContain('Branches');
  });

  it('shows nothing for a user without permissions', () => {
    expect(visibleSections(canAnyOf([]))).toEqual([]);
  });
});
