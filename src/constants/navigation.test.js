import { describe, expect, it } from 'vitest';
import {
  NAV_SECTIONS,
  activeSectionId,
  bottomNavItems,
  isItemActive,
  visibleSections,
} from './navigation';
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
    expect(sections.map((s) => s.title)).toEqual(['Overview', 'Inventory', 'Master Data']);
    const labels = sections.flatMap((s) => s.items.map((i) => i.label));
    expect(labels).toEqual(expect.arrayContaining(['Stock OUT', 'Stock IN', 'Stock Transfers']));
    expect(labels).not.toContain('Invoices');
    expect(labels).not.toContain('Masters');
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

describe('navigation structure', () => {
  const items = NAV_SECTIONS.flatMap((s) => s.items);

  it('lists every page once, each behind a permission', () => {
    expect(items.map((i) => i.to).sort()).toEqual(
      [
        '/',
        '/reports',
        '/stock/out',
        '/stock/in',
        '/transfers',
        '/inventory',
        '/stock/entries',
        '/inventory/ledger',
        '/invoices',
        '/customers',
        '/products',
        '/settings/masters',
        '/settings/gst',
        '/users',
        '/settings/branches',
        '/settings/company',
        '/audit',
      ].sort(),
    );
    expect(items.every((i) => i.anyOf.length > 0 && i.icon && i.label)).toBe(true);
    expect(new Set(NAV_SECTIONS.map((s) => s.id)).size).toBe(NAV_SECTIONS.length);
  });

  it('finds the section of the page being shown', () => {
    const section = (pathname) => activeSectionId(NAV_SECTIONS, pathname);
    expect(section('/')).toBe('overview');
    expect(section('/products/import')).toBe('master-data');
    expect(section('/inventory')).toBe('inventory');
    expect(section('/inventory/ledger')).toBe('inventory');
    expect(section('/invoices/12')).toBe('sales');
    expect(section('/settings/company')).toBe('administration');
    expect(section('/account')).toBeNull();
  });

  it('does not light up Stock Levels on the ledger or Dashboard on other pages', () => {
    const byPath = (to) => items.find((i) => i.to === to);
    expect(isItemActive(byPath('/inventory'), '/inventory/ledger')).toBe(false);
    expect(isItemActive(byPath('/inventory/ledger'), '/inventory/ledger')).toBe(true);
    expect(isItemActive(byPath('/'), '/products')).toBe(false);
    expect(isItemActive(byPath('/stock/in'), '/stock/internal')).toBe(false);
  });
});
