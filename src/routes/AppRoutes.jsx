import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { PERMISSIONS as P } from '../constants/permissions';
import { AppLayout } from '../layouts/AppLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { NotFoundPage } from '../pages/errors/NotFoundPage';
import { RouteErrorPage } from '../pages/errors/RouteErrorPage';
import {
  GuestRoute,
  HomeRoute,
  LazyOutlet,
  ProtectedRoute,
  RequireBranch,
  RequirePermission,
} from './guards';

// Pages are code-split so phones only download what they open.
const page = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));

const DashboardPage = page(() => import('../pages/dashboard/DashboardPage'), 'DashboardPage');
const StockEntryPage = page(() => import('../pages/stock/StockEntryPage'), 'StockEntryPage');
const MovementListPage = page(() => import('../pages/stock/MovementListPage'), 'MovementListPage');
const MovementDetailPage = page(
  () => import('../pages/stock/MovementDetailPage'),
  'MovementDetailPage',
);
const TransferListPage = page(() => import('../pages/stock/TransferListPage'), 'TransferListPage');
const TransferRequestPage = page(
  () => import('../pages/stock/TransferRequestPage'),
  'TransferRequestPage',
);
const TransferDetailPage = page(
  () => import('../pages/stock/TransferDetailPage'),
  'TransferDetailPage',
);
const BranchesPage = page(() => import('../pages/settings/BranchesPage'), 'BranchesPage');
const StockLevelsPage = page(() => import('../pages/inventory/StockLevelsPage'), 'StockLevelsPage');
const LedgerPage = page(() => import('../pages/inventory/LedgerPage'), 'LedgerPage');
const ProductListPage = page(() => import('../pages/products/ProductListPage'), 'ProductListPage');
const ProductDetailPage = page(
  () => import('../pages/products/ProductDetailPage'),
  'ProductDetailPage',
);
const ProductFormPage = page(() => import('../pages/products/ProductFormPage'), 'ProductFormPage');
const CustomerListPage = page(
  () => import('../pages/customers/CustomerListPage'),
  'CustomerListPage',
);
const CustomerFormPage = page(
  () => import('../pages/customers/CustomerFormPage'),
  'CustomerFormPage',
);
const InvoiceListPage = page(() => import('../pages/invoices/InvoiceListPage'), 'InvoiceListPage');
const InvoiceFormPage = page(() => import('../pages/invoices/InvoiceFormPage'), 'InvoiceFormPage');
const InvoiceDetailPage = page(
  () => import('../pages/invoices/InvoiceDetailPage'),
  'InvoiceDetailPage',
);
const ReportsPage = page(() => import('../pages/reports/ReportsPage'), 'ReportsPage');
const UsersPage = page(() => import('../pages/users/UsersPage'), 'UsersPage');
const MastersPage = page(() => import('../pages/settings/MastersPage'), 'MastersPage');
const GstMasterPage = page(() => import('../pages/settings/GstMasterPage'), 'GstMasterPage');
const CompanySettingsPage = page(
  () => import('../pages/settings/CompanySettingsPage'),
  'CompanySettingsPage',
);
const AuditLogPage = page(() => import('../pages/audit/AuditLogPage'), 'AuditLogPage');
const AccountPage = page(() => import('../pages/auth/AccountPage'), 'AccountPage');

/** Wraps a page element with a permission check. */
const guard = (anyOf, element) => <RequirePermission anyOf={anyOf}>{element}</RequirePermission>;

/** Pages showing branch stock also need a branch to work in. */
const branchGuard = (anyOf, element) => guard(anyOf, <RequireBranch>{element}</RequireBranch>);

