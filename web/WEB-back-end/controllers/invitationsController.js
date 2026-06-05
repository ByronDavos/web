const db = require('../db');
const { required } = require('../middleware/validate');
const { io } = require('../app');

exports.create = async (req, res, next) => {
  try {
    required(req.body, ['thesis_id', 'faculty_id']);
    const { thesis_id, faculty_id } = req.body;
    const [r] = await db.query(
      'INSERT INTO committee_invitations (thesis_id, invitee_id, response) VALUES (?,?,?)',
      [thesis_id, faculty_id, 'pending']
    );
    const [[inv]] = await db.query('SELECT * FROM committee_invitations WHERE id=?', [r.insertId]);
  // Στείλε real-time στον καθηγητή
    io.to(`user:${faculty_id}`).emit('invitation:new', inv);
    res.status(201).json(inv);
  } catch (e) { next(e); }
};

exports.listMine = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT i.id, i.thesis_id, tp.title, i.invited_at
       FROM committee_invitations i
       JOIN theses t ON t.id = i.thesis_id
       JOIN thesis_topics tp ON tp.id = t.topic_id
       WHERE i.invitee_id=? AND i.response='pending'
       ORDER BY i.invited_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { next(e); }
};

async function maybeActivateThesis(thesisId) {
  const [[{ cnt }]] = await db.query(
    'SELECT COUNT(*) AS cnt FROM committee_members WHERE thesis_id=?',
    [thesisId]
  );
  if (cnt >= 2) {
    await db.query('UPDATE theses SET status=? WHERE id=?', ['active', thesisId]);
    await db.query(
      'INSERT INTO status_history (thesis_id, from_status, to_status) VALUES (?,?,?)',
      [thesisId, 'proposed', 'active']
    );
    await db.query(
      "UPDATE committee_invitations SET response='rejected' WHERE thesis_id=? AND response='pending'",
      [thesisId]
    );
  }
}

exports.accept = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[inv]] = await db.query(
      'SELECT * FROM committee_invitations WHERE id=? AND invitee_id=?',
      [id, req.user.id]
    );
    if (!inv) return res.status(404).json({ error: 'Not found' });

    await db.query("UPDATE committee_invitations SET response='accepted', responded_at=NOW() WHERE id=?", [id]);
    await db.query('INSERT IGNORE INTO committee_members (thesis_id, faculty_id, is_supervisor) VALUES (?,?,0)',
      [inv.thesis_id, req.user.id]);
    await maybeActivateThesis(inv.thesis_id);
    const [[updated]] = await db.query('SELECT * FROM committee_invitations WHERE id=?', [id]);

    // Βρες τον φοιτητή και επιβλέποντα αυτής της thesis
    const [[who]] = await db.query('SELECT student_id, supervisor_id FROM theses WHERE id=?', [inv.thesis_id]);
    if (who?.student_id)    io.to(`user:${who.student_id}`).emit('invitation:updated', updated);
    if (who?.supervisor_id) io.to(`user:${who.supervisor_id}`).emit('invitation:updated', updated);

    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.decline = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query("UPDATE committee_invitations SET response='rejected', responded_at=NOW() WHERE id=? AND invitee_id=?",
      [id, req.user.id]);
    -    res.json({ ok: true });
    const [[updated]] = await db.query('SELECT * FROM committee_invitations WHERE id=?', [id]);
    const [[who]] = await db.query('SELECT student_id, supervisor_id FROM theses WHERE id=?', [updated.thesis_id]);
    if (who?.student_id)    io.to(`user:${who.student_id}`).emit('invitation:updated', updated);
    if (who?.supervisor_id) io.to(`user:${who.supervisor_id}`).emit('invitation:updated', updated);

    res.json({ ok: true });

  } catch (e) { next(e); }
};