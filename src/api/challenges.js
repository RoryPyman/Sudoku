import api from './client.js';

export const challengesApi = {
  send:    (toUserId, difficulty) => api.post('/challenges/send', { toUserId, difficulty }).then(r => r.data),
  getAll:  ()                     => api.get('/challenges').then(r => r.data),
  get:     (id)                   => api.get(`/challenges/${id}`).then(r => r.data),
  accept:  (id)                   => api.post(`/challenges/${id}/accept`).then(r => r.data),
  decline: (id)                   => api.post(`/challenges/${id}/decline`).then(r => r.data),
  cancel:  (id)                   => api.delete(`/challenges/${id}`).then(r => r.data),
  submit:  (id, payload)          => api.post(`/challenges/${id}/submit`, payload).then(r => r.data),
  h2h:     (userId)               => api.get(`/challenges/h2h/${userId}`).then(r => r.data),
  nudge:   (id)                   => api.post(`/challenges/${id}/nudge`).then(r => r.data),
};
