import { api, request } from './apiClient';

/** CRUD client for the simple master endpoints (categories, brands, units, ...). */
function createMasterService(path) {
  return {
    list: (params) => request(api.get(path, { params })),
    create: (data) => request(api.post(path, data)),
    update: (id, data) => request(api.patch(`${path}/${id}`, data)),
    remove: (id) => request(api.delete(`${path}/${id}`)),
  };
}

export const masterServices = {
  categories: createMasterService('/categories'),
  brands: createMasterService('/brands'),
  units: createMasterService('/units'),
  gstRates: createMasterService('/gst-rates'),
  adjustmentCodes: createMasterService('/adjustment-codes'),
};
