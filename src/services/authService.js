import { api, request } from './apiClient';

export const authService = {
  login: (credentials) => request(api.post('/auth/login', credentials)),
  logout: () => request(api.post('/auth/logout')),
  me: () => request(api.get('/auth/me')),
  changePassword: (data) => request(api.patch('/auth/change-password', data)),
};
