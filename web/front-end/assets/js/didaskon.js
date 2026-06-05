import { API } from './api.js';

async function loadTopics(){
  const list = document.getElementById('topicsList');
  const data = await API.topics.listMine();
  list.innerHTML = data.map(t => `
    <li class="list-group-item d-flex justify-content-between align-items-start">
      <div>
        <h6 class="mb-1">${t.title}</h6>
        <small class="text-muted">${t.summary}</small><br>
        ${t.pdf ? `<small><a href="${t.pdf}" target="_blank">📄 PDF</a></small>` : ''}
      </div>
      <button class="btn btn-sm btn-outline-secondary" data-id="${t.id}">✏️ Επεξεργασία</button>
    </li>`).join('');
}

async function createTopic(){
  const f = document.getElementById('topicForm');
  f?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title   = f.elements['title'].value;
    const summary = f.elements['summary'].value;

    // ανέβασμα pdf (αν υπάρχει)
    let pdfPath = null;
    const file = f.elements['pdf']?.files?.[0];
    if (file){
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('http://localhost:3000/api/files/upload', {
        method:'POST',
        headers: { 'Authorization': 'Bearer '+localStorage.getItem('jwt') },
        body: fd
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Upload failed');
      pdfPath = j.path;
    }

    await API.topics.create({ title, summary, pdf: pdfPath });
    f.reset();
    await loadTopics();
  });
}

async function assignThesis(){
  const f = document.getElementById('assignmentForm');
  f?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // εδώ προς το παρόν μόνο demo alert (τα πραγματικά πεδία topic_id/student_id θα τα δέσεις όταν
    // προσθέσεις autocomplete/αναζήτηση). Το toggle λειτουργεί ήδη από το showSection.
    alert('Υποβολή ανάθεσης – συμπλήρωσε topic_id / student_id όταν είναι έτοιμο το backend UI');
  });
}

// δημοσιεύουμε helper για lazy reload ανά section (το καλεί το showSection)
window.didReloadSection = (sectionId) => {
  if (sectionId === 'section-themata') loadTopics();
  // πρόσθεσε αντίστοιχα όταν υλοποιήσεις τα υπόλοιπα:
  // if (sectionId === 'section-proskliseis') loadInvitations();
  // if (sectionId === 'section-statistika') loadStats();
};

window.didLoad = () => {
  loadTopics();
  createTopic();
  assignThesis();
};
