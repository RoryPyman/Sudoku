import api from './client.js';

export const statsApi = {
  summary: () => api.get('/stats/summary').then(r => r.data),
  records: () => api.get('/stats/records').then(r => r.data),
};
