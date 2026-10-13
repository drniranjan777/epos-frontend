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
  ReceiptText,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react';
import { PERMISSIONS as P } from './permissions';

/**
 * Navigation, grouped the way the sidebar and the phone drawer show it. `anyOf` lists
 * permissions of which the user needs at least one. `mobilePriority` orders items for the
 * bottom bar (lower = earlier); items without it are only reachable from the drawer on phones.
 * `defaultOpen` sections start expanded; the others open when one of their pages is shown.
 */
export const NAV_SECTIONS = [
  {
    id: 'overview',
    title: 'Overview',
    defaultOpen: true,
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
      { to: '/reports', label: 'Reports', icon: BarChart3, anyOf: [P.REPORTS_VIEW] },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory',
    defaultOpen: true,
    items: [
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
        to: '/inventory',
        label: 'Stock Levels',
        icon: Boxes,
        anyOf: [P.INVENTORY_VIEW],
        end: true,
      },
      {
        to: '/stock/entries',
        label: 'Stock Entries',
        icon: ClipboardList,
        anyOf: [P.INVENTORY_VIEW],
      },
      {
        to: '/inventory/ledger',
        label: 'Inventory Ledger',
        shortLabel: 'Ledger',
        icon: History,
        anyOf: [P.INVENTORY_VIEW],
        mobilePriority: 7,
      },
    ],
  },
  {
    id: 'sales',
    title: 'Sales & Billing',
    defaultOpen: true,
    items: [
      {
        to: '/invoices',
        label: 'Invoices',
        icon: FileText,
        anyOf: [P.INVOICE_VIEW],
        mobilePriority: 4,
      },
      {
        to: '/billing-invoices',
        label: 'Billing Invoices',
        icon: ReceiptText,
        anyOf: [P.PURCHASE_VIEW],
      },
      {
        to: '/customers',
        label: 'Customers',
        icon: Users,
        anyOf: [P.CUSTOMERS_VIEW, P.CUSTOMERS_MANAGE],
      },
    ],
  },
  {
    id: 'master-data',
    title: 'Master Data',
    defaultOpen: true,
    items: [
      {
        to: '/products',
        label: 'Products',
        icon: Package,
        anyOf: [P.PRODUCTS_VIEW],
        mobilePriority: 6,
      },
      { to: '/settings/masters', label: 'Masters', icon: ListTree, anyOf: [P.MASTERS_MANAGE] },
      { to: '/settings/gst', label: 'GST Master', icon: Percent, anyOf: [P.GST_MANAGE] },
    ],
  },
  {
    id: 'administration',
    title: 'Administration',
    items: [
      {
        to: '/users',
        label: 'Users & Roles',
        icon: ShieldCheck,
        anyOf: [P.USERS_MANAGE, P.ROLES_MANAGE],
      },
      { to: '/settings/branches', label: 'Branches', icon: Store, anyOf: [P.BRANCHES_MANAGE] },
      {
        to: '/settings/company',
        label: 'Company Settings',
        icon: Building2,
        anyOf: [P.SETTINGS_MANAGE],
      },
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

/** True when `pathname` is the item's page or one beneath it (same rule as NavLink). */
export function isItemActive(item, pathname) {
  if (item.to === '/' || item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

/** Id of the section holding the page being shown, or null (e.g. the account page). */
export function activeSectionId(sections, pathname) {
  return sections.find((s) => s.items.some((item) => isItemActive(item, pathname)))?.id ?? null;
}