const TRANSFER_ANY = [P.TRANSFER_REQUEST, P.TRANSFER_APPROVE, P.TRANSFER_RECEIVE];

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <GuestRoute />,
        children: [{ path: '/login', element: <LoginPage /> }],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                element: <LazyOutlet />,
                children: [
                  {
                    index: true,
                    element: (
                      <HomeRoute
                        dashboard={
                          <RequireBranch>
                            <DashboardPage />
                          </RequireBranch>
                        }
                      />
                    ),
                  },
                  { path: 'stock', element: <Navigate to="/stock/out" replace /> },
                  {
                    path: 'stock/out',
                    element: branchGuard([P.INVENTORY_OUT], <StockEntryPage mode="OUT" />),
                  },
                  {
                    path: 'stock/in',
                    element: branchGuard([P.INVENTORY_IN], <StockEntryPage mode="IN" />),
                  },
                  {
                    path: 'stock/entries',
                    element: branchGuard([P.INVENTORY_VIEW], <MovementListPage />),
                  },
                  {
                    path: 'stock/entries/:id',
                    element: branchGuard([P.INVENTORY_VIEW], <MovementDetailPage />),
                  },
                  { path: 'transfers', element: branchGuard(TRANSFER_ANY, <TransferListPage />) },
                  {
                    path: 'transfers/new',
                    element: branchGuard([P.TRANSFER_REQUEST], <TransferRequestPage />),
                  },
                  {
                    path: 'transfers/:id',
                    element: branchGuard(TRANSFER_ANY, <TransferDetailPage />),
                  },
                  {
                    path: 'settings/branches',
                    element: guard([P.BRANCHES_MANAGE], <BranchesPage />),
                  },
                  {
                    path: 'inventory',
                    element: branchGuard([P.INVENTORY_VIEW], <StockLevelsPage />),
                  },
                  {
                    path: 'inventory/ledger',
                    element: branchGuard([P.INVENTORY_VIEW], <LedgerPage />),
                  },
                  {
                    path: 'products',
                    element: branchGuard([P.PRODUCTS_VIEW], <ProductListPage />),
                  },
                  {
                    path: 'products/new',
                    element: branchGuard([P.PRODUCTS_CREATE], <ProductFormPage />),
                  },
                  {
                    path: 'products/:id',
                    element: branchGuard([P.PRODUCTS_VIEW], <ProductDetailPage />),
                  },
                  {
                    path: 'products/:id/edit',
                    element: branchGuard([P.PRODUCTS_UPDATE], <ProductFormPage />),
                  },
                  {
                    path: 'customers',
                    element: guard([P.CUSTOMERS_VIEW, P.CUSTOMERS_MANAGE], <CustomerListPage />),
                  },
                  {
                    path: 'customers/new',
                    element: guard([P.CUSTOMERS_MANAGE], <CustomerFormPage />),
                  },
                  {
                    path: 'customers/:id/edit',
                    element: guard([P.CUSTOMERS_MANAGE], <CustomerFormPage />),
                  },
                  { path: 'invoices', element: branchGuard([P.INVOICE_VIEW], <InvoiceListPage />) },
                  {
                    path: 'invoices/new',
                    element: branchGuard([P.INVOICE_CREATE], <InvoiceFormPage />),
                  },
                  {
                    path: 'invoices/:id',
                    element: branchGuard([P.INVOICE_VIEW], <InvoiceDetailPage />),
                  },
                  {
                    path: 'invoices/:id/edit',
                    element: branchGuard([P.INVOICE_UPDATE], <InvoiceFormPage />),
                  },
                  { path: 'reports', element: branchGuard([P.REPORTS_VIEW], <ReportsPage />) },
                  {
                    path: 'users',
                    element: guard([P.USERS_MANAGE, P.ROLES_MANAGE], <UsersPage />),
                  },
                  { path: 'settings/masters', element: guard([P.MASTERS_MANAGE], <MastersPage />) },
                  { path: 'settings/gst', element: guard([P.GST_MANAGE], <GstMasterPage />) },
                  {
                    path: 'settings/company',
                    element: guard([P.SETTINGS_MANAGE], <CompanySettingsPage />),
                  },
                  { path: 'audit', element: guard([P.AUDIT_VIEW], <AuditLogPage />) },
                  { path: 'account', element: <AccountPage /> },
                  { path: '*', element: <NotFoundPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
