// front-end/assets/js/role-login.js
import { API, setToken, clearToken } from './api.js';

function getUserFromToken() {
  const t = localStorage.getItem('jwt');
  if (!t) return null;
  try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; }
}

export function initRoleLogin({ formId, expectedRole, redirect }) {
  const form = document.getElementById(formId);
  const errorBox = document.getElementById('loginError');

  // αν ήδη έχω σωστό jwt, φύγε κατευθείαν
  const u = getUserFromToken();
  if (u && (!expectedRole || u.role === expectedRole)) {
    location.href = redirect; return;
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox && (errorBox.textContent = '');
    try {
      const email = form.querySelector('[name="email"]').value.trim();
      const password = form.querySelector('[name="password"]').value;
      const { token, user } = await API.login(email, password);

      if (expectedRole && user.role !== expectedRole) {
        clearToken();
        throw new Error(`Αυτός ο λογαριασμός είναι ρόλου "${user.role}". Χρησιμοποίησε τη σωστή σελίδα σύνδεσης.`);
      }
      setToken(token);
      location.href = redirect;
    } catch (err) {
      const msg = err?.message || 'Λάθος στοιχεία σύνδεσης';
      if (errorBox) errorBox.textContent = msg; else alert(msg);
    }
  });
}

// helper για logout από οπουδήποτε
window.logout = () => { clearToken(); location.href = '/index.html'; };