import { api, request } from './apiClient';

/** Billing (purchase) invoices. They are created by Stock IN, never directly. */
export const purchaseInvoiceService = {
  list: (params) => request(api.get('/purchase-invoices', { params })),
  get: (id) => request(api.get(`/purchase-invoices/${id}`)),
  recordPayment: (id, paidAmount) =>
    request(api.patch(`/purchase-invoices/${id}/payment`, { paidAmount })),
};
