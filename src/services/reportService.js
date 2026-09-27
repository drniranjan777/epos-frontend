import { api, request } from './apiClient';

export const dashboardService = {
  summary: () => request(api.get('/dashboard/summary')),
  movement: (range) => request(api.get('/dashboard/movement', { params: { range } })),
};

export const reportService = {
  stockValuation: (params) => request(api.get('/reports/stock-valuation', { params })),
  movement: (params) => request(api.get('/reports/movement', { params })),
};

export const auditService = {
  list: (params) => request(api.get('/audit-logs', { params })),
};
