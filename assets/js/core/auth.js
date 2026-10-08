// Session state. The token lives in localStorage (Workers have no cookie
// session here); XSS is prevented at the rendering layer (dom.js).

import { api, getToken, setToken } from './api.js';
import { createStore } from './store.js';

/** @typedef {{ id: string, email: string, name: string, phone: string, address: string, gender: string, dob: string, role: 'admin'|'customer' }} User */

/** @type {import('./store.js').createStore<User|null>} */
export const session = createStore(/** @type {User|null} */(null), { persist: 'mohor:user' });

let ready = null;
/** Validates the stored token once per page load. */
export function initAuth() {
  if (ready) return ready;
  if (!getToken()) { session.set(null); ready = Promise.resolve(null); return ready; }
  ready = api.get('/api/auth/me')
    .then(({ user }) => { session.set(user); return user; })
    .catch(error => {
      // Only a real 401 signs the user out — being offline keeps the cached session.
      if (error.status === 401) { session.set(null); return null; }
      return session.get();
    });
  return ready;
}

window.addEventListener('mohor:signed-out', () => session.set(null));

export const currentUser = () => session.get();
export const isSignedIn = () => Boolean(getToken() && session.get());

async function complete({ token, user }) {
  setToken(token);
  session.set(user);
  ready = Promise.resolve(user);
  window.dispatchEvent(new CustomEvent('mohor:signed-in', { detail: user }));
  return user;
}

export const login = (email, password) => api.post('/api/auth/login', { email, password }).then(complete);
export const register = data => api.post('/api/auth/register', data).then(complete);

export function logout() {
  setToken('');
  session.set(null);
  ready = Promise.resolve(null);
  window.dispatchEvent(new CustomEvent('mohor:signed-out', { detail: { reason: 'logout' } }));
}

export async function updateProfile(data) {
  const { user } = await api.put('/api/auth/me', data);
  session.set(user);
  return user;
}

export async function changePassword(currentPassword, newPassword) {
  const { token } = await api.post('/api/auth/change-password', { currentPassword, newPassword });
  if (token) setToken(token);
}

export async function logoutEverywhere() {
  await api.post('/api/auth/logout-all', {});
  logout();
}

export async function deleteAccount(password) {
  await api.del('/api/auth/delete-account', { password });
  logout();
}

/** Redirects to /login (returning here afterwards) when signed out. */
export async function requireSignIn() {
  const user = await initAuth();
  if (!user) {
    location.replace(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
    return new Promise(() => {});
  }
  return user;
}
