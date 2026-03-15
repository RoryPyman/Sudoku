import api from './client.js';

export const dailyApi = {
  getToday: () =>
    api.get('/daily').then(r => r.data),

  submit: (payload) =>
    api.post('/daily/submit', payload).then(r => r.data),

  leaderboardGlobal: (date, page = 1) =>
    api.get('/daily/leaderboard/global', { params: { date, page } }).then(r => r.data),

  leaderboardFriends: (date) =>
    api.get('/daily/leaderboard/friends', { params: { date } }).then(r => r.data),

  myRank: (date) =>
    api.get('/daily/leaderboard/me', { params: { date } }).then(r => r.data),

  shareScore: (toUserId, date) =>
    api.post('/daily/share', { toUserId, date }).then(r => r.data),
};
