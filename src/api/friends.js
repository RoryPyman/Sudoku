import api from './client.js';

export const friendsApi = {
  list: () =>
    api.get('/friends').then(r => r.data),

  requests: () =>
    api.get('/friends/requests').then(r => r.data),

  search: (q) =>
    api.get('/friends/search', { params: { q } }).then(r => r.data),

  sendRequest: (userId) =>
    api.post(`/friends/request/${userId}`).then(r => r.data),

  acceptRequest: (userId) =>
    api.post(`/friends/accept/${userId}`).then(r => r.data),

  declineRequest: (userId) =>
    api.post(`/friends/decline/${userId}`).then(r => r.data),

  removeFriend: (userId) =>
    api.delete(`/friends/remove/${userId}`).then(r => r.data),

  cancelRequest: (userId) =>
    api.delete(`/friends/cancel/${userId}`).then(r => r.data),

  getProfile: (username) =>
    api.get(`/users/${username}/profile`).then(r => r.data),
};
