import api from './client.js';

export const gamesApi = {
  create: (payload) =>
    api.post('/games', payload).then(r => r.data),

  list: (params = {}) =>
    api.get('/games', { params }).then(r => r.data),

  get: (id) =>
    api.get(`/games/${id}`).then(r => r.data),
};
