import api from './client.js';

export const feedApi = {
  get: (params = {}) => api.get('/feed', { params }).then(r => r.data),
};
