/**
 * api.js — Cortex OS REST Gateway
 * Thin fetch wrapper that auto-injects JWT auth headers from localStorage.
 */

const BASE_URL = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : 'http://localhost:5000/api';

/** Build headers, injecting the stored JWT when available. */
const authHeaders = (extra = {}) => {
  const raw = localStorage.getItem('healos_user');
  const user = raw ? JSON.parse(raw) : null;
  return {
    'Content-Type': 'application/json',
    ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
    ...extra,
  };
};

/** Generic response handler — throws on non-2xx. */
const handle = async (res) => {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('healos_user');
      window.location.reload();
    }
    throw new Error(body.error || body.message || res.statusText);
  }
  return body;
};

export const api = {
  /** GET request */
  get: (endpoint) =>
    fetch(`${BASE_URL}${endpoint}`, { headers: authHeaders() }).then(handle),

  /** POST JSON body */
  post: (endpoint, payload) =>
    fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).then(handle),

  /** POST multipart/form-data (file upload — no Content-Type header so browser sets boundary) */
  upload: (endpoint, formData) => {
    const raw = localStorage.getItem('healos_user');
    const user = raw ? JSON.parse(raw) : null;
    return fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      body: formData,
    }).then(handle);
  },
};
