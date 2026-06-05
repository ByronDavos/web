const API_BASE = (window.API_BASE)
  ? window.API_BASE
  : (location.hostname ? `http://${location.hostname}:3000` : 'http://localhost:3000');

let TOKEN = localStorage.getItem('jwt');

export function setToken(t){ TOKEN = t; localStorage.setItem('jwt', t); }
export function clearToken(){ TOKEN=null; localStorage.removeItem('jwt'); }

async function req(path, opts={}){
const headers = { 'Content-Type': 'application/json', ...(opts.headers||{}) };
if (TOKEN) headers['Authorization'] = 'Bearer ' + TOKEN;
const res = await fetch(API_BASE + path, { ...opts, headers });
if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
return res.status === 204 ? null : res.json();
}

export const API = {
login: (email, password) => req('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
topics: {
listMine: () => req('/api/topics'),
create: (data) => req('/api/topics', { method: 'POST', body: JSON.stringify(data) }),
update: (id, data) => req('/api/topics/' + id, { method: 'PUT', body: JSON.stringify(data) })
},
theses: {
assign: (topic_id, student_id) => req('/api/theses/assign', { method: 'POST', body: JSON.stringify({ topic_id, student_id }) }),
mine: () => req('/api/theses/mine'),
setStatus: (id, status, extra={}) => req(`/api/theses/${id}/status`, { method: 'POST', body: JSON.stringify({ status, ...extra }) }),
draft: (id, path) => req(`/api/theses/${id}/draft`, {
  method: 'POST',
  body: JSON.stringify({ path })
}),

},
invitations: {
create: (thesis_id, faculty_id) => req('/api/invitations', { method: 'POST', body: JSON.stringify({ thesis_id, faculty_id }) }),
mine: (status='pending') => req(`/api/invitations/mine${status ? `?status=${status}` : ''}`),
accept: (id) => req(`/api/invitations/${id}/accept`, { method: 'POST' }),
decline: (id) => req(`/api/invitations/${id}/decline`, { method: 'POST' })
},
notes: {
add: (thesis_id, text) => req('/api/notes', { method: 'POST', body: JSON.stringify({ thesis_id, text }) }),
mine: (thesis_id) => req(`/api/notes/${thesis_id}/mine`)
},
grades: {
enable: (thesis_id) => req(`/api/grades/${thesis_id}/enable`, { method: 'POST' }),
submit: (thesis_id, criteria) => req(`/api/grades/${thesis_id}/mine`, { method: 'POST', body: JSON.stringify({ criteria }) }),
get: (thesis_id) => req(`/api/grades/${thesis_id}`)
},
feed: {
announcements: (from, to, format='json') => fetch(`${API_BASE}/feed/announcements?from=${from||''}&to=${to||''}&format=${format}`)
.then(r => r.text())
},
files: {
  upload: async (formData) => {
    // ΣΚΟΠΙΜΑ δεν βάζουμε 'Content-Type' για να αφήσουμε το browser να θέσει το multipart boundary
    const headers = {};
    if (TOKEN) headers['Authorization'] = 'Bearer ' + TOKEN;
    const res = await fetch(API_BASE + '/api/files/upload', { method: 'POST', headers, body: formData });
    if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
    return res.json(); // -> { path }
  }
}
};


