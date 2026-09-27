import { api, request } from './apiClient';

export const customerService = {
  list: (params) => request(api.get('/customers', { params })),
  get: (id) => request(api.get(`/customers/${id}`)),
  create: (data) => request(api.post('/customers', data)),
  update: (id, data) => request(api.patch(`/customers/${id}`, data)),
  remove: (id) => request(api.delete(`/customers/${id}`)),
};
