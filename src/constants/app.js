export const APP_NAME = import.meta.env.VITE_APP_NAME || 'JCB Parts Inventory';

export const TXN_TYPES = {
  OPENING: { label: 'Opening', direction: 'in' },
  IN: { label: 'Stock IN', direction: 'in' },
  OUT: { label: 'Stock OUT', direction: 'out' },
  ADJUSTMENT_IN: { label: 'Adjustment +', direction: 'in' },
  ADJUSTMENT_OUT: { label: 'Adjustment −', direction: 'out' },
  INVOICE_OUT: { label: 'Invoice', direction: 'out' },
  INVOICE_CANCEL: { label: 'Invoice cancelled', direction: 'in' },
};

export const INVOICE_STATUS = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  FINAL: { label: 'Final', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'danger' },
};

export const STOCK_STATUS_OPTIONS = [
  { value: '', label: 'All stock' },
  { value: 'available', label: 'In stock' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
];

export const PAGE_SIZE = 20;
