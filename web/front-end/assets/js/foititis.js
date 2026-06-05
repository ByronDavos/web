import { API } from './api.js';

async function loadMyThesis(){
const data = await API.theses.mine();
const container = document.getElementById('myThesis');
if (!data.length) return container.innerHTML = '<em>Δεν έχει ανατεθεί διπλωματική.</em>';
const t = data[0];
container.innerHTML = `<h5>${t.title}</h5><span class="badge bg-info">${t.status}</span>`;
}

async function inviteMember(){
const f = document.getElementById('inviteForm');
f?.addEventListener('submit', async (e)=>{
e.preventDefault();
await API.invitations.create(Number(f.thesis_id.value), Number(f.faculty_id.value));
alert('Πρόσκληση στάλθηκε');
});
}

import { API } from './api.js';

async function uploadDraft(){
  const f = document.getElementById('draftForm');
  f?.addEventListener('submit', async (e)=>{
    e.preventDefault();

    // 1) Upload αρχείου
    const fd = new FormData();
    // ΠΡΟΣΟΧΗ: key = 'draft' (για να μπει στον φάκελο uploads/drafts/)
    fd.append('draft', f.draft.files[0]);

    const up = await API.files.upload(fd); // -> { path }

    // 2) Δήλωση draft στη διπλωματική
    await API.theses.draft(Number(f.thesis_id.value), up.path);

    // 3) Εμφάνιση συνδέσμου στο UI
    document.getElementById('draftLink').innerHTML =
      `<a href="${up.path}" target="_blank" rel="noopener">Πρόχειρο</a>`;

    alert('Το πρόχειρο ανέβηκε και δηλώθηκε στη διπλωματική.');
  });
}


window.foitLoad = () => { loadMyThesis(); inviteMember(); uploadDraft(); };