import { PERMISSIONS as P } from '../../constants/permissions';

/** Permissions that make Ask Stock useful; the server checks each answer again. */
export const ASK_STOCK_PERMISSIONS = [
  P.PRODUCTS_VIEW,
  P.INVENTORY_VIEW,
  P.DASHBOARD_VIEW,
  P.CUSTOMERS_VIEW,
  P.INVOICE_VIEW,
];
