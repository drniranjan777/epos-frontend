import { api, request } from './apiClient';

export const invoiceService = {
  list: (params) => request(api.get('/invoices', { params })),
  get: (id) => request(api.get(`/invoices/${id}`)),
  create: (data) => request(api.post('/invoices', data)),
  update: (id, data) => request(api.put(`/invoices/${id}`, data)),
  finalize: (id) => request(api.post(`/invoices/${id}/finalize`)),
  cancel: (id, reason) => request(api.post(`/invoices/${id}/cancel`, { reason })),
  remove: (id) => request(api.delete(`/invoices/${id}`)),
  /** Fetches the PDF with the auth header and returns a Blob. */
  async pdf(id) {
    const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
    return res.data;
  },
};
