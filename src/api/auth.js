import api from './client.js';

export const authApi = {
  register: ({ firstName, lastName, username, email, password }) =>
    api.post('/auth/register', { firstName, lastName, username, email, password }).then(r => r.data),

  checkUsername: (username) =>
    api.get('/auth/check-username', { params: { username } }).then(r => r.data),

  login: (identifier, password) =>
    api.post('/auth/login', { identifier, password }).then(r => r.data),

  /** Uses bare axios internally (see client.js interceptor) */
  refresh: () =>
    api.post('/auth/refresh').then(r => r.data),

  logout: () =>
    api.post('/auth/logout').then(r => r.data),

  getMe: () =>
    api.get('/auth/me').then(r => r.data),
};
