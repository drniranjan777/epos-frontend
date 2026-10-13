export const APP_NAME = import.meta.env.VITE_APP_NAME || 'JCB Parts Inventory';

/** Company branding. The logo has dark artwork, so always place it on a light surface. */
export const BRAND = Object.freeze({
  name: 'ES Enterprises',
  logo: '/logo.svg',
  icon: '/icon.svg',
});

export const TXN_TYPES = {
  OPENING: { label: 'Opening', direction: 'in' },
  IN: { label: 'Stock IN', direction: 'in' },
  OUT: { label: 'Stock OUT', direction: 'out' },
  ADJUSTMENT_IN: { label: 'Adjustment +', direction: 'in' },
  ADJUSTMENT_OUT: { label: 'Adjustment −', direction: 'out' },
  INVOICE_OUT: { label: 'Invoice', direction: 'out' },
  INVOICE_CANCEL: { label: 'Invoice cancelled', direction: 'in' },
  TRANSFER_OUT: { label: 'Transfer out', direction: 'out' },
  TRANSFER_IN: { label: 'Transfer in', direction: 'in' },
  TRANSFER_RETURN: { label: 'Transfer returned', direction: 'in' },
};

export const TRANSFER_STATUS = {
  REQUESTED: { label: 'Awaiting approval', tone: 'warning' },
  IN_TRANSIT: { label: 'In transit', tone: 'info' },
  RECEIVED: { label: 'Received', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
};

export const INVOICE_STATUS = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  FINAL: { label: 'Final', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'danger' },
};

export const PAYMENT_STATUS = {
  UNPAID: { label: 'Unpaid', tone: 'danger' },
  PARTIAL: { label: 'Part paid', tone: 'warning' },
  PAID: { label: 'Paid', tone: 'success' },
};

export const STOCK_STATUS_OPTIONS = [
  { value: '', label: 'All stock' },
  { value: 'available', label: 'In stock' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
];

export const PAGE_SIZE = 20;
