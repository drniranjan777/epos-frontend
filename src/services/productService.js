import { api, request } from './apiClient';

export const productService = {
  list: (params) => request(api.get('/products', { params })),
  search: (q) => request(api.get('/products/search', { params: { q } })),
  get: (id) => request(api.get(`/products/${id}`)),
  create: (data) => request(api.post('/products', data)),
  update: (id, data) => request(api.patch(`/products/${id}`, data)),
  remove: (id) => request(api.delete(`/products/${id}`)),
  /** Rows of the Excel template; `dryRun` only checks them. Large files take a while to save. */
  importFromExcel: (rows, dryRun) =>
    request(api.post('/products/import', { rows, dryRun }, { timeout: 10 * 60_000 })),
};
