import { api, request } from './apiClient';

export const userService = {
  list: (params) => request(api.get('/users', { params })),
  create: (data) => request(api.post('/users', data)),
  update: (id, data) => request(api.patch(`/users/${id}`, data)),
};

export const roleService = {
  list: () => request(api.get('/roles')),
  permissions: () => request(api.get('/roles/permissions')),
  create: (data) => request(api.post('/roles', data)),
  update: (id, data) => request(api.put(`/roles/${id}`, data)),
  remove: (id) => request(api.delete(`/roles/${id}`)),
};
