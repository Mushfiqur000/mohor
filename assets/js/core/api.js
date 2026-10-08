// Thin fetch wrapper for the /api Worker. Attaches the session token, turns
// error responses into ApiError, and signs the user out on a 401.

const TOKEN_KEY = 'mohor:token';

export class ApiError extends Error {
  /** @param {number} status @param {string} message @param {any} data */
  constructor(status, message, data) { super(message); this.status = status; this.data = data; }
}

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } };
export const setToken = token => {
  try { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
};

/**
 * @param {string} path
 * @param {{ method?: string, body?: any, auth?: boolean, signal?: AbortSignal, headers?: Record<string,string>, raw?: BodyInit }} [options]
 */
export async function api(path, { method = 'GET', body, signal, headers = {}, raw } = {}) {
  const token = getToken();
  const init = { method, signal, headers: { Accept: 'application/json', ...headers } };
  if (token) init.headers.Authorization = `Bearer ${token}`;
  if (raw !== undefined) init.body = raw;
  else if (body !== undefined) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(body); }

  let response;
  try { response = await fetch(path, init); } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, navigator.onLine ? 'Network error. Please try again.' : 'You appear to be offline.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && token) {
      setToken('');
      window.dispatchEvent(new CustomEvent('mohor:signed-out', { detail: { reason: 'expired' } }));
    }
    throw new ApiError(response.status, data.error || `Request failed (${response.status})`, data);
  }
  return data;
}

api.get = (path, options) => api(path, { ...options, method: 'GET' });
api.post = (path, body, options) => api(path, { ...options, method: 'POST', body });
api.put = (path, body, options) => api(path, { ...options, method: 'PUT', body });
api.del = (path, body, options) => api(path, { ...options, method: 'DELETE', body });

// v1 tokens never expired and can't be verified any more — drop them.
try { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); } catch { /* ignore */ }
