const db = require('../db');
const { required } = require('../middleware/validate');

exports.assignToStudent = async (req, res, next) => {
  try {
    required(req.body, ['topic_id', 'student_id']);
    const { topic_id, student_id } = req.body;

    const [r] = await db.query(
      'INSERT INTO theses (topic_id, student_id, supervisor_id, status, started_at) VALUES (?,?,?,?,CURDATE())',
      [topic_id, student_id, req.user.id, 'proposed']
    );
    const thesisId = r.insertId;

    await db.query(
      'INSERT INTO status_history (thesis_id, from_status, to_status, changed_by) VALUES (?,?,?,?)',
      [thesisId, null, 'proposed', req.user.id]
    );

    res.status(201).json({ id: thesisId });
  } catch (e) { next(e); }
};

exports.listMine = async (req, res, next) => {
  try {
    let sql = `
      SELECT t.id, t.status, tp.title,
             s.first_name AS student_first_name, s.last_name AS student_last_name
      FROM theses t
      JOIN thesis_topics tp ON tp.id = t.topic_id
      JOIN users s ON s.id = t.student_id
      WHERE 1=1`;
    const params = [];

    if (req.user.role === 'faculty') {
      sql += ' AND (t.supervisor_id = ? OR EXISTS (SELECT 1 FROM committee_members cm WHERE cm.thesis_id=t.id AND cm.faculty_id=?))';
      params.push(req.user.id, req.user.id);
    }
    if (req.user.role === 'student') {
      sql += ' AND t.student_id = ?';
      params.push(req.user.id);
    }
    // secretariat: βλέπει τα πάντα – δεν φιλτράρουμε

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
};

exports.changeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    required(req.body, ['status']);
    const { status, reason } = req.body;

    const [[curr]] = await db.query('SELECT status FROM theses WHERE id=?', [id]);
    await db.query('UPDATE theses SET status=? WHERE id=?', [status, id]);
    await db.query(
      'INSERT INTO status_history (thesis_id, from_status, to_status, changed_by, reason) VALUES (?,?,?,?,?)',
      [id, curr ? curr.status : null, status, req.user.id, reason || null]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
};

const db = require('../db');
const { required } = require('../middleware/validate');
const { create } = require('xmlbuilder2'); // για HTML πρακτικού – θα φτιάξουμε απλό string

// --- Student: δήλωση ημερομηνίας/χώρου/συνδέσμου εξέτασης ---
exports.setReviewInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    required(req.body, ['review_date']);
    const { review_date, review_location, link } = req.body;
    // Επιτρέπεται μόνο στον φοιτητή της συγκεκριμένης ΔΕ
    const [[t]] = await db.query('SELECT student_id, status FROM theses WHERE id=?', [id]);
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (t.student_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (t.status !== 'under_review' && t.status !== 'under examination' && t.status !== 'under_review') {
      // στο schema σου το state είναι strings τύπου proposed/active/under_review/... – προσαρμόσου αν χρειαστεί
    }
    await db.query(
      'UPDATE theses SET review_date=?, review_location=? WHERE id=?',
      [review_date, review_location || null, id]
    );
    if (link) {
      await db.query(
        'INSERT INTO presentation_announcements (thesis_id, title, scheduled_at, location, link) VALUES (?,?,?,?,?)',
        [id, null, review_date, review_location || null, link]
      );
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
};

// --- Student: καταχώρηση draft file (λαμβάνει relative path από /files/upload) ---
exports.attachDraftFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    required(req.body, ['path']);
    const { path } = req.body;
    const [[t]] = await db.query('SELECT student_id FROM theses WHERE id=?', [id]);
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (t.student_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await db.query('UPDATE theses SET draft_file=? WHERE id=?', [path, id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
};

// --- Student: προσθήκη/λίστα URLs πρόσθετου υλικού ---
exports.addLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    required(req.body, ['url']);
    const { url, label } = req.body;
    const [[t]] = await db.query('SELECT student_id FROM theses WHERE id=?', [id]);
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (t.student_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const [r] = await db.query('INSERT INTO thesis_links (thesis_id, url, label) VALUES (?,?,?)', [id, url, label || null]);
    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
};

exports.listLinks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT id, url, label, created_at FROM thesis_links WHERE thesis_id=? ORDER BY id DESC', [id]);
    res.json(rows);
  } catch (e) { next(e); }
};

// --- Student: δήλωση συνδέσμου Νημερτής (repository) ---
exports.setRepositoryUrl = async (req, res, next) => {
  try {
    const { id } = req.params;
    required(req.body, ['repository_url']);
    const { repository_url } = req.body;
    const [[t]] = await db.query('SELECT student_id FROM theses WHERE id=?', [id]);
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (t.student_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await db.query('UPDATE theses SET repository_url=? WHERE id=?', [repository_url, id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
};

// --- Secretariat: καταχώρηση ΑΠ ΓΣ ---
exports.setGSDecision = async (req, res, next) => {
  try {
    const { id } = req.params;
    required(req.body, ['decision_no']);
    await db.query('UPDATE theses SET secretariat_decision_no=? WHERE id=?', [req.body.decision_no, id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
};

// --- Ακύρωση ανάθεσης (μπορεί και ο επιβλέπων, ή η Γραμματεία) ---
exports.cancel = async (req, res, next) => {
  try {
    const { id } = req.params;
    required(req.body, ['reason']);
    const [[curr]] = await db.query('SELECT status FROM theses WHERE id=?', [id]);
    await db.query('UPDATE theses SET status=? WHERE id=?', ['cancelled', id]);
    await db.query(
      'INSERT INTO status_history (thesis_id, from_status, to_status, changed_by, reason) VALUES (?,?,?,?,?)',
      [id, curr ? curr.status : null, 'cancelled', req.user.id, req.body.reason]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
};

// --- Ολοκλήρωση (Περατωμένη) από Γραμματεία, εφόσον υπάρχουν βαθμοί + repo url ---
exports.completeIfEligible = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[t]] = await db.query('SELECT repository_url, status FROM theses WHERE id=?', [id]);
    if (!t) return res.status(404).json({ error: 'Not found' });

    // πρέπει να υπάρχουν 3 βαθμοί (ή όσα μέλη) και repository url
    const [[{ graders }]] = await db.query('SELECT COUNT(*) AS graders FROM grades WHERE thesis_id=?', [id]);
    if (!t.repository_url || graders < 3) return res.status(400).json({ error: 'Missing grades or repository URL' });

    await db.query('UPDATE theses SET status=?, completed_at=CURDATE() WHERE id=?', ['completed', id]);
    await db.query(
      'INSERT INTO status_history (thesis_id, from_status, to_status, changed_by) VALUES (?,?,?,?)',
      [id, t.status, 'completed', req.user.id]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
};

// --- HTML πρακτικό (βασικό) για προβολή από φοιτητή και μέλη τριμελούς ---
exports.praktikoHtml = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[th]] = await db.query(
      `SELECT t.id, t.repository_url, t.secretariat_decision_no, t.review_date, t.review_location,
              s.first_name AS s_fn, s.last_name AS s_ln,
              tp.title
       FROM theses t
       JOIN users s ON s.id=t.student_id
       LEFT JOIN thesis_topics tp ON tp.id=t.topic_id
       WHERE t.id=?`, [id]
    );
    if (!th) return res.status(404).send('Not found');

    const [cm] = await db.query(
      `SELECT u.first_name, u.last_name, cm.is_supervisor
       FROM committee_members cm JOIN users u ON u.id=cm.faculty_id
       WHERE cm.thesis_id=?`, [id]
    );
    const [grades] = await db.query(
      `SELECT u.first_name, u.last_name, g.overall, g.criterion_1, g.criterion_2, g.criterion_3
       FROM grades g JOIN users u ON u.id=g.grader_id WHERE g.thesis_id=?`, [id]
    );

    // απλό HTML (μπορείς αργότερα να το βάλεις σε template)
    const avg = grades.length ? (grades.reduce((a,b)=>a+Number(b.overall||0),0)/grades.length).toFixed(2) : '-';
    const html = `
<!doctype html><html lang="el"><meta charset="utf-8">
<title>Πρακτικό εξέτασης</title>
<style>body{font-family:sans-serif;max-width:850px;margin:40px auto;padding:20px}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px}</style>
<h2>Πρακτικό εξέτασης διπλωματικής</h2>
<p><b>Θέμα:</b> ${th.title || ''}</p>
<p><b>Φοιτητής/τρια:</b> ${th.s_ln} ${th.s_fn}</p>
<p><b>Ημ/νια – Χώρος:</b> ${th.review_date || '-'} – ${th.review_location || '-'}</p>
<p><b>ΑΠ ΓΣ:</b> ${th.secretariat_decision_no || '-'}</p>
<h3>Τριμελής</h3>
<ul>${cm.map(m=>`<li>${m.last_name} ${m.first_name}${m.is_supervisor?' (Επιβλέπων/ουσα)':''}</li>`).join('')}</ul>
<h3>Βαθμολογίες</h3>
<table>
<tr><th>Μέλος</th><th>Κριτ.1</th><th>Κριτ.2</th><th>Κριτ.3</th><th>Συνολικός</th></tr>
${grades.map(g=>`<tr><td>${g.last_name} ${g.first_name}</td><td>${g.criterion_1??''}</td><td>${g.criterion_2??''}</td><td>${g.criterion_3??''}</td><td>${g.overall??''}</td></tr>`).join('')}
<tr><th colspan="4" style="text-align:right">Μέσος όρος</th><th>${avg}</th></tr>
</table>
<p><b>Νημερτής:</b> ${th.repository_url ? `<a href="${th.repository_url}">${th.repository_url}</a>` : '-'}</p>
</html>`;
    res.type('text/html').send(html);
  } catch (e) { next(e); }
};

// --- Export CSV/JSON για διδάσκοντα ---
exports.exportMine = async (req, res, next) => {
  try {
    const { format='csv', status, role } = req.query;
    let sql = `
      SELECT t.id, t.status, tp.title, s.first_name AS s_fn, s.last_name AS s_ln,
             t.started_at, t.completed_at
      FROM theses t
      LEFT JOIN thesis_topics tp ON tp.id=t.topic_id
      JOIN users s ON s.id=t.student_id
      LEFT JOIN committee_members cm ON cm.thesis_id=t.id
      WHERE 1=1`;
    const params = [];
    if (role === 'supervisor') { sql += ' AND t.supervisor_id=?'; params.push(req.user.id); }
    else { sql += ' AND cm.faculty_id=?'; params.push(req.user.id); }
    if (status) { sql += ' AND t.status=?'; params.push(status); }
    sql += ' GROUP BY t.id ORDER BY t.id DESC';

    const [rows] = await db.query(sql, params);

    if (String(format).toLowerCase() === 'json') return res.json(rows);

    // CSV
    const header = 'id,status,title,student,started_at,completed_at\n';
    const csv = header + rows.map(r => [
      r.id, r.status, `"${(r.title||'').replace(/"/g,'""')}"`,
      `"${(r.s_ln + ' ' + r.s_fn).replace(/"/g,'""')}"`,
      r.started_at || '', r.completed_at || ''
    ].join(',')).join('\n');
    res.type('text/csv').send(csv);
  } catch (e) { next(e); }
};
