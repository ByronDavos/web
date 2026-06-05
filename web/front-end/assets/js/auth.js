import { API, setToken } from './api.js';

async function doLogin(formId, redirectUrl){
const form = document.getElementById(formId);
form?.addEventListener('submit', async (e) => {
e.preventDefault();
const email = form.querySelector('input[name=email]').value;
const password = form.querySelector('input[name=password]').value;
try {
const { token, user } = await API.login(email, password);
setToken(token);
// redirect ανά ρόλο
if (user.role === 'faculty') location.href = '/didaskon/didaskon-dashboard.html';
else if (user.role === 'student') location.href = '/foititis/foititis-dashboard.html';
else location.href = '/grammateia/grammateia-dashboard.html';
} catch (err) {
alert(err.message);
}
});
}

// Kάλεσέ το σε κάθε login page με το id της φόρμας
window.initLogin = doLogin;