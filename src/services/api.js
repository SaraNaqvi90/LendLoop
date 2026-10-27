const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1').replace(/\/$/, '');
let token = '';
export const setAccessToken = (value) => { token = value || ''; };
export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const send = () => fetch(`${BASE}${path}`, { method, credentials: 'include', headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  let response = await send();
  if (response.status === 401 && token && !path.startsWith('/auth/')) {
    const refresh = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
    const refreshed = await refresh.json().catch(() => ({}));
    if (refresh.ok && refreshed.data?.accessToken) { token = refreshed.data.accessToken; response = await send(); }
    else token = '';
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || `Request failed (${response.status})`);
  return payload.data;
}
