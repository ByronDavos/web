const db = require('../db');
const { required } = require('../middleware/validate');

exports.listMine = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, title, summary, description_file AS pdf FROM thesis_topics WHERE created_by = ? ORDER BY id DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    required(req.body, ['title', 'summary']);
    const { title, summary, pdf } = req.body; // pdf -> description_file
    const [r] = await db.query(
      'INSERT INTO thesis_topics (title, summary, description_file, created_by) VALUES (?,?,?,?)',
      [title, summary, pdf || null, req.user.id]
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, summary, pdf } = req.body;
    await db.query(
      'UPDATE thesis_topics SET title = COALESCE(?, title), summary = COALESCE(?, summary), description_file = COALESCE(?, description_file) WHERE id = ? AND created_by = ?',
      [title, summary, pdf, id, req.user.id]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
};