import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Access tokens live only in memory. The refresh token is an httpOnly cookie the
 * browser sends to /auth/refresh, so a page reload restores the session safely.
 */
let accessToken = null;
let branchId = null;
let onSessionExpired = () => {};
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token;
}

/** Branch sent with every request (`X-Branch-Id`); the API scopes stock data to it. */
export function setBranchId(id) {
  branchId = id;
}

export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  if (branchId) config.headers['X-Branch-Id'] = String(branchId);
  return config;
});

/** One refresh request at a time, shared by every request that failed with 401. */
export function refreshSession() {
  refreshPromise ??= axios
    .post(`${baseURL}/auth/refresh`, null, { withCredentials: true })
    .then((res) => {
      setAccessToken(res.data.data.accessToken);
      return res.data.data;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/logout'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const isAuthCall = AUTH_ENDPOINTS.some((path) => config?.url?.endsWith(path));

    if (response?.status !== 401 || isAuthCall || config?._retried) {
      return Promise.reject(error);
    }

    try {
      await refreshSession();
      config._retried = true;
      return api(config);
    } catch {
      setAccessToken(null);
      onSessionExpired();
      return Promise.reject(error);
    }
  },
);

/** Unwraps `{ success, data, meta }` responses. */
export async function request(promise) {
  const res = await promise;
  return res.data.meta ? { items: res.data.data, meta: res.data.meta } : res.data.data;
}
