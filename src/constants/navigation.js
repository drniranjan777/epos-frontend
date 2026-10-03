import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  FileText,
  History,
  LayoutDashboard,
  ListTree,
  Package,
  Percent,
  ScrollText,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react';
import { PERMISSIONS as P } from './permissions';

/**
 * Navigation items. `anyOf` lists permissions of which the user needs at least one.
 * `mobilePriority` orders items for the bottom bar (lower = earlier); items without it
 * are only reachable from the drawer on phones.
 */
export const NAV_SECTIONS = [
  {
    title: 'Operations',
    items: [
      {
        to: '/',
        label: 'Dashboard',
        shortLabel: 'Home',
        icon: LayoutDashboard,
        anyOf: [P.DASHBOARD_VIEW],
        end: true,
        mobilePriority: 1,
      },
      {
        to: '/stock/out',
        label: 'Stock OUT',
        shortLabel: 'OUT',
        icon: ArrowUpFromLine,
        anyOf: [P.INVENTORY_OUT],
        mobilePriority: 2,
      },
      {
        to: '/stock/in',
        label: 'Stock IN',
        shortLabel: 'IN',
        icon: ArrowDownToLine,
        anyOf: [P.INVENTORY_IN],
        mobilePriority: 3,
      },
      {
        to: '/transfers',
        label: 'Stock Transfers',
        shortLabel: 'Transfers',
        icon: ArrowLeftRight,
        anyOf: [P.TRANSFER_REQUEST, P.TRANSFER_APPROVE, P.TRANSFER_RECEIVE],
        mobilePriority: 5,
      },
      {
        to: '/invoices',
        label: 'Invoices',
        icon: FileText,
        anyOf: [P.INVOICE_VIEW],
        mobilePriority: 4,
      },
      {
        to: '/products',
        label: 'Products',
        icon: Package,
        anyOf: [P.PRODUCTS_VIEW],
        mobilePriority: 6,
      },
      {
        to: '/inventory',
        label: 'Stock Levels',
        icon: Boxes,
        anyOf: [P.INVENTORY_VIEW],
        end: true,
      },
      {
        to: '/inventory/ledger',
        label: 'Inventory Ledger',
        shortLabel: 'Ledger',
        icon: History,
        anyOf: [P.INVENTORY_VIEW],
        mobilePriority: 7,
      },
      {
        to: '/stock/entries',
        label: 'Stock Entries',
        icon: ClipboardList,
        anyOf: [P.INVENTORY_VIEW],
      },
      {
        to: '/customers',
        label: 'Customers',
        icon: Users,
        anyOf: [P.CUSTOMERS_VIEW, P.CUSTOMERS_MANAGE],
      },
      { to: '/reports', label: 'Reports', icon: BarChart3, anyOf: [P.REPORTS_VIEW] },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        to: '/users',
        label: 'Users & Roles',
        icon: ShieldCheck,
        anyOf: [P.USERS_MANAGE, P.ROLES_MANAGE],
      },
      { to: '/settings/branches', label: 'Branches', icon: Store, anyOf: [P.BRANCHES_MANAGE] },
      { to: '/settings/masters', label: 'Masters', icon: ListTree, anyOf: [P.MASTERS_MANAGE] },
      { to: '/settings/gst', label: 'GST Master', icon: Percent, anyOf: [P.GST_MANAGE] },
      {
        to: '/settings/company',
        label: 'Company Settings',
        icon: Building2,
        anyOf: [P.SETTINGS_MANAGE],
      },
      { to: '/audit', label: 'Audit Logs', icon: ScrollText, anyOf: [P.AUDIT_VIEW] },
    ],
  },
];

export const MAX_BOTTOM_NAV_ITEMS = 4;

export function visibleSections(canAny) {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => canAny(...item.anyOf)),
  })).filter((section) => section.items.length > 0);
}

export function bottomNavItems(canAny) {
  return NAV_SECTIONS.flatMap((s) => s.items)
    .filter((item) => item.mobilePriority && canAny(...item.anyOf))
    .sort((a, b) => a.mobilePriority - b.mobilePriority)
    .slice(0, MAX_BOTTOM_NAV_ITEMS);
}
