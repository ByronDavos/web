// front-end/assets/js/common.js
import { clearToken } from './api.js';

// Διαβάζει στοιχεία χρήστη από το JWT (payload)
// Διαβάζει στοιχεία χρήστη από το JWT (payload) με υποστήριξη base64url
export function getCurrentUser() {
  const token = localStorage.getItem('jwt');
  if (!token) return null;
  try {
    let b64 = token.split('.')[1];                // payload
    // base64url -> base64
    b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';            // padding
    const json = atob(b64);
    const p = JSON.parse(json);
    const { id, role, first_name, last_name, email } = p || {};
    if (!id || !role) return null;
    return { id, role, first_name, last_name, email };
  } catch {
    return null;
  }
}


// Βρες βάση του front-end (παίζει και με /web/front-end)
function getFrontBase() {
  const p = location.pathname;
  if (p.includes('/web/front-end/')) return '/web/front-end';
  if (p.includes('/front-end/')) return '/front-end';
  return '';
}

// Redirect σε σωστό login ανά ρόλο
function redirectToLogin(allowedRoles) {
  const base = getFrontBase();
  if (Array.isArray(allowedRoles) && allowedRoles.length === 1) {
    const r = allowedRoles[0];
    if (r === 'student')     return location.href = `${base}/foititis/login-foititis.html`;
    if (r === 'faculty')     return location.href = `${base}/didaskon/login-didaskon.html`;
    if (r === 'secretariat') return location.href = `${base}/grammateia/login-grammateia.html`;
  }
  location.href = `${base}/index.html`;
}

// Guard για προστατευμένες σελίδες
export function requireAuth(allowedRoles = null) {
  const u = getCurrentUser();
  if (!u) { redirectToLogin(allowedRoles); return null; }
  if (Array.isArray(allowedRoles) && !allowedRoles.includes(u.role)) {
    const base = getFrontBase();
    const dash =
      u.role === 'student'     ? `${base}/foititis/foititis-dashboard.html` :
      u.role === 'faculty'     ? `${base}/didaskon/didaskon-dashboard.html` :
      u.role === 'secretariat' ? `${base}/grammateia/grammateia-dashboard.html` :
                                  `${base}/index.html`;
    location.href = dash; return null;
  }
  return u;
}

// Greeting και placeholders
export function setGreeting(selector = '#greet') {
  const el = document.querySelector(selector); if (!el) return;
  const u = getCurrentUser(); const fn = (u?.first_name || '').trim();
  el.textContent = fn ? `Καλωσορίσατε, ${fn}!` : 'Καλωσορίσατε!';
}
export function populateUserPlaceholders() {
  const u = getCurrentUser(); if (!u) return;
  document.querySelectorAll('[data-user-fullname]')
    .forEach(el => el.textContent = `${u.first_name||''} ${u.last_name||''}`.trim());
  document.querySelectorAll('[data-user-firstname]')
    .forEach(el => el.textContent = u.first_name || '');
  document.querySelectorAll('[data-user-email]')
    .forEach(el => el.textContent = u.email || '');
}

// Logout
export function logout() {
  clearToken();
  const base = getFrontBase();
  location.href = `${base}/index.html`;
}
window.logout = logout;

