import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import { PERMISSIONS as P } from '../constants/permissions';
import { AppLayout } from '../layouts/AppLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { NotFoundPage } from '../pages/errors/NotFoundPage';
import { RouteErrorPage } from '../pages/errors/RouteErrorPage';
import { GuestRoute, HomeRoute, LazyOutlet, ProtectedRoute, RequirePermission } from './guards';

// Pages are code-split so phones only download what they open.
const page = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));

const DashboardPage = page(() => import('../pages/dashboard/DashboardPage'), 'DashboardPage');
const StockSearchPage = page(() => import('../pages/inventory/StockSearchPage'), 'StockSearchPage');
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
                  { index: true, element: <HomeRoute dashboard={<DashboardPage />} /> },
                  {
                    path: 'stock',
                    element: guard([P.INVENTORY_IN, P.INVENTORY_OUT], <StockSearchPage />),
                  },
                  { path: 'inventory', element: guard([P.INVENTORY_VIEW], <StockLevelsPage />) },
                  { path: 'inventory/ledger', element: guard([P.INVENTORY_VIEW], <LedgerPage />) },
                  { path: 'products', element: guard([P.PRODUCTS_VIEW], <ProductListPage />) },
                  {
                    path: 'products/new',
                    element: guard([P.PRODUCTS_CREATE], <ProductFormPage />),
                  },
                  {
                    path: 'products/:id',
                    element: guard([P.PRODUCTS_VIEW], <ProductDetailPage />),
                  },
                  {
                    path: 'products/:id/edit',
                    element: guard([P.PRODUCTS_UPDATE], <ProductFormPage />),
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
                  { path: 'invoices', element: guard([P.INVOICE_VIEW], <InvoiceListPage />) },
                  { path: 'invoices/new', element: guard([P.INVOICE_CREATE], <InvoiceFormPage />) },
                  { path: 'invoices/:id', element: guard([P.INVOICE_VIEW], <InvoiceDetailPage />) },
                  {
                    path: 'invoices/:id/edit',
                    element: guard([P.INVOICE_UPDATE], <InvoiceFormPage />),
                  },
                  { path: 'reports', element: guard([P.REPORTS_VIEW], <ReportsPage />) },
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
