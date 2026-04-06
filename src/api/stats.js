import api from './client.js';

export const statsApi = {
  summary:   () => api.get('/stats/summary').then(r => r.data),
  records:   () => api.get('/stats/records').then(r => r.data),
  badges:    () => api.get('/stats/badges').then(r => r.data),
  allBadges: () => api.get('/stats/badges/all').then(r => r.data),
};
