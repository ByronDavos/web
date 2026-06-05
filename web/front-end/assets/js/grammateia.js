import { API } from './api.js';

function importUsers(){
const f = document.getElementById('importForm');
f?.addEventListener('submit', async (e)=>{
e.preventDefault();
const text = f.json.value.trim();
const users = JSON.parse(text);
const res = await fetch('http://localhost:3000/api/import/users', {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('jwt') },
body: JSON.stringify({ users })
});
const j = await res.json();
document.getElementById('importResult').textContent = `${j.inserted} χρήστες εισήχθησαν.`;
});
}

window.gramLoad = () => importUsers();