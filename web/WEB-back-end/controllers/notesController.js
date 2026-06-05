const db = require('../db');
const { required } = require('../middleware/validate');

exports.add = async (req, res, next) => {
  try {
    required(req.body, ['thesis_id', 'text']);
    const { thesis_id, text } = req.body;
    if (String(text).length > 300) return res.status(400).json({ error: 'Max 300 chars' });
    const [r] = await db.query(
      'INSERT INTO notes (thesis_id, author_id, text) VALUES (?,?,?)',
      [thesis_id, req.user.id, text]
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
};

exports.listMine = async (req, res, next) => {
  try {
    const { thesis_id } = req.params;
    const [rows] = await db.query(
      'SELECT id, text, created_at FROM notes WHERE thesis_id=? AND author_id=? ORDER BY id DESC',
      [thesis_id, req.user.id]
    );
    res.json(rows);
  } catch (e) { next(e); }
};
