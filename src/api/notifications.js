import api from './client.js';

export const notificationsApi = {
  getAll: () =>
    api.get('/notifications').then(r => r.data),

  getUnseenCount: () =>
    api.get('/notifications/count').then(r => r.data),

  markSeen: (id) =>
    api.post(`/notifications/${id}/seen`).then(r => r.data),

  dismiss: (id) =>
    api.delete(`/notifications/${id}`).then(r => r.data),
};
