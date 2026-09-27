import { api, request } from './apiClient';

export const settingsService = {
  get: () => request(api.get('/settings/company')),
  update: (data) => request(api.put('/settings/company', data)),
  uploadLogo: (file) => {
    const form = new FormData();
    form.append('logo', file);
    return request(
      api.post('/settings/company/logo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },
  removeLogo: () => request(api.delete('/settings/company/logo')),
  states: () => request(api.get('/settings/states')),
};
