import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function forceLogout() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_refresh_token');
  localStorage.removeItem('admin_user');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

// Shared in-flight refresh so concurrent 401s trigger a single refresh call.
let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('admin_refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  // Bare axios (not `api`) so this request skips the interceptors below.
  const { data } = await axios.post(`${baseURL}/api/token/refresh`, {
    refresh_token: refreshToken,
  });
  localStorage.setItem('admin_token', data.token);
  if (data.refresh_token) {
    localStorage.setItem('admin_refresh_token', data.refresh_token);
  }
  return data.token;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (response?.status !== 401 || !config || config._retry) {
      if (response?.status === 401) {
        forceLogout();
      }
      return Promise.reject(error);
    }

    config._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;
      config.headers.Authorization = `Bearer ${newToken}`;
      return api(config);
    } catch {
      forceLogout();
      return Promise.reject(error);
    }
  }
);

export default api;
