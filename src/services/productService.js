import { api, request } from './apiClient';

export const productService = {
  list: (params) => request(api.get('/products', { params })),
  search: (q) => request(api.get('/products/search', { params: { q } })),
  get: (id) => request(api.get(`/products/${id}`)),
  create: (data) => request(api.post('/products', data)),
  update: (id, data) => request(api.patch(`/products/${id}`, data)),
  remove: (id) => request(api.delete(`/products/${id}`)),
};
