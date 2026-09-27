import { api, request } from './apiClient';

export const inventoryService = {
  stock: (params) => request(api.get('/inventory', { params })),
  ledger: (params) => request(api.get('/inventory/ledger', { params })),
  stockIn: (data) => request(api.post('/inventory/stock-in', data)),
  stockOut: (data) => request(api.post('/inventory/stock-out', data)),
  adjust: (data) => request(api.post('/inventory/adjustments', data)),
};
