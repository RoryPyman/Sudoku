import axios from 'axios';

// ── In-memory access token (never touches localStorage) ───────────────────
let _accessToken = null;
export const setAccessToken   = (t) => { _accessToken = t; };
export const clearAccessToken = ()  => { _accessToken = null; };

// ── Configured Axios instance ─────────────────────────────────────────────
const api = axios.create({
  baseURL:         '/api',
  withCredentials: true,   // send httpOnly refresh-token cookie automatically
});

// Attach access token to every outgoing request
api.interceptors.request.use(config => {
  if (_accessToken) config.headers.Authorization = `Bearer ${_accessToken}`;
  return config;
});

// ── Silent refresh on 401 ─────────────────────────────────────────────────
let isRefreshing = false;
let waitQueue    = [];   // { resolve, reject }[]

function processQueue(err, token = null) {
  waitQueue.forEach(({ resolve, reject }) => err ? reject(err) : resolve(token));
  waitQueue = [];
}

api.interceptors.response.use(
  res => res,
  async error => {
    const orig = error.config;

    // Only intercept 401s; never retry auth endpoints (avoids infinite loops)
    if (
      error.response?.status !== 401 ||
      orig._retry ||
      orig.url?.startsWith('/auth/')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => waitQueue.push({ resolve, reject }))
        .then(token => {
          orig.headers.Authorization = `Bearer ${token}`;
          return api(orig);
        });
    }

    orig._retry   = true;
    isRefreshing  = true;

    try {
      // Use bare axios (not `api`) so this call bypasses the response interceptor
      const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
      setAccessToken(data.accessToken);
      processQueue(null, data.accessToken);
      orig.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(orig);
    } catch (refreshErr) {
      clearAccessToken();
      processQueue(refreshErr);
      // Hard-redirect; React Router isn't accessible here
      window.location.href = '/login';
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
