import { api, request } from './apiClient';

export const movementService = {
  list: (params) => request(api.get('/stock-movements', { params })),
  get: (id) => request(api.get(`/stock-movements/${id}`)),
  create: (data) => request(api.post('/stock-movements', data)),
};

export const transferService = {
  list: (params) => request(api.get('/transfers', { params })),
  get: (id) => request(api.get(`/transfers/${id}`)),
  request: (data) => request(api.post('/transfers', data)),
  approve: (id) => request(api.post(`/transfers/${id}/approve`)),
  reject: (id, reason) => request(api.post(`/transfers/${id}/reject`, { reason })),
  receive: (id) => request(api.post(`/transfers/${id}/receive`)),
  cancel: (id, reason) => request(api.post(`/transfers/${id}/cancel`, { reason })),
};

export const branchService = {
  list: (params) => request(api.get('/branches', { params })),
  create: (data) => request(api.post('/branches', data)),
  update: (id, data) => request(api.patch(`/branches/${id}`, data)),
};
